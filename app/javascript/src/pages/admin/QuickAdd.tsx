import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { api, KidsminApiError } from "@/lib/api"
import { Button } from "@/components/ui/Button"

// ── Types ────────────────────────────────────────────────────────────────────

interface ChildRow {
  id:           number   // local key only
  first_name:   string
  last_name:    string
  sameLastName: boolean
  age:          string
  notes:        string
}

interface AdminConfig {
  twilio_enabled: boolean
  pco_connected:  boolean
}

interface Result {
  family:          { id: number }
  invite_url:      string
  invite_method:   "sms" | "email" | "none"
  pco_sync_queued: boolean
}

type PcoStep = "idle" | "queued" | "synced" | "skipped"

// ── Child row component ───────────────────────────────────────────────────────

function ChildEntry({ row, parentLastName, onChange, onRemove, showRemove }: {
  row:            ChildRow
  parentLastName: string
  onChange:       (field: keyof ChildRow, val: string | boolean) => void
  onRemove:       () => void
  showRemove:     boolean
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {/* First name — required */}
        <div>
          <label className="text-sm font-semibold">
            First name <span className="text-destructive">*</span>
          </label>
          <input
            required
            value={row.first_name}
            onChange={e => onChange("first_name", e.target.value)}
            placeholder="Ezra"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Last name — auto-fills from parent, or editable */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">
              Last name <span className="text-destructive">*</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={row.sameLastName}
                onChange={e => onChange("sameLastName", e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-primary"
              />
              <span className="text-xs text-muted-foreground">Same as parent</span>
            </label>
          </div>
          {row.sameLastName ? (
            <div className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm text-muted-foreground flex items-center">
              {parentLastName || <span className="italic">enter parent last name first</span>}
            </div>
          ) : (
            <input
              required
              value={row.last_name}
              onChange={e => onChange("last_name", e.target.value)}
              placeholder="Anderson"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>

        {/* Age — optional */}
        <div>
          <label className="text-sm font-semibold text-muted-foreground">Age</label>
          <input
            type="number"
            min="0"
            max="18"
            value={row.age}
            onChange={e => onChange("age", e.target.value)}
            placeholder="e.g. 7 (optional)"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Allergies — optional */}
        <div>
          <label className="text-sm font-semibold text-muted-foreground">Allergies</label>
          <input
            value={row.notes}
            onChange={e => onChange("notes", e.target.value)}
            placeholder="e.g. Peanuts (optional)"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {showRemove && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
          >
            🗑 Remove
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface GuardianRow {
  id:           number
  first_name:   string
  last_name:    string
  phone:        string
  email:        string
  relationship: string
}

let nextId = 1
const blankChild    = (): ChildRow    => ({ id: nextId++, first_name: "", last_name: "", sameLastName: true, age: "", notes: "" })
const blankGuardian = (): GuardianRow => ({ id: nextId++, first_name: "", last_name: "", phone: "", email: "", relationship: "" })

export default function QuickAdd() {
  const [parent, setParent] = useState({
    primary_contact_first_name: "",
    primary_contact_last_name:  "",
    phone: "",
    email: "",
    address: "",
  })
  const [childRows, setChildRows]       = useState<ChildRow[]>([blankChild()])
  const [guardianRows, setGuardianRows] = useState<GuardianRow[]>([])
  const [config, setConfig]         = useState<AdminConfig | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [result, setResult]         = useState<Result | null>(null)
  const [copied, setCopied]         = useState(false)
  const [pcoStep, setPcoStep]       = useState<PcoStep>("idle")
  const pollRef                     = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api.get<AdminConfig>("/admin/config").then(setConfig).catch(() => {})
  }, [])

  function setP(field: keyof typeof parent) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setParent(p => ({ ...p, [field]: e.target.value }))
  }

  function updateChild(id: number, field: keyof ChildRow, val: string | boolean) {
    setChildRows(rows => rows.map(r => r.id === id ? { ...r, [field]: val } : r))
  }

  function addChild() {
    setChildRows(rows => [...rows, blankChild()])
  }

  function removeChild(id: number) {
    setChildRows(rows => rows.filter(r => r.id !== id))
  }

  function updateGuardian(id: number, field: keyof GuardianRow, val: string) {
    setGuardianRows(rows => rows.map(r => r.id === id ? { ...r, [field]: val } : r))
  }

  function addGuardian() {
    setGuardianRows(rows => [...rows, blankGuardian()])
  }

  function removeGuardian(id: number) {
    setGuardianRows(rows => rows.filter(r => r.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const validChildren = childRows
        .filter(r => r.first_name.trim())
        .map(({ first_name, last_name, sameLastName, age, notes }) => ({
          first_name,
          last_name: sameLastName ? parent.primary_contact_last_name : last_name,
          age:   age   || undefined,
          notes: notes || undefined,
        }))

      const validGuardians = guardianRows
        .filter(r => r.first_name.trim())
        .map(({ first_name, last_name, phone, email, relationship }) => ({
          first_name, last_name: last_name || undefined,
          phone: phone || undefined, email: email || undefined,
          relationship: relationship || undefined,
        }))

      const data = await api.post<Result>("/admin/families", {
        family:    parent,
        children:  validChildren,
        guardians: validGuardians,
      })

      setResult(data)

      // Start PCO sync polling if the job was queued
      if (data.pco_sync_queued) {
        setPcoStep("queued")
        let attempts = 0
        pollRef.current = setInterval(async () => {
          attempts++
          try {
            const status = await api.get<{ pco_person_id: string | null }>(`/admin/families/${data.family.id}`)
            if (status.pco_person_id) {
              clearInterval(pollRef.current!)
              setPcoStep("synced")
            }
          } catch { /* ignore */ }
          if (attempts >= 15) {           // give up after 30s
            clearInterval(pollRef.current!)
            setPcoStep("skipped")
          }
        }, 2000)
      } else {
        setPcoStep("skipped")
      }
    } catch (err) {
      setError(err instanceof KidsminApiError ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function copyLink() {
    if (!result) return
    await navigator.clipboard.writeText(result.invite_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() {
    setParent({ primary_contact_first_name: "", primary_contact_last_name: "", phone: "", email: "", address: "" })
    setChildRows([blankChild()])
    setGuardianRows([])
    setResult(null)
    setError(null)
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (result) {
    const steps: { label: string; detail: string; done: boolean; spinning: boolean }[] = [
      {
        label:    "Family saved",
        detail:   "Profile, children, and invite link created.",
        done:     true,
        spinning: false,
      },
      {
        label:    result.invite_method === "sms"   ? "Invite sent via SMS"
                : result.invite_method === "email" ? "Invite sent via email"
                :                                    "Invite link ready",
        detail:   result.invite_method === "sms"   ? "Text message sent to the parent's phone."
                : result.invite_method === "email" ? "Email sent to the parent's inbox."
                :                                    "Copy the link below and send it to the parent.",
        done:     true,
        spinning: false,
      },
      {
        label:    pcoStep === "synced"  ? "Saved to Planning Center"
                : pcoStep === "skipped" ? "Planning Center not connected"
                : pcoStep === "queued"  ? "Saving to Planning Center…"
                : "",
        detail:   pcoStep === "synced"  ? "Person and children created in PCO with kidsmin tag."
                : pcoStep === "skipped" ? "Connect PCO in admin settings to enable this step."
                : pcoStep === "queued"  ? "Running in the background — this usually takes a few seconds."
                : "",
        done:     pcoStep === "synced" || pcoStep === "skipped",
        spinning: pcoStep === "queued",
      },
    ].filter(s => s.label)

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 md:px-6">
            <Link to="/portal/dashboard" className="font-display text-xl font-bold text-primary">kidsmin</Link>
            <span className="text-sm font-semibold text-muted-foreground">Admin</span>
          </div>
        </header>

        <div className="mx-auto max-w-lg px-4 py-16 md:px-6">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="font-display text-3xl font-bold">Family added!</h1>
          </div>

          {/* Progress steps */}
          <div className="rounded-3xl bg-card p-7 shadow-playful mb-6 space-y-5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold transition-all ${
                  step.spinning ? "border-2 border-primary border-t-transparent animate-spin"
                : step.done    ? "bg-primary text-primary-foreground"
                :                "bg-secondary text-muted-foreground"
                }`}>
                  {!step.spinning && (step.done ? "✓" : i + 1)}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${step.spinning ? "text-primary" : ""}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Invite link */}
          <div className="rounded-2xl border border-border bg-secondary/40 p-5 mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Invite link</p>
            <p className="break-all text-sm font-mono text-foreground">{result.invite_url}</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={copyLink}>
              {copied ? "✓ Copied!" : "Copy link"}
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="accent" size="md" onClick={reset}>
              + Add another family
            </Button>
            <Link to="/admin"
              className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition">
              Back to admin
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/portal/dashboard" className="font-display text-xl font-bold text-primary">kidsmin</Link>
          <span className="text-sm font-semibold text-muted-foreground">Admin · Quick Add</span>
        </div>
      </header>

      <section className="bg-gradient-soft">
        <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Admin</span>
          <h1 className="mt-1 font-display text-4xl font-bold">Quick add family</h1>
          <p className="mt-2 text-muted-foreground">
            Enter the basics — a text link lets the parent finish their profile later.
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">

        {/* Parent info */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <h2 className="font-display text-xl font-bold mb-5">Parent / guardian</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">
                First name <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={parent.primary_contact_first_name}
                onChange={setP("primary_contact_first_name")}
                placeholder="Sarah"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">
                Last name <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={parent.primary_contact_last_name}
                onChange={setP("primary_contact_last_name")}
                placeholder="Anderson"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">
                Mobile number <span className="text-destructive">*</span>
              </label>
              <input
                required
                type="tel"
                value={parent.phone}
                onChange={setP("phone")}
                placeholder="(408) 555-0142"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">
                Email <span className="text-destructive">*</span>
              </label>
              {config && !config.twilio_enabled && (
                <p className="text-xs text-amber-600 mt-0.5">
                  SMS not configured — invite will be sent by email.
                </p>
              )}
              <input
                type="email"
                required
                value={parent.email}
                onChange={setP("email")}
                placeholder="sarah@email.com"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold">Home address <span className="text-destructive">*</span></label>
              <input
                required
                value={parent.address}
                onChange={setP("address")}
                placeholder="123 Main St, Fairfax, VA 22030"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Additional guardians */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-xl font-bold">Additional parents / guardians</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Other adults who can pick up or are emergency contacts</p>
            </div>
          </div>

          <div className="space-y-4">
            {guardianRows.map(row => (
              <div key={row.id} className="rounded-2xl border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-semibold">First name <span className="text-destructive">*</span></label>
                    <input required value={row.first_name}
                      onChange={e => updateGuardian(row.id, "first_name", e.target.value)}
                      placeholder="David"
                      className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Last name</label>
                    <input value={row.last_name}
                      onChange={e => updateGuardian(row.id, "last_name", e.target.value)}
                      placeholder="Anderson"
                      className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Relationship</label>
                    <select value={row.relationship}
                      onChange={e => updateGuardian(row.id, "relationship", e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— Select —</option>
                      {["Mother","Father","Stepmother","Stepfather","Grandparent","Guardian","Other"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Mobile</label>
                    <input type="tel" value={row.phone}
                      onChange={e => updateGuardian(row.id, "phone", e.target.value)}
                      placeholder="(408) 555-0100"
                      className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Email</label>
                    <input type="email" value={row.email}
                      onChange={e => updateGuardian(row.id, "email", e.target.value)}
                      placeholder="david@email.com"
                      className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => removeGuardian(row.id)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition">
                    🗑 Remove
                  </button>
                </div>
              </div>
            ))}

            {guardianRows.length === 0 && (
              <p className="text-sm text-muted-foreground">No additional guardians yet.</p>
            )}
          </div>

          <button type="button" onClick={addGuardian}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition">
            + Add parent / guardian
          </button>
        </div>

        {/* Children */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold">Children</h2>
            <span className="text-xs text-muted-foreground">First name required · rest optional</span>
          </div>

          <div className="space-y-3">
            {childRows.map((row, idx) => (
              <ChildEntry
                key={row.id}
                row={row}
                parentLastName={parent.primary_contact_last_name}
                onChange={(field, val) => updateChild(row.id, field, val)}
                onRemove={() => removeChild(row.id)}
                showRemove={childRows.length > 1}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addChild}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition"
          >
            + Add another child
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pb-10">
          <Link to="/portal/dashboard"
            className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition">
            Cancel
          </Link>
          <Button type="submit" variant="accent" size="lg" disabled={submitting}>
            {submitting ? "Adding…" : "Add family & send link"}
          </Button>
        </div>

      </form>
    </div>
  )
}
