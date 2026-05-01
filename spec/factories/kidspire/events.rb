FactoryBot.define do
  factory :kidspire_event, class: "Kidspire::Event" do
    sequence(:title) { |n| "Kids Event #{n}" }
    description { "A fun event for kids" }
    event_date  { 1.week.from_now }
    capacity    { nil }

    trait :past do
      event_date { 1.week.ago }
    end

    trait :with_capacity do
      capacity { 10 }
    end

    trait :with_age_range do
      age_min { 5 }
      age_max { 12 }
    end
  end
end
