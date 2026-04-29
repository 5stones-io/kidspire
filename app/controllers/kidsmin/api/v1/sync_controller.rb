module Kidsmin
  module Api
    module V1
      class SyncController < BaseController
        before_action :require_admin!

        def trigger
          settings = SyncSetting.current
          enqueued = []

          if settings.inbound_people_sync?
            Kidsmin::PcoInboundPeopleSyncJob.perform_later
            enqueued << "inbound_people"
          end

          if settings.inbound_events_sync?
            Kidsmin::PcoInboundEventsSyncJob.perform_later
            enqueued << "inbound_events"
          end

          if settings.outbound_people_sync?
            Kidsmin::Family.where(pco_sync_enabled: true).find_each do |family|
              Kidsmin::PcoOutboundProfileSyncJob.perform_later(family.id)
            end
            enqueued << "outbound_people"
          end

          if settings.outbound_registrations_sync?
            Kidsmin::Registration.where(synced_to_pco: false).find_each do |reg|
              Kidsmin::PcoOutboundRegistrationSyncJob.perform_later(reg.id)
            end
            enqueued << "outbound_registrations"
          end

          render json: { status: "started", enqueued: enqueued, timestamp: Time.current.iso8601 }
        end
      end
    end
  end
end
