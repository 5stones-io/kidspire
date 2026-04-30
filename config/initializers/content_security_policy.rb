Rails.application.configure do
  # No CSP in development — Vite HMR requires eval and inline scripts.
  # Production CSP is handled at the infrastructure level (Railway / CDN headers).
  next if Rails.env.development?

  config.content_security_policy do |policy|
    policy.script_src :self
  end
end
