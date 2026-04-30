import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "@/lib/auth"
import { useFamily }   from "@/hooks/useFamily"
import { useChildren } from "@/hooks/useChildren"
import { api, KidsminApiError } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import type { Event, Child, Registration } from "@/types"

interface Props {
  event:     Event
  onClose:   () => void
  onSuccess: (registrations: Registration[]) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })
}

function isEligible(event: Event, child: Child) {
  if (event.age_min == null && event.age_max == null) return true
  if (child.age == null) return true
  if (event.age_min != null && child.age < event.age_min) return false
  if (event.age_max != null && child.age > event.age_max) return false
  return true
}

export function QuickRegisterModal({ event, onClose, onSuccess }: Props) {
  const navigate = useNavigate()
  const authed = useMemo(() => auth.isAuthenticated(), [])
  const { family }   = useFamily()
  const { children } = useChildren()

  // Pre-select age-eligible children
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [done, setDone]             = useState(false)
  const [registered, setRegistered] = useState<Registration[]>([])

  useEffect(() => {
    if (children.length > 0) {
      setSelected(new Set(children.filter(c => isEligible(event, c)).map(c => c.id)))
    }
  }, [children, event])

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    const results: Registration[] = []

    for (const childId of selected) {
      try {
        const reg = await api.post<Registration>("/registrations", {
          registration: { event_id: event.id, child_id: childId },
        })
        results.push(reg)
      } catch (e) {
        if (e instanceof KidsminApiError) {
          setError(e.message)
          setSubmitting(false)
          return
        }
      }
    }

    setRegistered(results)
    setDone(true)
    onSuccess(results)
    setSubmitting(false)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-card shadow-playful overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-hero px-7 py-6">
          <p className="text-xs font-bold uppercase tracking-wider text-white/70">Register</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">{event.title}</h2>
          <p className="mt-1 text-sm text-white/80">📅 {formatDate(event.event_date)}</p>
          {event.location && <p className="text-sm text-white/80">📍 {event.location}</p>}
        </div>

        <div className="px-7 py-6">
          {/* Not signed in */}
          {authed === false && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Sign in to register your family.</p>
              <Button variant="primary" size="md" className="mt-4"
                onClick={() => navigate("/login")}>
                Sign in
              </Button>
            </div>
          )}

          {/* Signed in — success */}
          {authed && done && (
            <div className="text-center py-4">
              <p className="text-5xl mb-3">🎉</p>
              <h3 className="font-display text-xl font-bold">You're registered!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {registered.length} child{registered.length !== 1 ? "ren" : ""} registered for {event.title}.
              </p>
              <Button variant="primary" size="md" className="mt-5" onClick={onClose}>
                Done
              </Button>
            </div>
          )}

          {/* Signed in — registration form */}
          {authed && !done && (
            <>
              {/* Family info — read-only confirmation */}
              {family && (
                <div className="mb-5 rounded-2xl bg-secondary/50 px-4 py-3 text-sm">
                  <p className="font-semibold text-foreground">{family.family_name || family.primary_contact_name}</p>
                  <p className="text-muted-foreground">{family.email} · {family.phone}</p>
                </div>
              )}

              {/* Children checkboxes */}
              {children.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No children on your profile yet.</p>
                  <Button variant="outline" size="sm" className="mt-3"
                    onClick={() => { onClose(); navigate("/portal/profile") }}>
                    Add children
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold mb-3">Select children to register:</p>
                  <div className="space-y-2 mb-5">
                    {children.map(child => {
                      const eligible = isEligible(event, child)
                      const checked  = selected.has(child.id)
                      return (
                        <label
                          key={child.id}
                          className={`flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                            !eligible ? "opacity-40 cursor-not-allowed border-border" :
                            checked   ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!eligible}
                            onChange={() => eligible && toggle(child.id)}
                            className="accent-primary h-4 w-4"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{child.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {child.grade_display ? `${child.grade_display} grade` : ""}
                              {child.age != null ? ` · Age ${child.age}` : ""}
                              {!eligible ? " · Outside age range" : ""}
                            </p>
                          </div>
                          {checked && eligible && <span className="text-primary text-sm">✓</span>}
                        </label>
                      )
                    })}
                  </div>

                  {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

                  {event.full ? (
                    <p className="text-center text-sm font-semibold text-destructive">This event is full.</p>
                  ) : (
                    <div className="flex gap-3">
                      <Button variant="ghost" size="md" onClick={onClose} className="flex-1 justify-center">
                        Cancel
                      </Button>
                      <Button
                        variant="accent"
                        size="md"
                        className="flex-1 justify-center"
                        disabled={submitting || selected.size === 0}
                        onClick={handleConfirm}
                      >
                        {submitting
                          ? "Registering…"
                          : `Attend (${selected.size} child${selected.size !== 1 ? "ren" : ""})`}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
