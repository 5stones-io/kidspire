import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { Button, ButtonLink } from "@/components/ui/Button"

const navLinks = [
  { href: "/",       label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/about",  label: "About" },
]

export function Nav() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="font-display text-xl font-bold text-primary">
          kidsmin
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive(href)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <ButtonLink to="/portal/dashboard" variant="ghost" size="sm">Dashboard</ButtonLink>
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
            </>
          ) : session === null ? (
            <>
              <ButtonLink to="/login" variant="ghost" size="sm">Sign in</ButtonLink>
              <ButtonLink to="/login" variant="accent" size="sm">Create account</ButtonLink>
            </>
          ) : null}
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-border md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {navLinks.map(({ href, label }) => (
              <Link key={href} to={href} onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-base font-semibold hover:bg-secondary">
                {label}
              </Link>
            ))}
            <ButtonLink to={session ? "/portal/dashboard" : "/login"} variant="accent" size="md"
              className="mt-2 w-full justify-center" onClick={() => setOpen(false)}>
              {session ? "Dashboard" : "Sign in / Create account"}
            </ButtonLink>
          </nav>
        </div>
      )}
    </header>
  )
}
