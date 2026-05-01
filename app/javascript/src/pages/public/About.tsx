import { Nav } from "@/components/kidspire/Nav"
import { Footer } from "@/components/kidspire/Footer"
import { ButtonLink } from "@/components/ui/Button"

const team = [
  { name: "Kids Ministry Director", role: "Lead Pastor",    initials: "KM", color: "bg-pink-soft" },
  { name: "Adventure Team Lead",    role: "Royal Rangers",  initials: "AT", color: "bg-sky-soft" },
  { name: "Elementary Lead",        role: "Ages 5–11",      initials: "EL", color: "bg-mint-soft" },
  { name: "Worship & Production",   role: "Creative Team",  initials: "WP", color: "bg-accent/40" },
]

const safety = [
  { title: "Secure check-in",   desc: "Matching ID tags for child and parent at every service.", icon: "🛡️" },
  { title: "Background checks", desc: "All volunteers cleared and trained annually.",            icon: "🔒" },
  { title: "Parent paging",     desc: "We'll reach you instantly if your child needs you.",     icon: "🔔" },
  { title: "Allergy aware",     desc: "Allergies and notes flagged on every check-in.",         icon: "✅" },
]

export default function About() {
  return (
    <div className="min-h-screen">
      <Nav />

      <section className="bg-gradient-soft">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">About Kids Ministry</span>
          <h1 className="mt-2 font-display text-5xl font-bold text-foreground md:text-6xl">
            Partnering with parents to raise lifelong followers of Jesus.
          </h1>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:items-start">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-pink-soft text-3xl">❤️</div>
          <div>
            <h2 className="font-display text-3xl font-bold">Our philosophy</h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/80">
              We believe each child is created to have a relationship with God — with unique talents
              and abilities to influence their world. Our hope is that every child develops an
              insatiable interest in being part of God's Church.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-foreground/80">
              We recognize that no one has more influence over a child than their parent. That's why
              we're committed to{" "}
              <strong className="text-primary">partnering with families</strong> — providing
              tools and resources to support kids spiritually at home.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-3 text-sm font-semibold">📖 Bible-centered</div>
              <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-3 text-sm font-semibold">❤️ Relationally driven</div>
              <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-3 text-sm font-semibold">🤝 Parent-partnering</div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-[auto_1fr] md:items-start">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-mint-soft text-3xl">🛡️</div>
            <div>
              <h2 className="font-display text-3xl font-bold">Safety &amp; check-in</h2>
              <p className="mt-4 text-lg leading-relaxed text-foreground/80">
                Your child's safety is our highest priority. Every volunteer is background-checked,
                trained, and serves with at least one other adult at all times.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {safety.map((s) => (
                  <div key={s.title} className="rounded-2xl bg-card p-5 shadow-playful transition hover:-translate-y-1">
                    <div className="text-2xl">{s.icon}</div>
                    <h4 className="mt-3 font-display text-lg font-bold">{s.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Meet the team</span>
          <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Friendly faces, big hearts</h2>
          <p className="mt-4 text-lg text-muted-foreground">Background-checked, trained, and genuinely passionate about your kids.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="rounded-3xl bg-card p-6 text-center shadow-playful transition hover:-translate-y-1">
              <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full ${m.color} font-display text-3xl font-bold`}>
                {m.initials}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{m.name}</h3>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-16 md:px-6">
        <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground md:p-12">
          <h2 className="font-display text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-primary-foreground/80">Create a family account and register your children for upcoming events.</p>
          <ButtonLink to="/login" variant="accent" size="lg" className="mt-6 inline-flex">
            Create a family account
          </ButtonLink>
        </div>
      </section>

      <Footer />
    </div>
  )
}
