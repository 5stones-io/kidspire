module Kidspire
  class PcoOutboundRegistrationSyncJob < ApplicationJob
    def perform(registration_id)
      registration = Registration.includes(:family, :child, :event).find(registration_id)
      family       = registration.family
      child        = registration.child
      event        = registration.event

      return unless family.pco_sync_enabled?
      return unless SyncSetting.current.outbound_registrations_sync?
      return if registration.synced_to_pco?

      unless child.pco_person_id.present? && event.pco_event_id.present?
        Rails.logger.info(
          "[Kidspire] PcoOutboundRegistrationSyncJob skipped for registration #{registration_id} " \
          "— child or event not linked to PCO"
        )
        return
      end

      client = PcoClient.new

      if event.pco_source == "check_ins"
        sync_as_checkin(client, registration, child, event)
      else
        Rails.logger.info(
          "[Kidspire] PcoOutboundRegistrationSyncJob: calendar event #{event.pco_event_id} — " \
          "PCO Registrations API not implemented in v1, marking synced"
        )
      end

      registration.update_columns(synced_to_pco: true, pco_synced_at: Time.current)
      Rails.logger.info("[Kidspire] PcoOutboundRegistrationSyncJob complete for registration #{registration_id}")
    rescue ActiveRecord::RecordNotFound
      Rails.logger.warn("[Kidspire] PcoOutboundRegistrationSyncJob: registration #{registration_id} not found, discarding")
    rescue PcoError => e
      Rails.logger.error("[Kidspire] PcoOutboundRegistrationSyncJob failed for registration #{registration_id}: #{e.message}")
      raise
    end

    private

    def sync_as_checkin(client, registration, child, event)
      # Fetch the first EventTime for this event to attach the check-in to
      event_times = client.get_all("/check_ins/v2/events/#{event.pco_event_id}/event_times")
      event_time  = event_times.first

      unless event_time
        Rails.logger.warn("[Kidspire] No EventTime found for PCO event #{event.pco_event_id} — skipping check-in creation")
        return
      end

      client.post("/check_ins/v2/check_ins", {
        data: {
          type:       "CheckIn",
          attributes: {
            first_name: child.first_name,
            last_name:  child.last_name,
            kind:       "Regular"
          },
          relationships: {
            event_times: { data: [{ type: "EventTime", id: event_time["id"] }] },
            person:      { data: { type: "Person", id: child.pco_person_id } }
          }
        }
      })
    end
  end
end
