import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { auth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/Button"

interface InvitePreview {
  token: string
  expires_at: string
  family: {
    first_name: string
    last_name:  string
    email:      string
    phone:      string
  }
}

type Phase = "loading" | "invalid" | "ready" | "sent" | "error"

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const [phase, setPhase]     = useState<Phase>("loading")
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [email, setEmail]     = useState("")
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setPhase("invalid"); return }
    api.get<InvitePreview>(`/invitations/${token}`)
      .then(data => {
        setPreview(data)
        if (data.family.email) setEmail(data.family.email)
        setPhase("ready")
      })
      .catch(() => setPhase("invalid"))
  }, [token])

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    // Store invite token so AuthCallback can link the account after sign-in
    sessionStorage.setItem("kidspire_invite_token", token!)
    try {
      await auth.requestMagicLink(email)
      setPhase("sent")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send magic link")
      setPhase("error")
    }
  }

  if (phase === "loading") return <Screen emoji="⏳" title="Checking your invite…" />

  if (phase === "invalid") {
    return (
      <Screen emoji="❌" title="This invite link has expired or already been used.">
        <p className="mt-2 text-sm text-muted-foreground">Ask your kids ministry admin to send a new one.</p>
      </Screen>
    )
  }

  if (phase === "sent") {
    return (
      <Screen emoji="📬" title="Check your email!">
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a magic link to <strong>{email}</strong>.<br />
          Click it and we'll finish setting up your account automatically.
        </p>
      </Screen>
    )
  }

  if (phase === "error") {
    return (
      <Screen emoji="⚠️" title="Something went wrong">
        <p className="mt-2 text-sm text-destructive">{error}</p>
      </Screen>
    )
  }

  const name = [preview?.family.first_name, preview?.family.last_name].filter(Boolean).join(" ")

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-playful">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-2xl text-primary-foreground">✝</div>
          <h1 className="mt-4 font-display text-3xl font-bold">
            {name ? `Hi ${preview?.family.first_name}!` : "You're invited!"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your Kids Min family profile to register for events and stay connected.
          </p>
        </div>

        <form onSubmit={sendMagicLink} className="mt-7 grid gap-3">
          <label className="text-sm font-semibold">Your email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="parent@email.com"
            className="h-12 rounded-2xl border border-border bg-background px-4 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full justify-center">
            Send magic link
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          We'll send you a one-click sign-in link. No password needed.
        </p>
      </div>
    </div>
  )
}

function Screen({ emoji, title, children }: { emoji: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-playful text-center">
        <p className="text-5xl">{emoji}</p>
        <h1 className="mt-4 font-display text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  )
}
