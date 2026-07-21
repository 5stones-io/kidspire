module Kidspire
  module Api
    module V1
      module Admin
        class MinistryStatsController < BaseController
          before_action :require_admin!

          def show
            render json: {
              events: {
                upcoming: Event.where("event_date >= ?", Time.current).count,
                total:    Event.count,
              },
              registrations: {
                this_month: Registration.where("created_at >= ?", Time.current.beginning_of_month).count,
              },
            }
          end
        end
      end
    end
  end
end
