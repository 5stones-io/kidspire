if Rails.env.production?
  Rails.application.config.after_initialize do
    api_key   = ENV["RESEND_API_KEY"]
    from      = ENV.fetch("MAILER_FROM", "noreply@kidspire.app")

    $stdout.puts "[resend_check] api_key=#{api_key.present? ? '[SET]' : '[MISSING]'} from=#{from}"
    $stdout.flush

    begin
      result = Resend::Domains.list
      domains = Array(result[:data]).map { |d| "#{d[:name]}(#{d[:status]})" }.join(", ")
      $stdout.puts "[resend_check] API OK — verified domains: #{domains.presence || '(none)'}"
    rescue => e
      $stdout.puts "[resend_check] API FAILED — #{e.class}: #{e.message}"
    end
    $stdout.flush
  end
end
