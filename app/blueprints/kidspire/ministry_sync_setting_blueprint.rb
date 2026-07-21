module Kidspire
  class MinistrySyncSettingBlueprint < ::Blueprinter::Base
    identifier :id

    fields :inbound_events_sync, :outbound_registrations_sync, :last_synced_at, :updated_at
  end
end
