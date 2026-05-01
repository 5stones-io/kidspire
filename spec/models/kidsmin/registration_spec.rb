require "rails_helper"

RSpec.describe Kidsmin::Registration, type: :model do
  describe "validations" do
    it "is valid with a family, event, and child from the same family" do
      expect(build(:kidsmin_registration)).to be_valid
    end

    it "prevents duplicate registration for the same child and event" do
      existing  = create(:kidsmin_registration)
      duplicate = build(:kidsmin_registration,
        family: existing.family,
        event:  existing.event,
        child:  existing.child)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:child_id]).to be_present
    end

    it "prevents registering a child who belongs to a different family" do
      family_a  = create(:kidsmin_family)
      family_b  = create(:kidsmin_family)
      child_b   = create(:kidsmin_child, family: family_b)
      event     = create(:kidsmin_event)
      reg = build(:kidsmin_registration, family: family_a, event: event, child: child_b)
      expect(reg).not_to be_valid
      expect(reg.errors[:child]).to include("does not belong to this family")
    end

    it "prevents registration when the event is full" do
      event   = create(:kidsmin_event, capacity: 1)
      create(:kidsmin_registration, event: event)
      family  = create(:kidsmin_family)
      child   = create(:kidsmin_child, family: family)
      reg = build(:kidsmin_registration, event: event, family: family, child: child)
      expect(reg).not_to be_valid
      expect(reg.errors[:event]).to include("is full")
    end

    it "prevents registering a child outside the event's age range" do
      event      = create(:kidsmin_event, age_min: 10, age_max: 15)
      family     = create(:kidsmin_family)
      young_child = create(:kidsmin_child, family: family, birthdate: 6.years.ago.to_date)
      reg = build(:kidsmin_registration, event: event, family: family, child: young_child)
      expect(reg).not_to be_valid
      expect(reg.errors[:child]).to include("is not in the eligible age range for this event")
    end
  end
end
