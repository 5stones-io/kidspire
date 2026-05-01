import { useState } from "react"
import { useParams } from "react-router-dom"
import { Calendar, Users, ArrowLeft } from "lucide-react"
import { useEvent }           from "@/hooks/useEvents"
import { useChildren }        from "@/hooks/useChildren"
import { RegistrationButton } from "@/components/kidspire/RegistrationButton"
import { Badge }              from "@/components/ui/Badge"
import { ButtonLink }         from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import type { Registration } from "@/types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const eventId = parseInt(id ?? "0", 10)
  const { event, loading, error, register, cancelRegistration } = useEvent(eventId)
  const { children } = useChildren()
  const [registrations, setRegistrations] = useState<Registration[]>([])

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (error || !event) return <div className="p-8 text-destructive">{error ?? "Event not found"}</div>

  async function handleRegister(childId: number) {
    const reg = await register(childId)
    setRegistrations(prev => [...prev, reg])
    return reg
  }

  async function handleCancel(registrationId: number) {
    await cancelRegistration(registrationId)
    setRegistrations(prev => prev.filter(r => r.id !== registrationId))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <ButtonLink to="/events" variant="ghost" size="sm" className="mb-6 inline-flex">
          <ArrowLeft size={16} /> Back to events
        </ButtonLink>

        <h1 className="font-display text-3xl font-bold text-foreground">{event.title}</h1>

        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={14} /> {formatDate(event.event_date)}
          </span>
          {(event.age_min != null || event.age_max != null) && (
            <span className="flex items-center gap-1">
              <Users size={14} /> Ages {event.age_min ?? 0}–{event.age_max ?? "∞"}
            </span>
          )}
          {event.full && <Badge variant="error">Full</Badge>}
          {!event.full && event.spots_remaining != null && (
            <Badge variant="success">{event.spots_remaining} spots left</Badge>
          )}
        </div>

        {event.description && <p className="mt-4 text-foreground">{event.description}</p>}

        {children.length > 0 ? (
          <Card className="mt-8">
            <CardHeader><CardTitle>Register your children</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {children.map(child => (
                  <div key={child.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{child.full_name}</p>
                      {child.grade && <p className="text-xs text-muted-foreground">Grade {child.grade}</p>}
                    </div>
                    <RegistrationButton
                      child={child}
                      eventFull={event.full}
                      registration={registrations.find(r => r.child_id === child.id)}
                      onRegister={handleRegister}
                      onCancel={handleCancel}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8">
            <CardContent className="text-center text-muted-foreground">
              <p>Add children to your profile to register for events.</p>
              <ButtonLink to="/portal/children" variant="outline" size="sm" className="mt-3 inline-flex">
                Add children
              </ButtonLink>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
