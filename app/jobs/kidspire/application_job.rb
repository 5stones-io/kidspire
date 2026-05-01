module Kidspire
  class ApplicationJob < ActiveJob::Base
    queue_as :default

    retry_on  Kidspire::PcoError,   wait: :polynomially_longer, attempts: 3
    discard_on Kidspire::ConfigError  # bad config won't fix itself — don't retry
  end
end
