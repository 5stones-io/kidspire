import { supabase } from "@/lib/supabase"

const apiBase = (): string =>
  window.__KIDSMIN_CONFIG__?.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? "/api/v1"

class KidsminApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message)
    this.name = "KidsminApiError"
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (response.status === 204) return null as T

  const body = await response.json().catch(() => ({ error: "Unexpected response", code: "parse_error" }))

  if (!response.ok) {
    throw new KidsminApiError(body.error ?? "Request failed", body.code ?? "unknown", response.status)
  }

  return body as T
}

export const api = {
  get:    <T>(path: string)                       => apiFetch<T>(path),
  post:   <T>(path: string, data: unknown)        => apiFetch<T>(path, { method: "POST",   body: JSON.stringify(data) }),
  patch:  <T>(path: string, data: unknown)        => apiFetch<T>(path, { method: "PATCH",  body: JSON.stringify(data) }),
  delete: <T>(path: string)                       => apiFetch<T>(path, { method: "DELETE" }),
}

export { KidsminApiError }
