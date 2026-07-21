import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"

// ── Types ────────────────────────────────────────────────────────────────────
// Split to match the backend split: identity/people-sync settings live in
// spirely (/sync_settings), ministry/events+registrations settings live in
// kidspire's own narrowed copy (/ministry_sync_settings).

interface IdentitySyncSettings {
  inbound_people_sync:  boolean
  outbound_people_sync: boolean
  sync_frequency_hours: number
  conflict_resolution:  string
  auto_sync_enabled:    boolean
  pco_ministry_tag:     string | null
  last_synced_at:       string | null
}

interface MinistrySyncSettings {
  inbound_events_sync:         boolean
  outbound_registrations_sync: boolean
  last_synced_at:              string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <label className="relative inline-block h-6 w-11 shrink-0 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-border transition peer-checked:bg-primary" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
      </label>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card p-7 shadow-playful">
      <h2 className="font-display text-xl font-bold mb-5">{title}</h2>
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [identity, setIdentity]   = useState<IdentitySyncSettings | null>(null)
  const [ministry, setMinistry]   = useState<MinistrySyncSettings | null>(null)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [pcoConnected, setPcoConnected] = useState<boolean | null>(null)

  useEffect(() => {
    api.get<IdentitySyncSettings>("/sync_settings").then(setIdentity)
    api.get<MinistrySyncSettings>("/ministry_sync_settings").then(setMinistry)
    // Check PCO connection by trying to read the church integration
    api.get<{ connected: boolean }>("/admin/pco_status")
      .then(r => setPcoConnected(r.connected))
      .catch(() => setPcoConnected(false))
  }, [])

  function updateIdentity<K extends keyof IdentitySyncSettings>(key: K, value: IdentitySyncSettings[K]) {
    setIdentity(prev => prev ? { ...prev, [key]: value } : prev)
  }

  function updateMinistry<K extends keyof MinistrySyncSettings>(key: K, value: MinistrySyncSettings[K]) {
    setMinistry(prev => prev ? { ...prev, [key]: value } : prev)
  }

  async function save() {
    if (!identity || !ministry) return
    setSaving(true)
    setSaved(false)
    try {
      const [updatedIdentity, updatedMinistry] = await Promise.all([
        api.patch<IdentitySyncSettings>("/sync_settings", {
          sync_setting: {
            inbound_people_sync:  identity.inbound_people_sync,
            outbound_people_sync: identity.outbound_people_sync,
            sync_frequency_hours: identity.sync_frequency_hours,
            conflict_resolution:  identity.conflict_resolution,
            auto_sync_enabled:    identity.auto_sync_enabled,
            pco_ministry_tag:     identity.pco_ministry_tag || null,
          }
        }),
        api.patch<MinistrySyncSettings>("/ministry_sync_settings", {
          sync_setting: {
            inbound_events_sync:         ministry.inbound_events_sync,
            outbound_registrations_sync: ministry.outbound_registrations_sync,
          }
        }),
      ])
      setIdentity(updatedIdentity)
      setMinistry(updatedMinistry)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function triggerSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const [people, events] = await Promise.all([
        api.post<{ enqueued: string[] }>("/sync/trigger", {}),
        api.post<{ enqueued: string[] }>("/ministry/sync/trigger", {}),
      ])
      setSyncResult(`Queued: ${[...people.enqueued, ...events.enqueued].join(", ")}`)
    } finally {
      setSyncing(false)
    }
  }

  if (!identity || !ministry) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  )

  const nextSync = identity.auto_sync_enabled && identity.last_synced_at
    ? new Date(new Date(identity.last_synced_at).getTime() + identity.sync_frequency_hours * 3600000)
    : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Admin</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-display text-lg font-bold">Sync settings</span>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 space-y-6">

        {/* PCO Connection */}
        <Section title="Planning Center connection">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                Status:{" "}
                {pcoConnected === null ? "Checking…" :
                 pcoConnected ? <span className="text-green-700">● Connected</span>
                              : <span className="text-amber-700">● Not connected</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                OAuth tokens are stored securely. Reconnect if the sync stops working.
              </p>
            </div>
            <a
              href="/auth/pco/connect"
              className="shrink-0 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition"
            >
              {pcoConnected ? "Reconnect" : "Connect PCO"}
            </a>
          </div>
        </Section>

        {/* Import settings — families/children (spirely) */}
        <Section title="Family import settings">
          <div className="mb-5">
            <label className="text-sm font-semibold">Ministry tag</label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Only import PCO families tagged with this name. Leave blank to import everyone.
              Create the tag in PCO → People → More → Tags.
            </p>
            <input
              type="text"
              value={identity.pco_ministry_tag ?? ""}
              onChange={e => updateIdentity("pco_ministry_tag", e.target.value || null)}
              placeholder="spirely"
              className="h-11 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mb-5">
            <label className="text-sm font-semibold">Conflict resolution</label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              When a family exists in both spirely and PCO with different data, which wins?
            </p>
            <select
              value={identity.conflict_resolution}
              onChange={e => updateIdentity("conflict_resolution", e.target.value)}
              className="h-11 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="pco_wins">PCO always wins</option>
              <option value="local_wins">spirely always wins</option>
              <option value="newest_wins">Most recently updated wins</option>
            </select>
          </div>

          <Toggle
            label="Import families from PCO"
            desc="Sync people and households into family profiles"
            checked={identity.inbound_people_sync}
            onChange={v => updateIdentity("inbound_people_sync", v)}
          />
          <Toggle
            label="Push profile updates to PCO"
            desc="When a family edits their profile, update PCO"
            checked={identity.outbound_people_sync}
            onChange={v => updateIdentity("outbound_people_sync", v)}
          />
        </Section>

        {/* Import settings — events/registrations (kidspire) */}
        <Section title="Ministry import settings">
          <Toggle
            label="Import events from PCO"
            desc="Sync upcoming Calendar and Check-Ins events"
            checked={ministry.inbound_events_sync}
            onChange={v => updateMinistry("inbound_events_sync", v)}
          />
          <Toggle
            label="Push registrations to PCO"
            desc="Sync event registrations back to PCO Check-Ins"
            checked={ministry.outbound_registrations_sync}
            onChange={v => updateMinistry("outbound_registrations_sync", v)}
          />
          {ministry.last_synced_at && (
            <p className="mt-4 text-xs text-muted-foreground">
              Last ministry sync: {new Date(ministry.last_synced_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </Section>

        {/* Automatic sync — identity-only; ministry sync is manual-trigger only */}
        <Section title="Automatic sync">
          <Toggle
            label="Enable automatic sync"
            desc="Runs in the background on the interval below. Requires Sidekiq worker to be running."
            checked={identity.auto_sync_enabled}
            onChange={v => updateIdentity("auto_sync_enabled", v)}
          />

          <div className="mt-5">
            <label className="text-sm font-semibold">Sync frequency</label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">How often to run the automatic import.</p>
            <select
              value={identity.sync_frequency_hours}
              onChange={e => updateIdentity("sync_frequency_hours", Number(e.target.value))}
              disabled={!identity.auto_sync_enabled}
              className="h-11 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value={1}>Every hour</option>
              <option value={3}>Every 3 hours</option>
              <option value={6}>Every 6 hours</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Once a day</option>
            </select>
          </div>

          {(identity.last_synced_at || nextSync) && (
            <div className="mt-4 rounded-2xl bg-secondary/60 p-4 text-sm space-y-1">
              {identity.last_synced_at && (
                <p>
                  <span className="text-muted-foreground">Last sync: </span>
                  {new Date(identity.last_synced_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              {nextSync && identity.auto_sync_enabled && (
                <p>
                  <span className="text-muted-foreground">Next sync: </span>
                  {nextSync.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Manual import */}
        <Section title="Manual import">
          <p className="text-sm text-muted-foreground mb-4">
            Trigger an immediate import from PCO regardless of the automatic schedule.
            Jobs run in the background — check the admin dashboard for updated counts.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {syncing ? "Queuing…" : "Import from PCO now"}
            </button>
            {syncResult && (
              <p className="text-sm text-green-700 font-medium">✓ {syncResult}</p>
            )}
          </div>
        </Section>

      </div>
    </div>
  )
}
