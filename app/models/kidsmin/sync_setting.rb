module Kidsmin
  class SyncSetting < ApplicationRecord
    CONFLICT_STRATEGIES = %w[pco_wins kidsmin_wins newest_wins].freeze

    validates :conflict_resolution, inclusion: { in: CONFLICT_STRATEGIES }
    validates :sync_frequency_hours, numericality: { greater_than: 0, only_integer: true }

    def self.current
      first_or_create!(
        inbound_people_sync:         true,
        outbound_people_sync:        false,
        inbound_events_sync:         true,
        outbound_registrations_sync: false,
        sync_frequency_hours:        6,
        conflict_resolution:         "pco_wins"
      )
    end
  end
end
