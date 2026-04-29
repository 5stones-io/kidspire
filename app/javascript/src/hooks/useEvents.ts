import { useState, useEffect } from "react"
import { api, KidsminApiError } from "@/lib/api"
import type { Event, EventsPage, Registration } from "@/types"

export function useEvents(page = 1) {
  const [data, setData]       = useState<EventsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get<EventsPage>(`/events?page=${page}`)
      .then(setData)
      .catch((e: KidsminApiError) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  return { events: data?.events ?? [], meta: data?.meta, loading, error }
}

export function useEvent(id: number) {
  const [event, setEvent]     = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    api.get<Event>(`/events/${id}`)
      .then(setEvent)
      .catch((e: KidsminApiError) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function register(childId: number): Promise<Registration> {
    return api.post<Registration>("/registrations", {
      registration: { event_id: id, child_id: childId },
    })
  }

  async function cancelRegistration(registrationId: number) {
    await api.delete(`/registrations/${registrationId}`)
  }

  return { event, loading, error, register, cancelRegistration }
}
