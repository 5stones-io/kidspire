Rails.application.configure do
  # CSP is handled at the infrastructure level (Railway / CDN headers).
  # Rails does not set a CSP header — doing so blocks Vite's inline scripts.
end
