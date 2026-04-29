module Kidsmin
  class Invitation < ApplicationRecord
    belongs_to :family

    before_create :generate_token

    scope :active, -> { where(accepted_at: nil).where("expires_at > ?", Time.current) }

    def self.find_active(token)
      active.find_by(token: token)
    end

    def accept!(supabase_uid)
      family.update!(supabase_uid: supabase_uid)
      update!(accepted_at: Time.current)
    end

    def expired?
      expires_at <= Time.current
    end

    def accepted?
      accepted_at.present?
    end

    def invite_url
      base = Kidsmin.configuration.frontend_base_url.presence || "http://localhost:3036"
      "#{base}/invite/#{token}"
    end

    private

    def generate_token
      self.token      = SecureRandom.urlsafe_base64(24)
      self.expires_at = 7.days.from_now
    end
  end
end
