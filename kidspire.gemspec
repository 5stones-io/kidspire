require_relative "lib/kidspire/version"

Gem::Specification.new do |spec|
  spec.name        = "kidspire"
  spec.version     = Kidspire::VERSION
  spec.authors     = ["Chad Singleton"]
  spec.email       = ["hello@5stones.io"]
  spec.summary     = "Self-hostable children's ministry portal — family profiles, event registration, and PCO sync"
  spec.description = "Open source children's ministry platform. Mountable Rails Engine with React/Vite frontend, Rodauth-powered passwordless auth, and bidirectional Planning Center Online sync."
  spec.homepage    = "https://5stones.io/kidspire"
  spec.license     = "MIT"

  spec.metadata = {
    "homepage_uri"      => "https://5stones.io/kidspire",
    "source_code_uri"   => "https://github.com/5stones-io/kidspire",
    "bug_tracker_uri"   => "https://github.com/5stones-io/kidspire/issues"
  }

  spec.files = Dir[
    "app/**/*",
    "config/**/*",
    "db/**/*",
    "lib/**/*",
    "public/**/*",
    "LICENSE",
    "README.md"
  ]

  spec.require_paths = ["lib"]
  spec.required_ruby_version = ">= 3.3"

  spec.add_dependency "rails",         "~> 7.2"
  spec.add_dependency "pg",           "~> 1.5"
  spec.add_dependency "rodauth-rails", "~> 1.0"
  spec.add_dependency "jwt"
  spec.add_dependency "bcrypt",        "~> 3.1"
  spec.add_dependency "blueprinter"
  spec.add_dependency "sidekiq",     "~> 7.0"
  spec.add_dependency "redis",      "~> 5.0"
  spec.add_dependency "httparty"
  spec.add_dependency "rack-cors"
  spec.add_dependency "rack-attack"
  spec.add_dependency "kaminari"
  spec.add_dependency "vite_rails"
end
