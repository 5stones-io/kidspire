module Kidspire
  class EventBlueprint < ::Blueprinter::Base
    identifier :id

    fields :title, :description, :location, :event_date,
           :age_min, :age_max, :capacity, :pco_source, :created_at, :updated_at

    field :spots_remaining
    field(:full) { |e| e.full? }

    view :detail do
      field :registrations_count do |event|
        event.registrations.count
      end
    end
  end
end
