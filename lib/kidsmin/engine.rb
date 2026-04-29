require "rails/engine"

module Kidsmin
  class Engine < ::Rails::Engine
    isolate_namespace Kidsmin

    config.generators do |g|
      g.test_framework :rspec
    end

    initializer "kidsmin.assets" do |app|
      app.config.assets.paths << root.join("app/assets") if app.config.respond_to?(:assets)
    end
  end
end
