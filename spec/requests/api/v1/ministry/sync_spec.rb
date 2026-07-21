require "rails_helper"

RSpec.describe "POST /api/v1/ministry/sync/trigger", type: :request do
  it "requires admin" do
    account = create(:account)
    post "/api/v1/ministry/sync/trigger", headers: auth_headers(account)
    expect(response).to have_http_status(:forbidden)
  end

  it "enqueues only the ministry-specific jobs that are enabled" do
    admin = create(:account, admin: true)
    Kidspire::SyncSetting.current.update!(inbound_events_sync: true, outbound_registrations_sync: false)

    post "/api/v1/ministry/sync/trigger", headers: auth_headers(admin)

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["enqueued"]).to eq(["inbound_events"])
  end
end
