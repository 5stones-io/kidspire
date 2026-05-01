require "kidspire/version"
require "kidspire/errors"
require "kidspire/configuration"
require "kidspire/encryption"
require "kidspire/pco_client"
require "kidspire/sms_client"
require "kidspire/vite_manifest"
require "kidspire/engine"

module Kidspire
  class << self
    def configure
      yield configuration
    end

    def configuration
      @configuration ||= Configuration.new
    end
  end
end
