Rails.application.configure do
  config.content_security_policy do |policy|
    if Rails.env.development?
      policy.script_src  :self, :unsafe_eval, :unsafe_inline, "http://localhost:3036"
      policy.connect_src :self, "http://localhost:3036", "ws://localhost:3036", "http://localhost:3000"
    else
      policy.script_src :self
    end
  end
end
