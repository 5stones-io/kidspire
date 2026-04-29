import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [
    react({ include: /\.[jt]sx?$/ }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app/javascript/src"),
    },
  },
  build: {
    outDir:      "public/vite",
    emptyOutDir: true,
    manifest:    true,
    rollupOptions: {
      input: "app/javascript/application.tsx",
    },
  },
  server: {
    port: 3036,
    proxy: {
      "/api":  "http://localhost:3000",
      "/auth": "http://localhost:3000",
    },
  },
})
