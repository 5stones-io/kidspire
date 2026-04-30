module Kidsmin
  module ViteManifest
    MANIFEST_PATH = -> { Rails.root.join("public/vite/.vite/manifest.json") }

    def self.entry(name = "app/javascript/application.tsx")
      manifest[name]
    end

    def self.manifest
      if Rails.env.development?
        {}
      else
        @manifest ||= JSON.parse(File.read(MANIFEST_PATH.call))
      end
    rescue Errno::ENOENT
      Rails.logger.warn "[Kidsmin] Vite manifest not found at #{MANIFEST_PATH.call}. Run: bun run build"
      {}
    end
  end
end
