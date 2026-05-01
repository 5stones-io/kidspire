import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"

// ── Types ────────────────────────────────────────────────────────────────────

interface SyncSettings {
  inbound_people_sync:         boolean
  inbound_events_sync:         boolean
  outbound_people_sync:        boolean
  outbound_registrations_sync: boolean
  sync_frequency_hours:        number
  conflict_resolution:         string
  auto_sync_enabled:           boolean
  pco_kids_ministry_tag:       string | null
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
  const [settings, setSettings]   = useState<SyncSettings | null>(null)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [pcoConnected, setPcoConnected] = useState<boolean | null>(null)

  useEffect(() => {
    api.get<SyncSettings>("/sync_settings").then(setSettings)
    // Check PCO connection by trying to read the church integration
    api.get<{ connected: boolean }>("/admin/pco_status")
      .then(r => setPcoConnected(r.connected))
      .catch(() => setPcoConnected(false))
  }, [])

  function update<K extends keyof SyncSettings>(key: K, value: SyncSettings[K]) {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev)
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.patch<SyncSettings>("/sync_settings", {
        sync_setting: {
          inbound_people_sync:         settings.inbound_people_sync,
          inbound_events_sync:         settings.inbound_events_sync,
          outbound_people_sync:        settings.outbound_people_sync,
          outbound_registrations_sync: settings.outbound_registrations_sync,
          sync_frequency_hours:        settings.sync_frequency_hours,
          conflict_resolution:         settings.conflict_resolution,
          auto_sync_enabled:           settings.auto_sync_enabled,
          pco_kids_ministry_tag:       settings.pco_kids_ministry_tag || null,
        }
      })
      setSettings(updated)
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
      const res = await api.post<{ enqueued: string[] }>("/sync/trigger", {})
      setSyncResult(`Queued: ${res.enqueued.join(", ")}`)
    } finally {
      setSyncing(false)
    }
  }

  if (!settings) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  )

  const nextSync = settings.auto_sync_enabled && settings.last_synced_at
    ? new Date(new Date(settings.last_synced_at).getTime() + settings.sync_frequency_hours * 3600000)
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

        {/* Import settings */}
        <Section title="Import settings">
          <div className="mb-5">
            <label className="text-sm font-semibold">Kids ministry tag</label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Only import PCO families tagged with this name. Leave blank to import everyone.
              Create the tag in PCO → People → More → Tags.
            </p>
            <input
              type="text"
              value={settings.pco_kids_ministry_tag ?? ""}
              onChange={e => update("pco_kids_ministry_tag", e.target.value || null)}
              placeholder="kidspire"
              className="h-11 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mb-5">
            <label className="text-sm font-semibold">Conflict resolution</label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              When a family exists in both kidspire and PCO with different data, which wins?
            </p>
            <select
              value={settings.conflict_resolution}
              onChange={e => update("conflict_resolution", e.target.value)}
              className="h-11 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="pco_wins">PCO always wins</option>
              <option value="kidspire_wins">kidspire always wins</option>
              <option value="newest_wins">Most recently updated wins</option>
            </select>
          </div>

          <Toggle
            label="Import families from PCO"
            desc="Sync people and households into kidspire families"
            checked={settings.inbound_people_sync}
            onChange={v => update("inbound_people_sync", v)}
          />
          <Toggle
            label="Import events from PCO"
            desc="Sync upcoming Calendar and Check-Ins events"
            checked={settings.inbound_events_sync}
            onChange={v => update("inbound_events_sync", v)}
          />
          <Toggle
            label="Push profile updates to PCO"
            desc="When a family edits their profile in kidspire, update PCO"
            checked={settings.outbound_people_sync}
            onChange={v => update("outbound_people_sync", v)}
          />
          <Toggle
            label="Push registrations to PCO"
            desc="Sync event registrations back to PCO Check-Ins"
            checked={settings.outbound_registrations_sync}
            onChange={v => update("outbound_registrations_sync", v)}
          />
        </Section>

        {/* Automatic sync */}
        <Section title="Automatic sync">
          <Toggle
            label="Enable automatic sync"
            desc="Runs in the background on the interval below. Requires Sidekiq worker to be running."
            checked={settings.auto_sync_enabled}
            onChange={v => update("auto_sync_enabled", v)}
          />

          <div className="mt-5">
            <label className="text-sm font-semibold">Sync frequency</label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">How often to run the automatic import.</p>
            <select
              value={settings.sync_frequency_hours}
              onChange={e => update("sync_frequency_hours", Number(e.target.value))}
              disabled={!settings.auto_sync_enabled}
              className="h-11 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value={1}>Every hour</option>
              <option value={3}>Every 3 hours</option>
              <option value={6}>Every 6 hours</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Once a day</option>
            </select>
          </div>

          {(settings.last_synced_at || nextSync) && (
            <div className="mt-4 rounded-2xl bg-secondary/60 p-4 text-sm space-y-1">
              {settings.last_synced_at && (
                <p>
                  <span className="text-muted-foreground">Last sync: </span>
                  {new Date(settings.last_synced_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              {nextSync && settings.auto_sync_enabled && (
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
            Jobs run in the background — check the admin dashboard for updated family counts.
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

          <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-800">First time importing?</p>
            <p className="text-xs text-amber-700 mt-1">
              Run this from your server or Railway shell to auto-tag all PCO households that have children:
            </p>
            <code className="mt-2 block rounded-lg bg-white px-3 py-2 text-xs text-amber-900">
              bundle exec rails pco:tag_families_with_children APPLY=true
            </code>
          </div>
        </Section>

      </div>
    </div>
  )
}
