module Kidspire
  module Api
    module V1
      class MinistrySyncSettingsController < BaseController
        before_action :require_admin!

        def show
          render json: MinistrySyncSettingBlueprint.render(SyncSetting.current)
        end

        def update
          settings = SyncSetting.current
          if settings.update(sync_setting_params)
            render json: MinistrySyncSettingBlueprint.render(settings)
          else
            render json: { error: settings.errors.full_messages.first, code: "validation_error" },
                   status: :unprocessable_entity
          end
        end

        private

        def sync_setting_params
          params.require(:sync_setting).permit(:inbound_events_sync, :outbound_registrations_sync)
        end
      end
    end
  end
end
