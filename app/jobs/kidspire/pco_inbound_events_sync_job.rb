module Kidspire
  class PcoInboundEventsSyncJob < ApplicationJob
    def perform
      return unless SyncSetting.current.inbound_events_sync?

      client = PcoClient.new
      sync_calendar_events(client)
      sync_checkins_events(client)

      SyncSetting.current.update!(last_synced_at: Time.current)
      Rails.logger.info("[Kidspire] PcoInboundEventsSyncJob complete")
    rescue PcoError => e
      Rails.logger.error("[Kidspire] PcoInboundEventsSyncJob failed: #{e.message}")
      raise
    end

    private

    def sync_calendar_events(client)
      params = { filter: "future" }
      params[:tag_ids] = tag_id(client) if ministry_tag.present?

      events = client.get_all("/calendar/v2/events", params)
      events.each { |e| upsert_event(e, "calendar") }
    rescue PcoApiError => e
      Rails.logger.warn("[Kidspire] Calendar events sync skipped (#{e.status}): #{e.message}")
    end

    def sync_checkins_events(client)
      events = client.get_all("/check_ins/v2/events", archived: false)
      events.each { |e| upsert_event(e, "check_ins") }
    rescue PcoApiError => e
      Rails.logger.warn("[Kidspire] CheckIns events sync skipped (#{e.status}): #{e.message}")
    end

    def upsert_event(pco_event, source)
      pco_id = pco_event["id"]
      attrs  = pco_event["attributes"]

      event = Event.find_by(pco_event_id: pco_id) || Event.new

      event.assign_attributes(
        title:              attrs["name"] || attrs["title"] || "Unnamed Event",
        description:        attrs["description"],
        location:           attrs["location"],
        event_date:         parse_date(attrs),
        pco_event_id:       pco_id,
        pco_source:         source,
        pco_last_synced_at: Time.current
      )

      event.save! if event.changed?
    rescue => e
      Rails.logger.error("[Kidspire] Failed to upsert event pco_id=#{pco_event["id"]}: #{e.message}")
    end

    def parse_date(attrs)
      # Calendar events use "starts_at"; CheckIns events use "frequency" + times
      attrs["starts_at"] || attrs["next_occurrence"] || attrs["created_at"]
    end

    def ministry_tag
      SyncSetting.current.effective_ministry_tag
    end

    def tag_id(client)
      tags = client.get_all("/calendar/v2/tags", name: ministry_tag)
      tags.find { |t| t.dig("attributes", "name") == ministry_tag }&.fetch("id")
    end
  end
end
