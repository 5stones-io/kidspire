Rails.application.routes.draw do
  get "/up", to: "rails/health#show"

  # Spirely owns identity/profile: family, children, invitations, sync_settings
  # (people-sync), admin family/config/pco_status/stats, and /auth/*. Mounted
  # before kidspire's own routes so its paths resolve exactly as kidspire's
  # existing frontend already expects (see SPIRELY_CONTEXT.md).
  mount Spirely::Engine => "/", as: "spirely_engine"

  scope module: "kidspire" do
    namespace :api do
      namespace :v1 do
        resources :events,        only: [:index, :show]
        resources :registrations, only: [:create, :destroy]
        resource  :ministry_sync_settings, only: [:show, :update]

        namespace :ministry do
          post "/sync/trigger", to: "sync#trigger"
        end

        namespace :admin do
          resource  :ministry_stats, only: [:show]
          resources :registrations, only: [:index]
        end
      end
    end

    get "/", to: "application#frontend"
    get "*path", to: "application#frontend",
      constraints: ->(req) { !req.xhr? && req.format.html? }
  end
end
