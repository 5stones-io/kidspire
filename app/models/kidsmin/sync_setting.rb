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
        conflict_resolution:         "pco_wins",
        auto_sync_enabled:           false,
        pco_kids_ministry_tag:       nil
      )
    end

    # Reads tag from DB; falls back to the env var so existing deployments
    # continue working before the settings page is used for the first time.
    def effective_ministry_tag
      pco_kids_ministry_tag.presence ||
        Kidsmin.configuration.pco_kids_ministry_tag.presence
    end
  end
end
