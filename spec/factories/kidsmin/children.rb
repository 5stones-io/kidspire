FactoryBot.define do
  factory :kidsmin_child, class: "Kidsmin::Child" do
    association :family, factory: :kidsmin_family
    first_name { Faker::Name.first_name }
    last_name  { Faker::Name.last_name }
    birthdate  { 8.years.ago.to_date }
    grade      { 3 }
  end
end
