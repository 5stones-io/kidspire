import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { api } from "@/lib/api"

interface Child    { id: number; first_name: string; last_name: string; grade_display: string; age: number | null; notes: string | null }
interface Guardian { id: number; first_name: string; last_name: string | null; phone: string | null; email: string | null; relationship: string | null }

interface FamilyDetail {
  id: number
  family_name: string | null
  primary_contact_first_name: string | null
  primary_contact_last_name:  string | null
  email:              string | null
  phone:              string | null
  address:            string | null
  account_linked:     boolean
  pco_person_id:      string | null
  pco_household_id:   string | null
  pco_last_synced_at: string | null
  created_at:         string
  children:           Child[]
  guardians:          Guardian[]
  invite_url:         string | null
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  )
}

export default function FamilyDetail() {
  const { id }    = useParams<{ id: string }>()
  const [family, setFamily]     = useState<FamilyDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [resending, setResending] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    api.get<FamilyDetail>(`/admin/families/${id}`)
      .then(setFamily)
      .finally(() => setLoading(false))
  }, [id])

  async function resendInvite() {
    setResending(true)
    try {
      const res = await api.post<{ invite_url: string }>(`/admin/families/${id}/invite`, {})
      setInviteUrl(res.invite_url)
      setFamily(prev => prev ? { ...prev, invite_url: res.invite_url } : prev)
    } finally {
      setResending(false)
    }
  }

  function copyInvite(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  )

  if (!family) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-destructive">Family not found.</p>
    </div>
  )

  const contactName = [family.primary_contact_first_name, family.primary_contact_last_name]
    .filter(Boolean).join(" ")

  const activeInvite = inviteUrl ?? family.invite_url

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 md:px-6">
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Admin</Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">{family.family_name || `${contactName} Family`}</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 space-y-6">

        {/* Status banner */}
        {!family.account_linked && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-amber-800">Invitation not yet accepted</p>
              <p className="text-sm text-amber-700 mt-0.5">
                {activeInvite
                  ? "Share the invite link below with the family."
                  : "Generate an invite link to send to the family."}
              </p>
            </div>
            <button
              onClick={resendInvite}
              disabled={resending}
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {resending ? "Generating…" : "Generate new invite"}
            </button>
          </div>
        )}

        {activeInvite && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary mb-2">Invite link — copy and send to the family:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-background px-3 py-2 text-xs break-all">{activeInvite}</code>
              <button
                onClick={() => copyInvite(activeInvite)}
                className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Family info */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold">Family information</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              family.account_linked
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {family.account_linked ? "● Active" : "● Pending"}
            </span>
          </div>
          <Row label="Family name"    value={family.family_name} />
          <Row label="Primary contact" value={contactName || null} />
          <Row label="Email"          value={family.email} />
          <Row label="Phone"          value={family.phone} />
          <Row label="Address"        value={family.address} />
          <Row label="Added"          value={new Date(family.created_at).toLocaleDateString("en-US", { dateStyle: "long" })} />
        </div>

        {/* Children */}
        <div className="rounded-3xl bg-card p-7 shadow-playful">
          <h2 className="font-display text-xl font-bold mb-5">
            Children <span className="text-muted-foreground font-normal text-base">({family.children.length})</span>
          </h2>
          {family.children.length === 0 ? (
            <p className="text-sm text-muted-foreground">No children on record.</p>
          ) : (
            <div className="space-y-3">
              {family.children.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div>
                    <p className="font-semibold">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[c.grade_display && `Grade ${c.grade_display}`, c.age != null && `Age ${c.age}`].filter(Boolean).join(" · ")}
                      {c.notes && ` · ${c.notes}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional guardians */}
        {family.guardians.length > 0 && (
          <div className="rounded-3xl bg-card p-7 shadow-playful">
            <h2 className="font-display text-xl font-bold mb-5">Additional guardians</h2>
            <div className="space-y-3">
              {family.guardians.map(g => (
                <div key={g.id} className="rounded-2xl border border-border p-4">
                  <p className="font-semibold">{g.first_name} {g.last_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[g.relationship, g.phone, g.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PCO sync */}
        {(family.pco_person_id || family.pco_household_id) && (
          <div className="rounded-3xl bg-card p-7 shadow-playful">
            <h2 className="font-display text-xl font-bold mb-5">Planning Center</h2>
            <Row label="Person ID"    value={family.pco_person_id} />
            <Row label="Household ID" value={family.pco_household_id} />
            <Row label="Last synced"  value={family.pco_last_synced_at
              ? new Date(family.pco_last_synced_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
              : "Never"} />
          </div>
        )}
      </div>
    </div>
  )
}
