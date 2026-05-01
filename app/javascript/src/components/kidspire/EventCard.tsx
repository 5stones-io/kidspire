import { Button, ButtonLink } from "@/components/ui/Button"
import type { Event } from "@/types"

interface EventCardProps {
  event:      Event
  onRegister?: () => void  // if provided, opens quick-register modal instead of navigating
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  })
}

function ageLabel(event: Event): string | null {
  if (event.age_min == null && event.age_max == null) return null
  const min = event.age_min ?? 0
  const max = event.age_max
  if (max == null) return `Ages ${min}+`
  return `Ages ${min}–${max}`
}

function ageBadgeColor(min: number | null): string {
  if (min == null || min <= 2) return "bg-pink-soft"
  if (min <= 4) return "bg-mint-soft"
  if (min <= 11) return "bg-sky-soft"
  return "bg-accent/30"
}

// Derive a thematic emoji from event title keywords
function eventEmoji(title: string): string {
  const t = title.toLowerCase()
  if (t.includes("vbs") || t.includes("vacation") || t.includes("bible school")) return "🏰"
  if (t.includes("camp") || t.includes("ranger") || t.includes("outdoor")) return "🏕️"
  if (t.includes("worship") || t.includes("music") || t.includes("choir")) return "🎤"
  if (t.includes("nursery") || t.includes("baby") || t.includes("toddler")) return "🧸"
  if (t.includes("pizza") || t.includes("party") || t.includes("game")) return "🎉"
  if (t.includes("preteen") || t.includes("teen")) return "⭐"
  if (t.includes("family") || t.includes("parent")) return "👨‍👩‍👧‍👦"
  if (t.includes("easter") || t.includes("christmas") || t.includes("holiday")) return "✨"
  return "📅"
}

function spotsLabel(event: Event) {
  if (event.full) return { label: "Full", className: "bg-destructive/10 text-destructive" }
  if (event.spots_remaining != null && event.spots_remaining <= 5)
    return { label: `${event.spots_remaining} spots left`, className: "bg-yellow-500/10 text-yellow-600" }
  return null
}

export function EventCard({ event, onRegister }: EventCardProps) {
  const spots  = spotsLabel(event)
  const label  = ageLabel(event)
  const emoji  = eventEmoji(event.title)
  const color  = ageBadgeColor(event.age_min)

  return (
    <div className="flex flex-col rounded-3xl bg-card p-7 shadow-playful transition hover:-translate-y-1">
      <div className="text-5xl">{emoji}</div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {label && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}>
            {label}
          </span>
        )}
        {spots && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${spots.className}`}>
            {spots.label}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-xl font-bold leading-tight text-foreground">
        {event.title}
      </h3>

      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        <p>📅 {formatDate(event.event_date)}</p>
        {event.location && <p>📍 {event.location}</p>}
      </div>

      {event.description && (
        <p className="mt-3 text-sm text-foreground/80 line-clamp-2">{event.description}</p>
      )}

      <div className="mt-auto pt-5">
        {onRegister ? (
          <Button
            variant="accent"
            size="md"
            className="w-full justify-center"
            onClick={onRegister}
            disabled={event.full}
          >
            {event.full ? "Full" : "Attend"}
          </Button>
        ) : (
          <ButtonLink
            to={`/events/${event.id}`}
            variant="accent"
            size="md"
            className="w-full justify-center"
          >
            {event.full ? "View details" : "Register"}
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
