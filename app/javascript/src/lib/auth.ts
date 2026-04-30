const AUTH_TOKEN_KEY = "kidsmin_token"

declare global {
  interface Window {
    __KIDSMIN_CONFIG__?: {
      apiBaseUrl: string
    }
  }
}

function authBase(): string {
  const apiBase =
    window.__KIDSMIN_CONFIG__?.apiBaseUrl ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000/api/v1"
  return apiBase.replace(/\/api\/v1\/?$/, "")
}

function parseJwt(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

export interface AuthUser {
  id: number
  email: string
  admin: boolean
}

export const auth = {
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  },

  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  },

  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false
    const payload = parseJwt(token)
    const exp = payload["exp"] as number | undefined
    if (exp && Date.now() >= exp * 1000) {
      this.clearToken()
      return false
    }
    return true
  },

  getUser(): AuthUser | null {
    const token = this.getToken()
    if (!token) return null
    const payload = parseJwt(token)
    // Rodauth JWT uses "account_id" as the subject claim (not "sub")
    return {
      id:    (payload["account_id"] as number) ?? 0,
      email: (payload["email"] as string) ?? "",
      admin: (payload["admin"] as boolean) ?? false,
    }
  },

  async requestMagicLink(email: string): Promise<void> {
    const res = await fetch(`${authBase()}/auth/email-auth-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: email }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, string>
      // "recently sent" is rate-limiting, not a real error — treat as success
      if (res.status === 400 && body["error"]?.includes("recently been sent")) return
      throw new Error(body["error"] ?? "Failed to send magic link")
    }
  },

  async verifyKey(key: string): Promise<string> {
    const res = await fetch(`${authBase()}/auth/email-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })

    const body = await res.json().catch(() => ({})) as Record<string, unknown>

    if (!res.ok) {
      throw new Error((body["error"] as string) ?? "Invalid or expired magic link")
    }

    // Prefer body token (explicitly added by Rodauth after_login hook),
    // fall back to Authorization response header.
    const bodyToken = body["token"] as string | undefined
    const headerToken = res.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim()
    const token = bodyToken ?? headerToken ?? null

    if (!token) throw new Error("Sign-in failed: no token returned")

    this.setToken(token)
    return token
  },

  signOut(): void {
    this.clearToken()
  },
}
