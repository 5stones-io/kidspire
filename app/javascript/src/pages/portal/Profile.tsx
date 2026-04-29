import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useFamily }   from "@/hooks/useFamily"
import { useChildren } from "@/hooks/useChildren"
import { Button, ButtonLink } from "@/components/ui/Button"
import { supabase } from "@/lib/supabase"
import type { Child } from "@/types"

// ── Shared form primitives ───────────────────────────────────────────────────

function Field({ label, id, type = "text", value, onChange, required }: {
  label: string; id: string; type?: string; required?: boolean
  value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      <input
        id={id} type={type} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <label className="relative inline-block h-6 w-11 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-border transition peer-checked:bg-primary" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
      </label>
    </div>
  )
}

// ── Child completeness ───────────────────────────────────────────────────────

function isComplete(child: Child) {
  return !!(child.birthdate && child.grade !== null)
}

// ── Child row (existing child, always editable) ──────────────────────────────

type ChildDraft = Child & { _dirty?: boolean }

function ChildRow({ child, onChange, onRemove }: {
  child: ChildDraft
  onChange: (field: keyof Child, val: string | number | null) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(!isComplete(child))

  return (
    <div className={`rounded-2xl border p-4 transition ${!isComplete(child) ? "border-amber-300 bg-amber-50/40" : "border-border"}`}>
      {/* Summary row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-pink-soft font-display text-base font-bold">
            {child.first_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-semibold">{child.first_name} {child.last_name}</p>
            {isComplete(child) ? (
              <p className="text-xs text-muted-foreground">
                {child.grade_display} · Age {child.age ?? "—"}
              </p>
            ) : (
              <p className="text-xs font-semibold text-amber-600">
                ⚠ Add birthdate &amp; grade for full PCO sync
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition"
          >
            {expanded ? "▲ Less" : "▼ Edit"}
          </button>
          <button
            onClick={onRemove}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
          >
            🗑 Remove
          </button>
        </div>
      </div>

      {/* Expanded detail fields */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" id={`fn-${child.id}`} required
              value={child.first_name} onChange={v => onChange("first_name", v)} />
            <Field label="Last name" id={`ln-${child.id}`} required
              value={child.last_name}  onChange={v => onChange("last_name", v)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Birthdate" id={`bd-${child.id}`} type="date"
              value={child.birthdate ?? ""} onChange={v => onChange("birthdate", v || null)} />
            <div>
              <label htmlFor={`gr-${child.id}`} className="text-sm font-semibold">Grade</label>
              <select
                id={`gr-${child.id}`}
                value={child.grade ?? ""}
                onChange={e => onChange("grade", e.target.value === "" ? null : Number(e.target.value))}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Grade —</option>
                {[["0","K"],["1","1st"],["2","2nd"],["3","3rd"],["4","4th"],["5","5th"],
                  ["6","6th"],["7","7th"],["8","8th"],["9","9th"],["10","10th"],["11","11th"],["12","12th"]]
                  .map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <Field label="Allergies / notes" id={`nt-${child.id}`}
              value={child.notes ?? ""} onChange={v => onChange("notes", v || null)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Quick-add form (name only — minimum PCO requires) ────────────────────────

function QuickAddChild({ onAdd }: { onAdd: (first: string, last: string) => Promise<void> }) {
  const [open, setOpen]         = useState(false)
  const [first, setFirst]       = useState("")
  const [last, setLast]         = useState("")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!first.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onAdd(first.trim(), last.trim())
      setFirst("")
      setLast("")
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not add child")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition"
      >
        + Add child
      </button>
    )
  }

  return (
    <form onSubmit={handleAdd} className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-semibold text-primary mb-3">
        Quick add — just a name to start. You can add birthdate, grade, and allergies after.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="text-sm font-semibold">First name <span className="text-destructive">*</span></label>
          <input
            autoFocus required value={first} onChange={e => setFirst(e.target.value)}
            placeholder="e.g. Ezra"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Last name</label>
          <input
            value={last} onChange={e => setLast(e.target.value)}
            placeholder="e.g. Anderson"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="primary" size="md" disabled={saving || !first.trim()}>
            {saving ? "Adding…" : "Add"}
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={() => { setOpen(false); setFirst(""); setLast("") }}>
            Cancel
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate()
  const { family, loading: familyLoading, updateFamily } = useFamily()
  const { children, loading: childrenLoading, addChild, updateChild, removeChild } = useChildren()

  const [familyForm, setFamilyForm] = useState<Record<string, string>>({})
  const [childDrafts, setChildDrafts] = useState<Map<number, Partial<Child>>>(new Map())
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [notifs, setNotifs] = useState({ events: true, newsletter: false, churchcred: true })

  const fval = (k: string) => familyForm[k] ?? (family as Record<string, unknown>)?.[k] as string ?? ""
  const fset  = (k: string) => (v: string) => setFamilyForm(p => ({ ...p, [k]: v }))

  function updateDraft(childId: number, field: keyof Child, val: string | number | null) {
    setChildDrafts(prev => {
      const next = new Map(prev)
      next.set(childId, { ...(next.get(childId) ?? {}), [field]: val })
      return next
    })
  }

  function mergedChild(child: Child): ChildDraft {
    return { ...child, ...(childDrafts.get(child.id) ?? {}), _dirty: childDrafts.has(child.id) }
  }

  async function quickAdd(firstName: string, lastName: string) {
    await addChild({
      first_name: firstName, last_name: lastName,
      birthdate: null, grade: null, notes: null,
    })
  }

  async function handleRemove(id: number) {
    await removeChild(id)
    setChildDrafts(prev => { const next = new Map(prev); next.delete(id); return next })
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (Object.keys(familyForm).length > 0) await updateFamily(familyForm)

      for (const [childId, draft] of childDrafts) {
        if (Object.keys(draft).length > 0) await updateChild(childId, draft)
      }

      setChildDrafts(new Map())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const incomplete = children.filter(c => !isComplete(c))

  if (familyLoading || childrenLoading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 md:px-6">
          <ButtonLink to="/portal/dashboard" variant="ghost" size="sm">← Dashboard</ButtonLink>
          <Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/") }}>
            Sign out
          </Button>
        </div>
      </header>

      <section className="bg-gradient-soft">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Account settings</span>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Your family profile</h1>
          {incomplete.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
              ⚠ {incomplete.length} child{incomplete.length > 1 ? "ren" : ""} missing birthdate or grade
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:px-6">

        {/* Family information */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <h2 className="font-display text-2xl font-bold">Family information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Family name"  id="family_name"                value={fval("family_name")}                onChange={fset("family_name")} />
            <Field label="First name"   id="primary_contact_first_name" value={fval("primary_contact_first_name")} onChange={fset("primary_contact_first_name")} />
            <Field label="Last name"    id="primary_contact_last_name"  value={fval("primary_contact_last_name")}  onChange={fset("primary_contact_last_name")} />
            <Field label="Email" type="email" id="email"                value={fval("email")}                      onChange={fset("email")} />
            <Field label="Phone" type="tel"   id="phone"                value={fval("phone")}                      onChange={fset("phone")} />
            <div className="sm:col-span-2">
              <label htmlFor="address" className="text-sm font-semibold text-muted-foreground">Home address</label>
              <input
                id="address"
                value={fval("address")}
                onChange={e => fset("address")(e.target.value)}
                placeholder="123 Main St, City, State ZIP (optional)"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Children */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold">Children</h2>
            <span className="text-sm text-muted-foreground">
              {children.length} added
            </span>
          </div>

          <div className="space-y-4">
            {children.map(child => (
              <ChildRow
                key={child.id}
                child={mergedChild(child)}
                onChange={(field, val) => updateDraft(child.id, field, val)}
                onRemove={() => handleRemove(child.id)}
              />
            ))}

            {children.length === 0 && (
              <p className="text-sm text-muted-foreground">No children added yet.</p>
            )}
          </div>

          <div className="mt-5">
            <QuickAddChild onAdd={quickAdd} />
          </div>
        </div>

        {/* Connected accounts */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <h2 className="font-display text-2xl font-bold">Connected accounts</h2>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-soft">🔵</span>
                <div>
                  <p className="font-semibold">Google / Apple</p>
                  <p className="text-xs text-muted-foreground">{family?.email}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-3 py-1 text-xs font-bold">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">⛪</span>
                <div>
                  <p className="font-semibold">Planning Center</p>
                  <p className="text-xs text-muted-foreground">Sync your family's check-ins automatically</p>
                </div>
              </div>
              <button disabled className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold opacity-50">
                Coming soon
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <h2 className="font-display text-2xl font-bold">Notifications</h2>
          <div className="mt-5 space-y-4">
            <Toggle label="Event reminders"   desc="Texts before each registered event."    checked={notifs.events}     onChange={v => setNotifs(n => ({ ...n, events: v }))} />
            <Toggle label="Monthly newsletter" desc="What's coming up in kids ministry."    checked={notifs.newsletter} onChange={v => setNotifs(n => ({ ...n, newsletter: v }))} />
            <Toggle label="ChurchCred updates" desc="When your kids earn points or badges." checked={notifs.churchcred} onChange={v => setNotifs(n => ({ ...n, churchcred: v }))} />
          </div>
        </div>

        {saved && (
          <div className="rounded-2xl bg-mint-soft px-4 py-3 text-sm font-semibold">
            ✓ Changes saved.
          </div>
        )}

        <div className="flex justify-end gap-3 pb-10">
          <ButtonLink to="/portal/dashboard" variant="ghost" size="md">Cancel</ButtonLink>
          <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

      </div>
    </div>
  )
}
