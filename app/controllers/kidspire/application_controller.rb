module Kidspire
  class ApplicationController < ActionController::Base
    def frontend
      render template: "kidspire/application/index", layout: false
    end
  end
end
