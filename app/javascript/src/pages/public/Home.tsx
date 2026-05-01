import { useState } from "react"
import { Nav } from "@/components/kidspire/Nav"
import { Footer } from "@/components/kidspire/Footer"
import { ButtonLink } from "@/components/ui/Button"
import { useEvents } from "@/hooks/useEvents"
import { EventCard } from "@/components/kidspire/EventCard"
import { QuickRegisterModal } from "@/components/kidspire/QuickRegisterModal"
import type { Event } from "@/types"

const features = [
  {
    title: "Family Portal",
    desc: "One account for the whole family. Register children for events, manage profiles, and stay connected.",
    icon: "👨‍👩‍👧‍👦",
    color: "bg-pink-soft",
  },
  {
    title: "Event Registration",
    desc: "Browse upcoming events and register your children with a single tap — no paperwork, no hassle.",
    icon: "📅",
    color: "bg-sky-soft",
  },
  {
    title: "Planning Center Sync",
    desc: "Connects with your Planning Center account. Family profiles and registrations stay in perfect sync.",
    icon: "🔄",
    color: "bg-mint-soft",
  },
]

const pillars = [
  { icon: "🛡️", title: "Safe & Secure", desc: "Secure check-in, ID matching, and trained volunteers." },
  { icon: "❤️", title: "Loved & Known",  desc: "Small group leaders who invest in every child by name." },
  { icon: "✨", title: "Fun Every Week", desc: "Worship, games, lessons, and a whole lot of joy." },
]

export default function Home() {
  const { events } = useEvents()
  const upcoming = events.slice(0, 4)
  const [registerEvent, setRegisterEvent] = useState<Event | null>(null)

  return (
    <div className="min-h-screen">
      {registerEvent && (
        <QuickRegisterModal
          event={registerEvent}
          onClose={() => setRegisterEvent(null)}
          onSuccess={() => setTimeout(() => setRegisterEvent(null), 2000)}
        />
      )}
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-25 dot-overlay pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
              ✨ Kids Ministry Portal
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-tight text-white md:text-7xl">
              Where kids meet<br />
              <span className="text-accent">Jesus &amp; friends.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/85 md:text-xl">
              A fun, safe, faith-filled place where every child is known by name,
              loved unconditionally, and discipled for life.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink to="/events" variant="accent" size="lg">
                Upcoming Events →
              </ButtonLink>
              <ButtonLink to="/login" size="lg"
                className="border border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur rounded-full px-7 py-3 text-base font-semibold transition inline-flex items-center gap-2">
                Create a Family Account
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-40 h-40 w-40 rounded-full bg-pink-soft/40 blur-3xl" />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">What is kidspire?</span>
          <h2 className="mt-3 font-display text-4xl font-bold text-foreground md:text-5xl">
            Big faith. Bigger fun.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything your children's ministry needs in one self-hostable platform.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl bg-card p-8 shadow-playful transition hover:-translate-y-1">
              <div className={`mb-5 grid h-16 w-16 place-items-center rounded-2xl ${f.color} text-3xl`}>
                {f.icon}
              </div>
              <h3 className="font-display text-2xl font-bold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <section className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">What's coming up</span>
                <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Upcoming events</h2>
              </div>
              <ButtonLink to="/events" variant="ghost" size="sm" className="hidden md:inline-flex">
                View all →
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} onRegister={() => setRegisterEvent(event)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="grid gap-4 rounded-3xl bg-primary p-8 text-primary-foreground md:grid-cols-3 md:p-12">
          {pillars.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="text-2xl text-accent">{p.icon}</span>
              <div>
                <h4 className="font-display text-lg font-bold">{p.title}</h4>
                <p className="text-sm text-white/80">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
