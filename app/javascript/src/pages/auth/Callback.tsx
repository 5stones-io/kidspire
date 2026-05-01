import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "@/lib/auth"
import { api } from "@/lib/api"

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    // Guard against React StrictMode's double-invocation in development.
    // The key is single-use; a second call would always 401.
    if (ran.current) return
    ran.current = true

    const params = new URLSearchParams(window.location.search)
    const key = params.get("key")

    if (!key) {
      setError("Invalid callback URL — no key found.")
      return
    }

    auth.verifyKey(key)
      .then(async () => {
        const inviteToken = sessionStorage.getItem("kidspire_invite_token")
        if (inviteToken) {
          try {
            await api.post(`/invitations/${inviteToken}/accept`, {})
          } catch {
            // Invitation may already be accepted — proceed anyway
          }
          sessionStorage.removeItem("kidspire_invite_token")
        }
        navigate("/portal/dashboard", { replace: true })
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Sign-in failed")
      })
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-playful text-center">
          <p className="text-5xl">❌</p>
          <h1 className="mt-4 font-display text-2xl font-bold">Sign-in failed</h1>
          <p className="mt-2 text-sm text-destructive">{error}</p>
          <a href="/login" className="mt-6 inline-block text-sm text-primary underline">
            Try again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-playful text-center">
        <p className="text-5xl">⏳</p>
        <h1 className="mt-4 font-display text-2xl font-bold">Signing you in…</h1>
        <p className="mt-2 text-sm text-muted-foreground">Just a moment.</p>
      </div>
    </div>
  )
}
