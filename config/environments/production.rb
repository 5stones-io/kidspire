require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false

  # Serve static files from public/ (Vite build output lives here)
  config.public_file_server.enabled = true

  config.log_level  = ENV.fetch("RAILS_LOG_LEVEL", "info").to_sym
  config.log_tags   = [:request_id]
  # SSL is terminated at Railway's ingress — do not force it at the app level
  config.force_ssl  = false

  config.active_support.report_deprecations = false
  config.active_record.dump_schema_after_migration = false

  # ── Email (magic links) ──────────────────────────────────────────────────
  # Works with any SMTP provider: Resend, Postmark, SendGrid, etc.
  # Resend: host=smtp.resend.com, port=465, user=resend, pass=<api-key>
  config.action_mailer.delivery_method   = :smtp
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.smtp_settings = {
    address:              ENV.fetch("SMTP_ADDRESS",  "smtp.resend.com"),
    port:                 ENV.fetch("SMTP_PORT",     "465").to_i,
    user_name:            ENV.fetch("SMTP_USERNAME", "resend"),
    password:             ENV["SMTP_PASSWORD"],
    authentication:       :login,
    enable_starttls_auto: ENV.fetch("SMTP_PORT", "465").to_i != 465,
    ssl:                  ENV.fetch("SMTP_PORT", "465").to_i == 465,
    domain:               ENV.fetch("SMTP_DOMAIN", ENV.fetch("RAILWAY_PUBLIC_DOMAIN", "localhost")),
  }
  config.action_mailer.default_url_options = {
    host:     ENV.fetch("CUSTOM_DOMAIN", ENV.fetch("RAILWAY_PUBLIC_DOMAIN", "localhost")),
    protocol: "https",
  }

  # Use SECRET_KEY_BASE env var directly (Railway sets this; no credentials file needed).
  config.secret_key_base = ENV["SECRET_KEY_BASE"]

  # Allow Railway domain + any custom domain set via env var
  config.hosts = [
    ENV["RAILWAY_PUBLIC_DOMAIN"],
    ENV["RAILWAY_STATIC_URL"],
    ENV["CUSTOM_DOMAIN"],
  ].compact.map { |h| h.sub(/^https?:\/\//, "") }

  # If no hosts configured (e.g. first boot), allow all — admins should set CUSTOM_DOMAIN
  config.hosts = nil if config.hosts.empty?
end
