module Kidsmin
  class RegistrationBlueprint < ::Blueprinter::Base
    identifier :id

    fields :synced_to_pco, :pco_synced_at, :created_at

    field :family_id
    field :event_id
    field :child_id

    association :event, blueprint: EventBlueprint
    association :child, blueprint: ChildBlueprint
  end
end
