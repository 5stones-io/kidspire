Rails.application.routes.draw do
  scope module: "kidsmin" do
    get "/up", to: "rails/health#show"

    namespace :api do
      namespace :v1 do
        resource  :family,        only: [:show, :update]
        resources :children,      only: [:index, :create, :update, :destroy]
        resources :events,        only: [:index, :show]
        resources :registrations, only: [:create, :destroy]
        resource  :sync_settings, only: [:show, :update]
        post "/sync/trigger", to: "sync#trigger"

        namespace :admin do
          resources :families, only: [:create]
        end

        resources :invitations, only: [:show], param: :token do
          post :accept, on: :member
        end
      end
    end

    namespace :auth do
      get "pco/connect",  to: "pco#connect"
      get "pco/callback", to: "pco#callback"
      get "callback",     to: "supabase#callback"
    end

    get "/", to: "application#frontend"
    get "*path", to: "application#frontend",
      constraints: ->(req) { !req.xhr? && req.format.html? }
  end
end
