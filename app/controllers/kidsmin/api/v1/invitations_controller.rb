module Kidsmin
  module Api
    module V1
      class InvitationsController < ActionController::API
        # GET /api/v1/invitations/:token
        # Public — no auth required. Returns family preview so the invite page
        # can show "Hi Sarah, finish setting up your account."
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
        # Called after the user authenticates via Supabase.
        # Links their Supabase account to the pre-created family record.
        def accept
          token = request.headers["Authorization"]&.split(" ")&.last
          return render json: { error: "Unauthorized", code: "unauthorized" }, status: :unauthorized if token.blank?

          _, header = JWT.decode(token, nil, false)
          payload = if header["alg"] == "ES256"
            JWT.decode(token, nil, true, { algorithms: ["ES256"], jwks: supabase_jwks }).first
          else
            JWT.decode(token, Kidsmin.configuration.supabase_jwt_secret, true, { algorithm: "HS256" }).first
          end

          invitation = Invitation.find_active(params[:token])
          return render json: { error: "Invite link expired or already used.", code: "invalid_invite" }, status: :not_found if invitation.nil?

          invitation.accept!(payload["sub"])
          render json: { redirect_to: "/portal/dashboard" }
        rescue JWT::DecodeError, JWT::ExpiredSignature
          render json: { error: "Unauthorized", code: "unauthorized" }, status: :unauthorized
        end

        private

        def supabase_jwks
          @@supabase_jwks ||= begin
            url  = "#{Kidsmin.configuration.supabase_url}/auth/v1/.well-known/jwks.json"
            body = Net::HTTP.get(URI(url))
            JSON.parse(body)
          end
        end
      end
    end
  end
end
