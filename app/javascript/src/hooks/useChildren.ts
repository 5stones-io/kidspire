import { useState, useEffect } from "react"
import { api, KidspireApiError } from "@/lib/api"
import type { Child } from "@/types"

export function useChildren() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    api.get<Child[]>("/children")
      .then(setChildren)
      .catch((e: KidspireApiError) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function addChild(data: Omit<Child, "id" | "family_id" | "full_name" | "age">) {
    const child = await api.post<Child>("/children", { child: data })
    setChildren(prev => [...prev, child])
    return child
  }

  async function updateChild(id: number, data: Partial<Child>) {
    const updated = await api.patch<Child>(`/children/${id}`, { child: data })
    setChildren(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }

  async function removeChild(id: number) {
    await api.delete(`/children/${id}`)
    setChildren(prev => prev.filter(c => c.id !== id))
  }

  return { children, loading, error, addChild, updateChild, removeChild }
}
