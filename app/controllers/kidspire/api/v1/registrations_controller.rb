module Kidspire
  module Api
    module V1
      class RegistrationsController < BaseController
        before_action :require_family!

        def create
          # Spirely::Family has no `registrations` association (Registration
          # is kidspire-only) — build directly, scoped to the current family.
          registration = Registration.new(registration_params.merge(family_id: current_family.id))
          if registration.save
            render json: RegistrationBlueprint.render(registration), status: :created
          else
            render json: { error: registration.errors.full_messages.first, code: "validation_error" },
                   status: :unprocessable_entity
          end
        end

        def destroy
          registration = Registration.find_by!(id: params[:id], family_id: current_family.id)
          registration.destroy
          head :no_content
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Registration not found", code: "not_found" }, status: :not_found
        end

        private

        def registration_params
          params.require(:registration).permit(:event_id, :child_id)
        end
      end
    end
  end
end
