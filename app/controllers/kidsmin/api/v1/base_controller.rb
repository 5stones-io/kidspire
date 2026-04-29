require "net/http"

module Kidsmin
  module Api
    module V1
      class BaseController < ActionController::API
        before_action :authenticate!

        private

        def authenticate!
          token = request.headers["Authorization"]&.split(" ")&.last
          raise JWT::DecodeError, "missing token" if token.blank?

          payload = decode_supabase_jwt(token)

          @supabase_uid      = payload["sub"]
          @current_user_role = payload.dig("app_metadata", "role")
          @jwt_email         = payload["email"]
          @jwt_phone         = payload["phone"]

          @current_family = resolve_family
        rescue JWT::DecodeError, JWT::ExpiredSignature
          render json: { error: "Unauthorized", code: "unauthorized" }, status: :unauthorized
        end

        # Supports both HS256 (legacy) and ES256 (current Supabase default).
        # ES256 tokens are validated using Supabase's public JWKS endpoint.
        def decode_supabase_jwt(token)
          _, header = JWT.decode(token, nil, false)

          if header["alg"] == "ES256"
            JWT.decode(token, nil, true, {
              algorithms: ["ES256"],
              jwks:       supabase_jwks
            }).first
          else
            JWT.decode(token,
              Kidsmin.configuration.supabase_jwt_secret,
              true,
              { algorithm: "HS256" }
            ).first
          end
        end

        # Fetches and caches Supabase's JWKS for the duration of the process.
        # Keys rotate infrequently; a process restart (deploy) is sufficient to refresh.
        def supabase_jwks
          @@supabase_jwks ||= begin
            url  = "#{Kidsmin.configuration.supabase_url}/auth/v1/.well-known/jwks.json"
            body = Net::HTTP.get(URI(url))
            JSON.parse(body)
          end
        end

        def resolve_family
          family = Family.find_by(supabase_uid: @supabase_uid)
          return family if family

          if @jwt_email.present?
            claimed = Family
              .where(email: @jwt_email)
              .where("supabase_uid LIKE 'pco_%' OR supabase_uid LIKE 'pending_%'")
              .limit(1).first

            if claimed
              rows = Family
                .where(id: claimed.id)
                .where("supabase_uid LIKE 'pco_%' OR supabase_uid LIKE 'pending_%'")
                .update_all(supabase_uid: @supabase_uid)
              return Family.find_by(supabase_uid: @supabase_uid) if rows > 0
            end
          end

          if @jwt_phone.present?
            claimed = Family
              .where(phone: @jwt_phone)
              .where("supabase_uid LIKE 'pco_%' OR supabase_uid LIKE 'pending_%'")
              .limit(1).first

            if claimed
              rows = Family
                .where(id: claimed.id)
                .where("supabase_uid LIKE 'pco_%' OR supabase_uid LIKE 'pending_%'")
                .update_all(supabase_uid: @supabase_uid)
              return Family.find_by(supabase_uid: @supabase_uid) if rows > 0
            end
          end

          nil
        end

        def current_family = @current_family
        def admin?         = @current_user_role == "admin"

        def require_family!
          return if current_family
          render json: { error: "Family profile not found", code: "family_not_found" },
                 status: :not_found
        end

        def require_admin!
          return if admin?
          render json: { error: "Forbidden", code: "forbidden" }, status: :forbidden
        end

        def pagination_meta(collection)
          {
            total_count:  collection.total_count,
            current_page: collection.current_page,
            total_pages:  collection.total_pages,
            per_page:     collection.limit_value
          }
        end
      end
    end
  end
end
