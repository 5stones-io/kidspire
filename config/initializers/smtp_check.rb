if Rails.env.production?
  Rails.application.config.after_initialize do
    settings = ActionMailer::Base.smtp_settings
    host     = settings[:address].to_s
    port     = settings[:port].to_i
    user     = settings[:user_name].to_s
    password = settings[:password]
    domain   = settings[:domain].to_s

    Rails.logger.info "[smtp_check] address=#{host} port=#{port} user=#{user} " \
                      "password=#{password.present? ? '[SET]' : '[MISSING]'} domain=#{domain} " \
                      "ssl=#{settings[:ssl]} starttls=#{settings[:enable_starttls_auto]}"

    begin
      require "socket"
      timeout = 5
      Timeout.timeout(timeout) do
        TCPSocket.new(host, port).close
      end
      Rails.logger.info "[smtp_check] TCP connection to #{host}:#{port} OK"
    rescue Timeout::Error
      Rails.logger.error "[smtp_check] TCP connection to #{host}:#{port} TIMED OUT after #{timeout}s"
    rescue => e
      Rails.logger.error "[smtp_check] TCP connection to #{host}:#{port} FAILED — #{e.class}: #{e.message}"
    end
  end
end
