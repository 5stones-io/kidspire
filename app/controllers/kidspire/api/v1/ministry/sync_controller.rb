module Kidspire
  module Api
    module V1
      module Ministry
        class SyncController < BaseController
          before_action :require_admin!

          def trigger
            settings = Kidspire::SyncSetting.current
            enqueued = []

            if settings.inbound_events_sync?
              Kidspire::PcoInboundEventsSyncJob.perform_later
              enqueued << "inbound_events"
            end

            if settings.outbound_registrations_sync?
              Kidspire::Registration.where(synced_to_pco: false).find_each do |reg|
                Kidspire::PcoOutboundRegistrationSyncJob.perform_later(reg.id)
              end
              enqueued << "outbound_registrations"
            end

            render json: { status: "started", enqueued: enqueued, timestamp: Time.current.iso8601 }
          end
        end
      end
    end
  end
end
