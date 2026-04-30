import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { ButtonLink } from "@/components/ui/Button"

// ── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  families:      { total: number; active: number; pending: number }
  children:      number
  events:        { upcoming: number; total: number }
  invitations:   { pending: number }
  registrations: { this_month: number }
}

interface FamilyRow {
  id: number
  family_name: string | null
  primary_contact_first_name: string | null
  primary_contact_last_name:  string | null
  email:          string | null
  phone:          string | null
  children_count: number
  account_linked: boolean
  created_at:     string
}

interface RegRow {
  id:           number
  family_name:  string
  child_name:   string
  child_grade:  string
  event_title:  string
  event_date:   string
  registered_at: string
}

type Tab = "families" | "registrations"

// ── Helpers ───────────────────────────────────────────────────────────────────

function PcoStatusBadge() {
  const [status, setStatus] = useState<{ pco_connected: boolean } | null>(null)
  useEffect(() => {
    api.get<{ pco_connected: boolean }>("/admin/config").then(setStatus).catch(() => {})
  }, [])
  if (!status) return null
  return status.pco_connected
    ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">● Connected</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">● Not connected</span>
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: number | string; sub?: string; accent?: string
}) {
  return (
    <div className={`rounded-2xl p-5 ${accent ?? "bg-card"} shadow-playful`}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
    </div>
  )
}

function StatusBadge({ linked }: { linked: boolean }) {
  return linked
    ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">● Active</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">● Pending</span>
}

// ── Families table ────────────────────────────────────────────────────────────

function FamiliesTab({ families, loading }: { families: FamilyRow[]; loading: boolean }) {
  const [search, setSearch]         = useState("")
  const [resending, setResending]   = useState<number | null>(null)
  const [inviteLink, setInviteLink] = useState<{ id: number; url: string } | null>(null)

  const filtered = families.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      f.family_name?.toLowerCase().includes(q) ||
      f.primary_contact_first_name?.toLowerCase().includes(q) ||
      f.primary_contact_last_name?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.phone?.includes(q)
    )
  })

  const contactName = (f: FamilyRow) =>
    [f.primary_contact_first_name, f.primary_contact_last_name].filter(Boolean).join(" ") || "—"

  async function resendInvite(id: number) {
    setResending(id)
    try {
      const res = await api.post<{ invite_url: string }>(`/admin/families/${id}/invite`, {})
      setInviteLink({ id, url: res.invite_url })
    } finally {
      setResending(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="font-display text-2xl font-bold">Families</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="h-10 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {inviteLink && (
        <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary mb-1">New invite link generated — copy and send to the family:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-background px-3 py-2 text-xs break-all">{inviteLink.url}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(inviteLink.url); setInviteLink(null) }}
              className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Family / contact</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Phone</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Kids</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-secondary animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {search ? "No families match your search." : "No families yet — add the first one!"}
                </td>
              </tr>
            )}
            {filtered.map(f => (
              <tr key={f.id} className="hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold">{f.family_name || `${contactName(f)} Family`}</p>
                  <p className="text-xs text-muted-foreground">{contactName(f)}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{f.phone || "—"}</td>
                <td className="px-4 py-3 text-center font-semibold">{f.children_count}</td>
                <td className="px-4 py-3"><StatusBadge linked={f.account_linked} /></td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                  {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      to={`/admin/families/${f.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                    {!f.account_linked && (
                      <button
                        onClick={() => resendInvite(f.id)}
                        disabled={resending === f.id}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {resending === f.id ? "Sending…" : "Resend invite"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && (
        <p className="mt-2 text-xs text-muted-foreground">{filtered.length} of {families.length} families</p>
      )}
    </>
  )
}

// ── Registrations table ───────────────────────────────────────────────────────

function RegistrationsTab() {
  const [regs, setRegs]       = useState<RegRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")

  useEffect(() => {
    api.get<{ registrations: RegRow[] }>("/admin/registrations")
      .then(r => setRegs(r.registrations))
      .finally(() => setLoading(false))
  }, [])

  const filtered = regs.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.family_name.toLowerCase().includes(q) ||
           r.child_name.toLowerCase().includes(q) ||
           r.event_title.toLowerCase().includes(q)
  })

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="font-display text-2xl font-bold">Registrations</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search family, child, or event…"
          className="h-10 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Family</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Child</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Grade</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Event</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Event date</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-secondary animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {search ? "No registrations match your search." : "No registrations yet."}
                </td>
              </tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3 font-semibold">{r.family_name}</td>
                <td className="px-4 py-3">{r.child_name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.child_grade || "—"}</td>
                <td className="px-4 py-3">{r.event_title}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {new Date(r.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                  {new Date(r.registered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && (
        <p className="mt-2 text-xs text-muted-foreground">{filtered.length} registrations</p>
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [families, setFamilies] = useState<FamilyRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<Tab>("families")
  const [syncing, setSyncing]   = useState(false)
  const [syncResult, setSyncResult] = useState<{ enqueued: string[]; timestamp: string } | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<Stats>("/admin/stats"),
      api.get<{ families: FamilyRow[] }>("/admin/families"),
    ]).then(([s, f]) => {
      setStats(s)
      setFamilies(f.families)
    }).finally(() => setLoading(false))
  }, [])

  async function triggerSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await api.post<{ enqueued: string[]; timestamp: string }>("/sync/trigger", {})
      setSyncResult(res)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/portal/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Portal</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-display text-lg font-bold">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink to="/admin/settings" variant="ghost" size="sm">Settings</ButtonLink>
            <ButtonLink to="/admin/quick-add" variant="accent" size="sm">+ Add family</ButtonLink>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        {/* Stats */}
        <section className="mb-10">
          <h1 className="font-display text-3xl font-bold mb-5">Overview</h1>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : stats && (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Total families"   value={stats.families.total} />
              <StatCard label="Active"           value={stats.families.active}   sub="account linked"  accent="bg-green-50" />
              <StatCard label="Pending"          value={stats.families.pending}  sub="invite not used" accent="bg-amber-50" />
              <StatCard label="Children"         value={stats.children} />
              <StatCard label="Upcoming events"  value={stats.events.upcoming} />
              <StatCard label="Registrations"    value={stats.registrations.this_month} sub="this month" />
            </div>
          )}
        </section>

        {/* PCO Sync */}
        <section className="mb-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold">Planning Center sync</h2>
                {stats && (
                  <PcoStatusBadge />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Imports families tagged in PCO and upcoming events. Jobs run in the background.
              </p>
              {syncResult && (
                <p className="text-xs text-green-700 mt-1.5">
                  ✓ Queued: {syncResult.enqueued.join(", ")} — {new Date(syncResult.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ButtonLink to="/admin/settings" variant="ghost" size="sm">Configure</ButtonLink>
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="rounded-xl border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50 transition"
              >
                {syncing ? "Queuing…" : "Sync from PCO"}
              </button>
            </div>
          </div>
        </section>

        {/* Tab switcher */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-secondary p-1 w-fit">
          {(["families", "registrations"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "families"      && <FamiliesTab families={families} loading={loading} />}
        {tab === "registrations" && <RegistrationsTab />}
      </div>
    </div>
  )
}
