import { useState } from "react"
import { Link } from "react-router-dom"
import { api, KidsminApiError } from "@/lib/api"
import { Button } from "@/components/ui/Button"

// ── Types ────────────────────────────────────────────────────────────────────

interface ChildRow {
  id:         number   // local key only
  first_name: string
  last_name:  string
  age:        string
  notes:      string
}

interface Result {
  invite_url: string
  sms_sent:   boolean
}

// ── Child row component ───────────────────────────────────────────────────────

function ChildEntry({ row, onChange, onRemove, showRemove }: {
  row:       ChildRow
  onChange:  (field: keyof ChildRow, val: string) => void
  onRemove:  () => void
  showRemove: boolean
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

        {/* Last name — optional */}
        <div>
          <label className="text-sm font-semibold text-muted-foreground">Last name</label>
          <input
            value={row.last_name}
            onChange={e => onChange("last_name", e.target.value)}
            placeholder="Anderson (optional)"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
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
const blankChild    = (): ChildRow    => ({ id: nextId++, first_name: "", last_name: "", age: "", notes: "" })
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [result, setResult]         = useState<Result | null>(null)
  const [copied, setCopied]         = useState(false)

  function setP(field: keyof typeof parent) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setParent(p => ({ ...p, [field]: e.target.value }))
  }

  function updateChild(id: number, field: keyof ChildRow, val: string) {
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
        .map(({ first_name, last_name, age, notes }) => ({
          first_name, last_name, age: age || undefined, notes: notes || undefined,
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
    } catch (err) {
      setError(err instanceof KidsminApiError ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

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
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 md:px-6">
            <Link to="/portal/dashboard" className="font-display text-xl font-bold text-primary">kidsmin</Link>
            <span className="text-sm font-semibold text-muted-foreground">Admin</span>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="font-display text-3xl font-bold">Family added!</h1>
          <p className="mt-3 text-muted-foreground">
            {result.sms_sent
              ? "A text was sent with their invite link."
              : "Copy the link below and send it to the parent."}
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Invite link</p>
            <p className="break-all text-sm font-mono text-foreground">{result.invite_url}</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={copyLink}
            >
              {copied ? "✓ Copied!" : "Copy link"}
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="accent" size="md" onClick={reset}>
              + Add another family
            </Button>
            <Link to="/portal/dashboard"
              className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition">
              Back to dashboard
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
              <label className="text-sm font-semibold text-muted-foreground">Email</label>
              <input
                type="email"
                value={parent.email}
                onChange={setP("email")}
                placeholder="sarah@email.com (optional)"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-muted-foreground">Home address</label>
              <input
                value={parent.address}
                onChange={setP("address")}
                placeholder="123 Main St, Fairfax, VA 22030 (optional)"
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
