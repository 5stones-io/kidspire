module Kidsmin
  class Configuration
    attr_accessor \
      :supabase_url,
      :supabase_anon_key,
      :supabase_service_role_key,
      :supabase_jwt_secret,
      :pco_client_id,
      :pco_client_secret,
      :pco_redirect_uri,
      :encryption_key,
      :frontend_base_url,
      :pco_kids_ministry_tag,
      :twilio_account_sid,
      :twilio_auth_token,
      :twilio_from_number

    def initialize
      @pco_kids_ministry_tag = nil
    end
  end
end
