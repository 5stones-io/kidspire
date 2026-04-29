import { useState, useEffect } from "react"
import { api, KidsminApiError } from "@/lib/api"
import type { Family } from "@/types"

export function useFamily() {
  const [family, setFamily]   = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    api.get<Family>("/family")
      .then(setFamily)
      .catch((e: KidsminApiError) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function updateFamily(data: Partial<Family>) {
    const updated = await api.patch<Family>("/family", { family: data })
    setFamily(updated)
    return updated
  }

  return { family, loading, error, updateFamily, setFamily }
}
