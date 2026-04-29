require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false

  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info").to_sym
  config.log_tags  = [:request_id]

  config.force_ssl = true

  config.active_support.report_deprecations = false

  config.active_record.dump_schema_after_migration = false

  config.hosts = [
    ENV["RAILWAY_PUBLIC_DOMAIN"],
    ENV["CUSTOM_DOMAIN"]
  ].compact
end
