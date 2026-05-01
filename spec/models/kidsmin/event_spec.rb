require "rails_helper"

RSpec.describe Kidsmin::Event, type: :model do
  describe "validations" do
    it "is valid with required fields" do
      expect(build(:kidsmin_event)).to be_valid
    end

    it "requires title" do
      expect(build(:kidsmin_event, title: "")).not_to be_valid
    end

    it "requires event_date" do
      expect(build(:kidsmin_event, event_date: nil)).not_to be_valid
    end

    it "rejects an unknown pco_source" do
      expect(build(:kidsmin_event, pco_source: "unknown")).not_to be_valid
    end

    it "accepts valid pco_source values" do
      expect(build(:kidsmin_event, pco_source: "calendar")).to be_valid
      expect(build(:kidsmin_event, pco_source: "check_ins")).to be_valid
      expect(build(:kidsmin_event, pco_source: nil)).to be_valid
    end
  end

  describe ".upcoming" do
    it "includes future events and excludes past ones" do
      future = create(:kidsmin_event)
      past   = create(:kidsmin_event, :past)
      expect(Kidsmin::Event.upcoming).to include(future)
      expect(Kidsmin::Event.upcoming).not_to include(past)
    end
  end

  describe "#spots_remaining" do
    it "returns nil when capacity is not set" do
      expect(build(:kidsmin_event, capacity: nil).spots_remaining).to be_nil
    end

    it "returns capacity minus current registration count" do
      event = create(:kidsmin_event, :with_capacity)
      create(:kidsmin_registration, event: event)
      expect(event.spots_remaining).to eq(9)
    end
  end

  describe "#full?" do
    it "returns false when spots remain" do
      event = create(:kidsmin_event, capacity: 2)
      create(:kidsmin_registration, event: event)
      expect(event.full?).to be false
    end

    it "returns true when at capacity" do
      event = create(:kidsmin_event, capacity: 1)
      create(:kidsmin_registration, event: event)
      expect(event.full?).to be true
    end
  end

  describe "#age_eligible?" do
    let(:child) { build(:kidsmin_child, birthdate: 8.years.ago.to_date) }

    it "returns true when no age range is set" do
      expect(build(:kidsmin_event).age_eligible?(child)).to be true
    end

    it "returns true when the child is in range" do
      event = build(:kidsmin_event, :with_age_range)
      expect(event.age_eligible?(child)).to be true
    end

    it "returns false when the child is too young" do
      event = build(:kidsmin_event, age_min: 10, age_max: 15)
      expect(event.age_eligible?(child)).to be false
    end

    it "returns false when the child is too old" do
      event = build(:kidsmin_event, age_min: 2, age_max: 6)
      expect(event.age_eligible?(child)).to be false
    end
  end
end
