if Rails.env.production?
  Rails.application.config.after_initialize do
    settings = ActionMailer::Base.smtp_settings
    host     = settings[:address].to_s
    port     = settings[:port].to_i
    user     = settings[:user_name].to_s
    password = settings[:password]
    domain   = settings[:domain].to_s

    msg = "[smtp_check] address=#{host} port=#{port} user=#{user} " \
          "password=#{password.present? ? '[SET]' : '[MISSING]'} domain=#{domain} " \
          "ssl=#{settings[:ssl]} starttls=#{settings[:enable_starttls_auto]}"
    $stdout.puts msg
    $stdout.flush

    begin
      require "socket"
      Timeout.timeout(5) { TCPSocket.new(host, port).close }
      $stdout.puts "[smtp_check] TCP connection to #{host}:#{port} OK"
    rescue Timeout::Error
      $stdout.puts "[smtp_check] TCP connection to #{host}:#{port} TIMED OUT"
    rescue => e
      $stdout.puts "[smtp_check] TCP connection to #{host}:#{port} FAILED — #{e.class}: #{e.message}"
    end
    $stdout.flush
  end
end
