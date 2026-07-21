require "rails/engine"

module Kidspire
  class Engine < ::Rails::Engine
    isolate_namespace Kidspire

    # This engine's root is the same directory as the main Kidspire::Application
    # (kidspire has always been a hybrid app+gem, not truly mounted elsewhere) —
    # without this, Rails::Engine's default convention re-discovers and re-draws
    # the exact same config/routes.rb a second time as "this engine's own
    # routes," on top of the main app already drawing it. Harmless until a
    # named route (like `mount Spirely::Engine`) collided with itself.
    paths["config/routes.rb"] = []

    config.generators do |g|
      g.test_framework :rspec
    end

    initializer "kidspire.assets" do |app|
      app.config.assets.paths << root.join("app/assets") if app.config.respond_to?(:assets)
    end
  end
end
