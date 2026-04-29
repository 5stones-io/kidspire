import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { KidsminApiError } from "@/lib/api"
import type { Child, Registration } from "@/types"

interface RegistrationButtonProps {
  child: Child
  eventFull: boolean
  registration: Registration | undefined
  onRegister:  (childId: number) => Promise<Registration>
  onCancel:    (registrationId: number) => Promise<void>
}

export function RegistrationButton({
  child, eventFull, registration, onRegister, onCancel,
}: RegistrationButtonProps) {
  const [pending, setPending] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleRegister() {
    setPending(true)
    setError(null)
    try { await onRegister(child.id) }
    catch (e) { setError(e instanceof KidsminApiError ? e.message : "Registration failed") }
    finally { setPending(false) }
  }

  async function handleCancel() {
    if (!registration) return
    setPending(true)
    setError(null)
    try { await onCancel(registration.id) }
    catch (e) { setError(e instanceof KidsminApiError ? e.message : "Could not cancel") }
    finally { setPending(false) }
  }

  if (registration) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle2 size={16} /> Registered
        </span>
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button
        variant="accent"
        size="sm"
        onClick={handleRegister}
        disabled={pending || eventFull}
      >
        {pending ? "Registering…" : eventFull ? "Event Full" : `Register ${child.first_name}`}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
