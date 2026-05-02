if Rails.env.production?
  Rails.application.config.after_initialize do
    api_key = ENV["RESEND_API_KEY"]
    from    = ENV.fetch("MAILER_FROM", "noreply@kidspire.app")
    to      = ENV.fetch("MAILER_CHECK_TO", "delivered@resend.dev")

    $stdout.puts "[resend_check] api_key=#{api_key.present? ? '[SET]' : '[MISSING]'} from=#{from} to=#{to}"
    $stdout.flush

    begin
      result = Resend::Emails.send({
        from:    from,
        to:      [to],
        subject: "Kidspire startup check",
        text:    "SMTP delivery check at #{Time.current}"
      })
      $stdout.puts "[resend_check] Send OK — id=#{result[:id] || result['id']}"
    rescue => e
      $stdout.puts "[resend_check] Send FAILED — #{e.class}: #{e.message}"
    end
    $stdout.flush
  end
end
