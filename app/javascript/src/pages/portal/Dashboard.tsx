import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { useFamily }   from "@/hooks/useFamily"
import { useChildren } from "@/hooks/useChildren"
import { useEvents }   from "@/hooks/useEvents"
import { ChildCard }   from "@/components/kidsmin/ChildCard"
import { EventCard }   from "@/components/kidsmin/EventCard"
import { Button, ButtonLink } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { supabase }    from "@/lib/supabase"

function useIsAdmin() {
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAdmin(data.session?.user?.app_metadata?.role === "admin")
    })
  }, [])
  return admin
}

export default function Dashboard() {
  const navigate = useNavigate()
  const isAdmin  = useIsAdmin()
  const { family, loading: familyLoading }     = useFamily()
  const { children, loading: childrenLoading } = useChildren()
  const { events, loading: eventsLoading }     = useEvents()

  if (familyLoading) return <div className="p-8 text-muted-foreground">Loading…</div>

  return (
    <div className="min-h-screen bg-background">
      {/* Glass nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="font-display text-xl font-bold text-primary">kidsmin</Link>
          <nav className="flex items-center gap-2">
            {isAdmin && (
              <ButtonLink to="/admin/quick-add" variant="accent" size="sm">+ Add family</ButtonLink>
            )}
            <ButtonLink to="/portal/profile" variant="ghost" size="sm">Settings</ButtonLink>
            <ButtonLink to="/events"         variant="ghost" size="sm">Events</ButtonLink>
            <Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/") }}>
              Sign out
            </Button>
          </nav>
        </div>
      </header>

      {/* Gradient hero banner */}
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
            Family portal
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold text-white md:text-5xl">
            Welcome back{family?.primary_contact_name ? `, ${family.primary_contact_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="mt-2 max-w-2xl text-white/85">Here's what's happening with your family.</p>
        </div>
      </section>

      {/* Stat cards — overlap the hero */}
      <section className="mx-auto -mt-8 max-w-6xl px-4 md:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl bg-accent p-6 shadow-playful">
            <div className="flex items-start justify-between">
              <span className="text-2xl">👶</span>
              <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground/70">Family</span>
            </div>
            <p className="mt-3 font-display text-4xl font-bold text-accent-foreground">
              {childrenLoading ? "…" : children.length}
            </p>
            <p className="text-sm text-accent-foreground/80">Children registered</p>
            <ButtonLink to="/portal/profile" variant="ghost" size="sm"
              className="mt-4 text-accent-foreground hover:bg-white/10 px-0 text-sm font-bold">
              Manage →
            </ButtonLink>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-playful">
            <div className="flex items-start justify-between">
              <span className="text-2xl text-primary">📅</span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Events</span>
            </div>
            <p className="mt-3 font-display text-4xl font-bold text-foreground">
              {eventsLoading ? "…" : events.length}
            </p>
            <p className="text-sm text-muted-foreground">Upcoming this season</p>
            <ButtonLink to="/events" variant="ghost" size="sm"
              className="mt-4 text-primary px-0 text-sm font-bold hover:bg-transparent">
              Browse →
            </ButtonLink>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-playful">
            <div className="flex items-start justify-between">
              <span className="text-2xl text-primary">⚙️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</span>
            </div>
            <p className="mt-3 font-display text-xl font-bold text-foreground">
              {family?.family_name || "Your family"}
            </p>
            <p className="text-sm text-muted-foreground">{family?.email}</p>
            <ButtonLink to="/portal/profile" variant="ghost" size="sm"
              className="mt-4 text-primary px-0 text-sm font-bold hover:bg-transparent">
              Settings →
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Children + Events */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-display text-3xl font-bold">Your children</h2>
              <ButtonLink to="/portal/profile" variant="ghost" size="sm">Manage</ButtonLink>
            </div>
            {childrenLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
            {!childrenLoading && children.length === 0 && (
              <Card>
                <CardContent className="text-center text-muted-foreground py-8">
                  <p className="text-4xl mb-3">👶</p>
                  <p>No children added yet.</p>
                  <ButtonLink to="/portal/profile" variant="primary" size="sm" className="mt-4">
                    Add a child
                  </ButtonLink>
                </CardContent>
              </Card>
            )}
            <div className="space-y-4">
              {children.map(c => <ChildCard key={c.id} child={c} />)}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-display text-3xl font-bold">Upcoming events</h2>
              <ButtonLink to="/events" variant="ghost" size="sm">View all</ButtonLink>
            </div>
            {eventsLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
            {!eventsLoading && events.length === 0 && (
              <Card>
                <CardContent className="text-center text-muted-foreground py-8">
                  <p className="text-4xl mb-3">📅</p>
                  <p>No upcoming events.</p>
                </CardContent>
              </Card>
            )}
            <div className="space-y-4">
              {events.slice(0, 3).map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
