FactoryBot.define do
  factory :kidsmin_family, class: "Kidsmin::Family" do
    association :account
    sequence(:family_name) { |n| "Family #{n}" }
    primary_contact_first_name { "Jane" }
    primary_contact_last_name  { Faker::Name.last_name }
    sequence(:email) { |n| "family#{n}@example.com" }
    phone { "555-0100" }
    pco_sync_enabled { false }
  end
end
