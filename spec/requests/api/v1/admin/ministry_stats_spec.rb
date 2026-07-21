require "rails_helper"

RSpec.describe "GET /api/v1/admin/ministry_stats", type: :request do
  it "requires admin" do
    account = create(:account)
    get "/api/v1/admin/ministry_stats", headers: auth_headers(account)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns event and registration counts, not family/children data" do
    admin = create(:account, admin: true)
    create(:kidspire_event)

    get "/api/v1/admin/ministry_stats", headers: auth_headers(admin)

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body).to include("events", "registrations")
    expect(body).not_to have_key("families")
  end
end
