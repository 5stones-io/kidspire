module Kidspire
  class Configuration
    attr_accessor \
      :pco_client_id,
      :pco_client_secret,
      :pco_redirect_uri,
      :pco_kids_ministry_tag,
      :encryption_key,
      :frontend_base_url,
      :twilio_account_sid,
      :twilio_auth_token,
      :twilio_from_number

    def initialize
      @pco_kids_ministry_tag = nil
    end
  end
end
