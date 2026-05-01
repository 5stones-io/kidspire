FactoryBot.define do
  factory :kidspire_registration, class: "Kidspire::Registration" do
    association :event,  factory: :kidspire_event
    association :family, factory: :kidspire_family

    after(:build) do |reg|
      # modern FactoryBot uses build strategy for associations when the parent
      # is built, so family may be unsaved and family_id nil. Persist first.
      reg.family.save! if reg.family&.new_record?
      reg.family_id = reg.family.id
      reg.child ||= create(:kidspire_child, family: reg.family)
    end
  end
end
