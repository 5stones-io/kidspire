import { useState } from "react"
import { Nav } from "@/components/kidspire/Nav"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/Button"

export default function Login() {
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
              <h1 className="mt-4 font-display text-3xl font-bold">Welcome to kidspire</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to manage your family, register for events, and stay connected.
              </p>
            </div>

            <div className="mt-8">
              <EmailForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function EmailForm() {
  const [email, setEmail]     = useState("")
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await auth.requestMagicLink(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
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
        <p className="font-semibold">New to kidspire?</p>
        <p className="mt-0.5 text-muted-foreground">Enter your email above — we'll create your account automatically.</p>
      </div>
    </>
  )
}
