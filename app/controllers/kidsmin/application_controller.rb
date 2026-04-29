module Kidsmin
  class ApplicationController < ActionController::Base
    def frontend
      render template: "kidsmin/application/index", layout: false
    end
  end
end
