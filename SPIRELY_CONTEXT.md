# spirely.io — Design Draft

**Status: proposed, not yet built.** This document exists in the `kidspire` repo for now because the
functionality it describes currently lives inside `kidspire` and needs to be extracted. Once
`5stones-io/spirely` exists as its own repo, this file (and the relevant sections of
`ECOSYSTEM_CONTEXT.md`) should move there.

---

## Product model (as of this draft)

- **Spirely** is the flagship 5stones.io product. It is the source of truth for:
  - **Profiles** — accounts, families, guardians, children, invitations (identity/auth, via Rodauth)
  - **Metadata** — ChMS/PCO connection credentials, sync settings, and (likely, see open question
    below) ministry tag configuration
  - Ships self-hosted (MIT gem) and cloud (hosted, multi-tenant) — self-hosted is a first-class
    product per the company mission, not a stripped demo of cloud.

- **Inspire** is not a separate codebase/framework sitting apart from Spirely — it's the *name for
  the category of ministry-specific frontend products* built on top of Spirely. Each one is a
  brochure-site/portal generator for one ministry, presenting data from the church's ChMS (in
  practice, Planning Center Online) that Spirely holds/syncs, filtered by a tag for that ministry.
  Concretely: **Spirely core + a ministry module = one Inspire product.**
  - `kidspire` = Spirely + **kidsmin** module (children's ministry)
  - `youthspire` = Spirely + **youthmin** module (youth ministry, future)
  - `seniorspire` = Spirely + **seniormin** module (senior ministry, future)

  Each module is the ministry-specific frontend/brochure layer (event listings, registration flow,
  themeable public site) over the shared PCO-synced data — filtered to that ministry's PCO tag.

- **churchcred** is a separate, standalone-capable product (points/badges/leaderboard driven by
  PCO check-ins). It is **compatible with** Spirely/Inspire when co-deployed (can read Spirely for
  shared family/child identity instead of keeping its own copy — same pattern as today's
  churchcred→kidspire relationship), but it does **not** require Spirely and is not an
  Inspire/kidsmin-style "module." Running standalone, it keeps its own lightweight person model
  (already true today per `ECOSYSTEM_CONTEXT.md`).

This replaces the earlier framing in this doc (and in the last `ECOSYSTEM_CONTEXT.md` update) that
treated churchcred and kidspire symmetrically as identical "consumers" of a narrow identity-only
spirely. Spirely is broader than an auth microservice, and churchcred sits beside the Inspire
product line rather than inside it.

---

## Resolved: ChMS/PCO tag & sync config lives in Spirely core

**Decision:** Spirely core owns the PCO OAuth connection, sync jobs, and ministry tag
configuration. Modules (kidsmin, youthmin, seniormin) are primarily **frontends to Spirely** — they
don't run their own PCO sync. Enabling a module in Inspire settings turns on additional data
objects/models within Spirely (e.g. kidsmin enables `Event`/`Registration`-shaped objects scoped to
its ministry tag) rather than the module maintaining a separate sync pipeline.

Practical implication: this is much closer to a single extensible app (Spirely core + pluggable
data objects/views per module) than to independent services that happen to share auth. Leans the
integration-pattern decision below toward **Option A (in-process)** — "enable additional data
objects when a module is on" reads naturally as schema/engine-level integration in one app, awkward
to do cleanly over a network API.

---

## What this means for the current kidspire repo

Today's `kidspire` repo is a single codebase that is really two things bundled together:

| Current kidspire piece | Becomes |
|---|---|
| `Account`, `Family`, `Child`, `Guardian`, `Invitation`, Rodauth config | **Spirely core** (profiles) |
| `ChurchIntegration` (PCO OAuth/tokens), `SyncSetting` | **Spirely core** (metadata) — pending the open question above |
| `Event`, `Registration`, theme framework, public brochure pages | **kidsmin module** (the ministry-specific frontend that, combined with Spirely, is the "kidspire" product) |

So the extraction isn't "pull identity out of kidspire" — it's closer to "kidspire splits into
Spirely (reusable core) + kidsmin (children's-ministry module)," and the *product* still called
"kidspire" is what you get when you deploy both together.

---

## Integration pattern: in-process vs. networked (still the key open decision)

### Option A — in-process mount
Spirely ships as a Rails Engine gem. A host app mounts `Spirely::Engine` plus a ministry module
(`Kidsmin::Engine`, etc.) in one Rails process, one Postgres DB. This is exactly how kidspire is
built today, just with the identity/metadata pieces factored into a reusable engine.
- **Self-hosted:** natural fit, minimal added ops burden over what exists today.
- **Cloud:** only works if the cloud product is genuinely one multi-tenant Rails app with modules
  mounted per-tenant (schema-per-tenant) — not multiple separately-deployed services.

### Option B — networked service
Spirely runs as its own deployed app (API + JWT issuer). Modules/products call it over HTTP rather
than sharing ActiveRecord models.
- Required if kidsmin-cloud/churchcred-cloud remain genuinely separate deployed apps (e.g. kidsmin
  on Next.js, churchcred-cloud on Rails+React, as currently described in `ECOSYSTEM_CONTEXT.md`).
- Not required if "kidsmin-cloud" collapses into "Spirely-cloud with the kidsmin module enabled,"
  since that's then one app, same as self-hosted Option A, just multi-tenant.

**This still needs an answer**, and it now also decides the cloud tech stack: if Spirely-cloud +
kidsmin module is meant to be one Rails multi-tenant app (Option A style), that implies kidsmin's
current Next.js stack gets replaced/absorbed rather than kept as a separate frontend calling an API.
churchcred/churchcred-cloud, being "compatible but separate," most likely stays on Option B
(its own app, calling Spirely's API for identity) regardless of what's decided for Inspire products.

---

## Cloud vs. self-hosted

| | Self-hosted | Cloud |
|---|---|---|
| License | MIT, open source | Proprietary, hosted by 5stones |
| Tenancy | One church, own DB | Multi-tenant |
| Consumed by | kidsmin/youthmin/seniormin modules mounted alongside Spirely in one host app | Same modules, mounted per-tenant in Spirely-cloud (pending Option A/B decision above) |
| churchcred | Separate gem, optionally reads Spirely for identity | Separate cloud app, optionally reads Spirely-cloud for identity |
| Mission alignment | **Required** — full self-hosted product, zero 5stones dependency | Optional convenience tier |

---

## Migration path for existing kidspire installs

Still open: **is this kidspire instance already deployed to a real church in production?** If not,
this is a clean split. If yes, need a one-time data copy of `Account`/`Family`/`Child`/`Guardian`/
`Invitation` rows into new Spirely tables before cutting the kidsmin module over to reference them.

---

## Suggested next steps

1. Resolve where PCO/ChMS sync + tag config lives (Spirely core vs. per-module)
2. Resolve in-process vs. networked integration, and in turn, the cloud tech stack
3. Decide the actual repo split: does `kidspire` become two repos (`spirely` + `kidsmin`), or does
   `kidspire` stay one repo that depends on a new `spirely` gem?
4. Confirm churchcred's relationship stays "compatible, not dependent" for both self-hosted and cloud
5. Create `github.com/5stones-io/spirely`, scaffold as a Rails Engine gem
6. Extract `Account`, `Family`, `Child`, `Guardian`, `Invitation`, Rodauth machinery (and PCO/sync,
   pending open question) out of this repo into spirely
