if Rails.env.production?
  Rails.application.config.after_initialize do
    api_key = ENV["RESEND_API_KEY"]
    $stdout.puts "[resend_check] delivery_method=resend api_key=#{api_key.present? ? '[SET]' : '[MISSING]'}"
    $stdout.flush
  end
end
