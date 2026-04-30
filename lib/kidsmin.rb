require "kidsmin/version"
require "kidsmin/errors"
require "kidsmin/configuration"
require "kidsmin/encryption"
require "kidsmin/pco_client"
require "kidsmin/sms_client"
require "kidsmin/vite_manifest"
require "kidsmin/engine"

module Kidsmin
  class << self
    def configure
      yield configuration
    end

    def configuration
      @configuration ||= Configuration.new
    end
  end
end
