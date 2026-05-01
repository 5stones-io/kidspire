module Kidspire
  module Api
    module V1
      class EventsController < BaseController
        # events are publicly browsable — auth optional
        skip_before_action :authenticate!, only: [:index, :show]

        def index
          events = Event.upcoming.page(params[:page]).per(params[:per_page] || 20)
          render json: {
            events: JSON.parse(EventBlueprint.render(events)),
            meta:   pagination_meta(events)
          }
        end

        def show
          event = Event.find(params[:id])
          render json: EventBlueprint.render(event, view: :detail)
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Event not found", code: "not_found" }, status: :not_found
        end
      end
    end
  end
end
