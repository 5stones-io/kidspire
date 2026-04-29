import { useState } from "react"
import { Nav } from "@/components/kidsmin/Nav"
import { Footer } from "@/components/kidsmin/Footer"
import { useEvents } from "@/hooks/useEvents"
import { EventCard } from "@/components/kidsmin/EventCard"
import { QuickRegisterModal } from "@/components/kidsmin/QuickRegisterModal"
import { Button } from "@/components/ui/Button"
import type { Event } from "@/types"

const AGE_FILTERS = ["All", "Nursery", "PreK", "Elementary", "Preteen"] as const
type AgeFilter = typeof AGE_FILTERS[number]

function matchesFilter(event: Event, filter: AgeFilter): boolean {
  if (filter === "All") return true
  const min = event.age_min ?? 0
  const max = event.age_max ?? 99
  const ranges: Record<AgeFilter, [number, number]> = {
    All:        [0, 99],
    Nursery:    [0, 2],
    PreK:       [3, 4],
    Elementary: [5, 11],
    Preteen:    [12, 17],
  }
  const [lo, hi] = ranges[filter]
  return min <= hi && max >= lo
}

export default function Events() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<AgeFilter>("All")
  const [registerEvent, setRegisterEvent] = useState<Event | null>(null)
  const { events, meta, loading, error } = useEvents(page)
  const filtered = events.filter(e => matchesFilter(e, filter))

  return (
    <div className="min-h-screen">
      <Nav />
      {registerEvent && (
        <QuickRegisterModal
          event={registerEvent}
          onClose={() => setRegisterEvent(null)}
          onSuccess={() => setTimeout(() => setRegisterEvent(null), 2000)}
        />
      )}

      {/* Soft gradient header */}
      <section className="bg-gradient-soft">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">All events</span>
          <h1 className="mt-2 font-display text-5xl font-bold text-foreground md:text-6xl">
            What's happening
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Filter by age group and find the perfect adventure for your kids.
          </p>

          {/* Age filters */}
          <div className="mt-8 flex flex-wrap gap-2">
            {AGE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-playful"
                    : "bg-background text-muted-foreground hover:bg-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        {loading && <p className="text-muted-foreground">Loading events…</p>}
        {error   && <p className="text-destructive">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-3xl bg-card p-16 text-center shadow-playful">
            <p className="text-5xl mb-4">📅</p>
            <p className="font-display text-2xl font-bold text-foreground">No events found</p>
            <p className="mt-2 text-muted-foreground">
              {filter === "All" ? "Check back soon — new events are added regularly." : `No ${filter} events right now. Try another age group.`}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} onRegister={() => setRegisterEvent(event)} />
          ))}
        </div>

        {meta && meta.total_pages > 1 && (
          <div className="mt-8 flex justify-center gap-3">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              Page {meta.current_page} of {meta.total_pages}
            </span>
            <Button variant="outline" size="sm" disabled={page === meta.total_pages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
