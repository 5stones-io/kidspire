import { createClient } from "@supabase/supabase-js"

declare global {
  interface Window {
    __KIDSMIN_CONFIG__?: {
      supabaseUrl: string
      supabaseAnonKey: string
      apiBaseUrl: string
    }
  }
}

const url     = window.__KIDSMIN_CONFIG__?.supabaseUrl     ?? import.meta.env.VITE_SUPABASE_URL
const anonKey = window.__KIDSMIN_CONFIG__?.supabaseAnonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error("kidsmin: Supabase URL and anon key are required.")
}

export const supabase = createClient(url, anonKey)
