require "httparty"
require "uri"

module Kidspire
  class SmsClient
    TWILIO_BASE = "https://api.twilio.com/2010-04-01"

    def self.configured?
      cfg = Kidspire.configuration
      cfg.twilio_account_sid.present? &&
        cfg.twilio_auth_token.present? &&
        cfg.twilio_from_number.present?
    end

    def self.send(to:, body:)
      return false unless configured?

      cfg = Kidspire.configuration
      url = "#{TWILIO_BASE}/Accounts/#{cfg.twilio_account_sid}/Messages.json"

      response = HTTParty.post(url,
        basic_auth: { username: cfg.twilio_account_sid, password: cfg.twilio_auth_token },
        body: { From: cfg.twilio_from_number, To: to, Body: body }
      )

      unless response.success?
        Rails.logger.error("[Kidspire::SmsClient] Twilio error #{response.code}: #{response.body}")
        return false
      end

      Rails.logger.info("[Kidspire::SmsClient] SMS sent to #{to}")
      true
    rescue => e
      Rails.logger.error("[Kidspire::SmsClient] #{e.message}")
      false
    end
  end
end
