module Kidspire
  class SyncSetting < ApplicationRecord
    def self.current
      first_or_create!(
        inbound_events_sync:         true,
        outbound_registrations_sync: false
      )
    end
  end
end
