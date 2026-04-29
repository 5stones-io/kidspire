module Kidsmin
  class Registration < ApplicationRecord
    belongs_to :family
    belongs_to :event
    belongs_to :child

    validates :child_id, uniqueness: { scope: :event_id, message: "is already registered for this event" }
    validate  :child_belongs_to_family
    validate  :event_not_full, on: :create
    validate  :child_age_eligible, on: :create

    after_commit :enqueue_outbound_registration_sync, on: :create

    private

    def child_belongs_to_family
      return if child.nil? || family.nil?
      errors.add(:child, "does not belong to this family") unless child.family_id == family_id
    end

    def event_not_full
      return if event.nil?
      errors.add(:event, "is full") if event.full?
    end

    def child_age_eligible
      return if event.nil? || child.nil?
      errors.add(:child, "is not in the eligible age range for this event") unless event.age_eligible?(child)
    end

    def enqueue_outbound_registration_sync
      return unless family&.pco_sync_enabled?
      return unless SyncSetting.current.outbound_registrations_sync?

      Kidsmin::PcoOutboundRegistrationSyncJob.perform_later(id)
    end
  end
end
