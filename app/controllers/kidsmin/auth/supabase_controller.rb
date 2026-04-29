module Kidsmin
  module Auth
    # The Supabase JS client handles the magic-link token exchange in the browser.
    # This controller exists so the engine route is explicit; the catch-all
    # would also work, but this makes the intent clear.
    class SupabaseController < ActionController::Base
      def callback
        redirect_to Kidsmin.configuration.frontend_base_url.presence || "/",
                    allow_other_host: true
      end
    end
  end
end
