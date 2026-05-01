require "rails_helper"

RSpec.describe "GET /api/v1/events", type: :request do
  it "returns 200 without authentication" do
    create_list(:kidspire_event, 2)
    get "/api/v1/events"
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["events"]).to be_an(Array)
    expect(body["meta"]).to include("total_count", "current_page", "total_pages")
  end

  it "excludes past events" do
    future = create(:kidspire_event)
    _past  = create(:kidspire_event, :past)
    get "/api/v1/events"
    ids = JSON.parse(response.body)["events"].map { |e| e["id"] }
    expect(ids).to include(future.id)
    expect(ids).not_to include(_past.id)
  end

  it "returns 404 for a missing event" do
    get "/api/v1/events/0"
    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)["code"]).to eq("not_found")
  end
end
