module Kidsmin
  module Api
    module V1
      class InvitationsController < ActionController::API

        # GET /api/v1/invitations/:token  — public, no auth
        def show
          invitation = Invitation.find_active(params[:token])

          if invitation.nil?
            render json: { error: "This invite link has expired or already been used.", code: "invalid_invite" },
                   status: :not_found
            return
          end

          family = invitation.family
          render json: {
            token:      invitation.token,
            expires_at: invitation.expires_at,
            family: {
              first_name: family.primary_contact_first_name,
              last_name:  family.primary_contact_last_name,
              email:      family.email,
              phone:      family.phone,
            }
          }
        end

        # POST /api/v1/invitations/:token/accept
        # Called after the user authenticates via Rodauth. Links their account to the family.
        def accept
          unless rodauth.authenticated?
            render json: { error: "Unauthorized", code: "unauthorized" }, status: :unauthorized
            return
          end

          invitation = Invitation.find_active(params[:token])
          if invitation.nil?
            render json: { error: "Invite link expired or already used.", code: "invalid_invite" },
                   status: :not_found
            return
          end

          invitation.accept!(rodauth.account_id)
          render json: { redirect_to: "/portal/dashboard" }
        end
      end
    end
  end
end
