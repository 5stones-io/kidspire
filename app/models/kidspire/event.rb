module Kidspire
  class Event < ApplicationRecord
    PCO_SOURCES = %w[calendar check_ins].freeze

    has_many :registrations, dependent: :destroy

    validates :title,      presence: true
    validates :event_date, presence: true
    validates :pco_source, inclusion: { in: PCO_SOURCES }, allow_nil: true
    validates :age_min, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
    validates :age_max, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

    scope :upcoming, -> { where("event_date >= ?", Time.current).order(:event_date) }
    scope :past,     -> { where("event_date < ?",  Time.current).order(event_date: :desc) }
    scope :from_pco, -> { where.not(pco_event_id: nil) }

    def spots_remaining
      return nil if capacity.nil?
      capacity - registrations.count
    end

    def full?
      spots_remaining&.zero?
    end

    def age_eligible?(child)
      return true if age_min.nil? && age_max.nil?
      return true if child.age.nil?
      return false if age_min && child.age < age_min
      return false if age_max && child.age > age_max
      true
    end
  end
end
