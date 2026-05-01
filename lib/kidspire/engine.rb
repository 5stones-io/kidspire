require "rails/engine"

module Kidspire
  class Engine < ::Rails::Engine
    isolate_namespace Kidspire

    config.generators do |g|
      g.test_framework :rspec
    end

    initializer "kidspire.assets" do |app|
      app.config.assets.paths << root.join("app/assets") if app.config.respond_to?(:assets)
    end
  end
end
