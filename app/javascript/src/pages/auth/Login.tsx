import { useState } from "react"
import { Nav } from "@/components/kidsmin/Nav"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"

type Tab = "email" | "phone"
type PhonePhase = "enter" | "verify"

export default function Login() {
  const [tab, setTab] = useState<Tab>("email")

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="bg-gradient-soft">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16 md:px-6">
          <div className="w-full rounded-3xl bg-card p-8 shadow-playful">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-2xl text-primary-foreground">
                ✝
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold">Welcome to kidsmin</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to manage your family, register for events, and stay connected.
              </p>
            </div>

            {/* Tab switcher */}
            <div className="mt-6 flex rounded-2xl bg-secondary p-1">
              <button
                onClick={() => setTab("email")}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  tab === "email" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                📧 Email link
              </button>
              <button
                onClick={() => setTab("phone")}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  tab === "phone" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                📱 Text me a code
              </button>
            </div>

            <div className="mt-6">
              {tab === "email" ? <EmailForm /> : <PhoneForm />}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Email magic link ──────────────────────────────────────────────────────────

function EmailForm() {
  const [email, setEmail]     = useState("")
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/portal/dashboard` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-4xl">📬</p>
        <p className="mt-3 font-semibold">Check your email</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
        <button onClick={() => setSent(false)} className="mt-4 text-sm text-primary underline">
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="text-sm font-semibold">Email magic link</label>
        <input
          type="email" required placeholder="parent@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          className="h-12 rounded-2xl border border-border bg-background px-4 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} variant="primary" size="lg" className="w-full justify-center">
          {loading ? "Sending…" : "Send magic link"}
        </Button>
      </form>

      <div className="mt-5 rounded-2xl bg-secondary/60 p-4 text-center text-sm">
        <p className="font-semibold">New to kidsmin?</p>
        <p className="mt-0.5 text-muted-foreground">Use any option above to create your account.</p>
      </div>
    </>
  )
}

// ── Phone OTP ─────────────────────────────────────────────────────────────────

function PhoneForm() {
  const [phase, setPhase]     = useState<PhonePhase>("enter")
  const [phone, setPhone]     = useState("")
  const [otp, setOtp]         = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) })
    if (error) setError(error.message)
    else setPhase("verify")
    setLoading(false)
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: otp,
      type:  "sms",
    })
    if (error) setError(error.message)
    // On success Supabase fires onAuthStateChange → ProtectedRoute redirects automatically
    setLoading(false)
  }

  if (phase === "verify") {
    return (
      <form onSubmit={verifyOtp} className="grid gap-4">
        <div className="text-center">
          <p className="text-4xl">📱</p>
          <p className="mt-3 font-semibold">Enter the 6-digit code</p>
          <p className="text-sm text-muted-foreground">Sent to {phone}</p>
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
          className="h-14 rounded-2xl border border-border bg-background px-4 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <Button type="submit" disabled={loading || otp.length < 6} variant="primary" size="lg" className="w-full justify-center">
          {loading ? "Verifying…" : "Verify code"}
        </Button>
        <button
          type="button"
          onClick={() => { setPhase("enter"); setOtp(""); setError(null) }}
          className="text-center text-sm text-muted-foreground hover:text-primary"
        >
          Use a different number
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={sendOtp} className="grid gap-4">
      <div>
        <label className="text-sm font-semibold">Mobile number</label>
        <input
          type="tel" required
          placeholder="(408) 555-0142"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
        <p className="mt-1.5 text-xs text-muted-foreground">We'll text you a 6-digit code.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} variant="primary" size="lg" className="w-full justify-center">
        {loading ? "Sending code…" : "Send code"}
      </Button>
    </form>
  )
}

// Normalize to E.164 (+1XXXXXXXXXX for US numbers)
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return `+${digits}`
}
