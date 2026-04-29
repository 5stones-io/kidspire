module Kidsmin
  module Api
    module V1
      class SyncSettingsController < BaseController
        before_action :require_admin!

        def show
          render json: SyncSettingBlueprint.render(SyncSetting.current)
        end

        def update
          settings = SyncSetting.current
          if settings.update(sync_setting_params)
            render json: SyncSettingBlueprint.render(settings)
          else
            render json: { error: settings.errors.full_messages.first, code: "validation_error" },
                   status: :unprocessable_entity
          end
        end

        private

        def sync_setting_params
          params.require(:sync_setting).permit(
            :inbound_people_sync,
            :outbound_people_sync,
            :inbound_events_sync,
            :outbound_registrations_sync,
            :sync_frequency_hours,
            :conflict_resolution
          )
        end
      end
    end
  end
end
