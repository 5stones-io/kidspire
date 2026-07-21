require "rails_helper"

RSpec.describe "Ministry sync settings API", type: :request do
  describe "GET /api/v1/ministry_sync_settings" do
    it "requires admin" do
      account = create(:account)
      get "/api/v1/ministry_sync_settings", headers: auth_headers(account)
      expect(response).to have_http_status(:forbidden)
    end

    it "returns the narrowed ministry-only flags for an admin" do
      admin = create(:account, admin: true)
      get "/api/v1/ministry_sync_settings", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body).to include("inbound_events_sync", "outbound_registrations_sync")
      expect(body).not_to have_key("inbound_people_sync")
    end
  end

  describe "PATCH /api/v1/ministry_sync_settings" do
    it "updates the ministry-only flags" do
      admin = create(:account, admin: true)
      patch "/api/v1/ministry_sync_settings",
            params: { sync_setting: { outbound_registrations_sync: true } },
            headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["outbound_registrations_sync"]).to be(true)
    end
  end
end
