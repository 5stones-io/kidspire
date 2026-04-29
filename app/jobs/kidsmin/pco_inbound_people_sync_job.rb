module Kidsmin
  class PcoInboundPeopleSyncJob < ApplicationJob
    def perform
      return unless SyncSetting.current.inbound_people_sync?

      client   = PcoClient.new
      response = client.paginate(
        "/people/v2/people",
        include: "households,emails,phone_numbers,addresses"
      )

      people     = response["data"]
      included   = response["included"]
      households = index_by_id(included, "Household")
      emails     = group_by_person(included, "Email")
      phones     = group_by_person(included, "PhoneNumber")
      addresses  = group_by_person(included, "Address")

      adults   = people.reject { |p| p.dig("attributes", "child") }
      children = people.select { |p| p.dig("attributes", "child") }

      # Adults first so Family records exist before children are linked
      adults.each   { |p| sync_family(p, households, emails, phones, addresses) }
      children.each { |p| sync_child(p, households) }

      SyncSetting.current.update!(last_synced_at: Time.current)
      Rails.logger.info("[Kidsmin] PcoInboundPeopleSyncJob complete — #{adults.size} adults, #{children.size} children")
    rescue PcoError => e
      Rails.logger.error("[Kidsmin] PcoInboundPeopleSyncJob failed: #{e.message}")
      raise
    end

    private

    def sync_family(person, households, emails, phones, addresses)
      pco_id       = person["id"]
      attrs        = person["attributes"]
      household_id = person.dig("relationships", "households", "data", 0, "id")
      household    = households[household_id]
      email        = primary_value(emails[pco_id], "address")
      phone        = primary_value(phones[pco_id], "number")
      address      = format_address(primary_record(addresses[pco_id]))

      family = Family.find_by(pco_person_id: pco_id) ||
               (email.present? && Family.find_by(email: email)) ||
               Family.new(supabase_uid: "pco_#{pco_id}")

      pco_attrs = {
        pco_person_id:      pco_id,
        pco_household_id:   household_id,
        pco_last_synced_at: Time.current
      }

      profile_attrs = {
        family_name:                  household&.dig("attributes", "name") ||
                                      "#{attrs["last_name"]} Family",
        primary_contact_first_name:   attrs["first_name"].to_s.strip,
        primary_contact_last_name:    attrs["last_name"].to_s.strip,
        email:                        email,
        phone:                        phone,
        address:                      address
      }

      strategy = SyncSetting.current.conflict_resolution

      if family.new_record? || strategy == "pco_wins"
        family.assign_attributes(pco_attrs.merge(profile_attrs))
      elsif strategy == "newest_wins"
        pco_updated = attrs["updated_at"]&.then { |t| Time.parse(t) }
        if pco_updated && pco_updated > (family.updated_at || Time.at(0))
          family.assign_attributes(pco_attrs.merge(profile_attrs))
        else
          family.assign_attributes(pco_attrs)
        end
      else
        # kidsmin_wins — only update PCO linkage, not profile fields
        family.assign_attributes(pco_attrs)
      end

      family.save! if family.changed?
    rescue => e
      Rails.logger.error("[Kidsmin] Failed to sync family pco_id=#{person["id"]}: #{e.message}")
    end

    def sync_child(person, households)
      pco_id       = person["id"]
      attrs        = person["attributes"]
      household_id = person.dig("relationships", "households", "data", 0, "id")
      family       = Family.find_by(pco_household_id: household_id)

      return unless family

      child = Child.find_by(pco_person_id: pco_id) ||
              family.children.find_by(
                first_name: attrs["first_name"],
                last_name:  attrs["last_name"]
              ) ||
              family.children.build

      child.assign_attributes(
        first_name:         attrs["first_name"] || "Unknown",
        last_name:          attrs["last_name"]  || "Unknown",
        birthdate:          attrs["birthdate"],
        grade:              attrs["grade"],           # PCO sends integer — model accepts it directly
        notes:              attrs["medical_notes"],   # PCO field name
        pco_person_id:      pco_id,
        pco_last_synced_at: Time.current
      )

      child.save! if child.changed?
    rescue => e
      Rails.logger.error("[Kidsmin] Failed to sync child pco_id=#{person["id"]}: #{e.message}")
    end

    def index_by_id(included, type)
      included.select { |r| r["type"] == type }.index_by { |r| r["id"] }
    end

    def group_by_person(included, type)
      included
        .select { |r| r["type"] == type }
        .group_by { |r| r.dig("relationships", "person", "data", "id") }
    end

    def primary_value(records, field)
      return nil if records.nil?
      primary = records.find { |r| r.dig("attributes", "primary") }
      (primary || records.first)&.dig("attributes", field)
    end

    def primary_record(records)
      return nil if records.nil?
      records.find { |r| r.dig("attributes", "primary") } || records.first
    end

    # Concatenate PCO address fields into a single string
    def format_address(record)
      return nil unless record
      a = record["attributes"] || {}
      parts = [
        a["street"],
        a["city"],
        [a["state"], a["zip"]].compact.join(" ")
      ].map(&:presence).compact
      parts.join(", ").presence
    end
  end
end
