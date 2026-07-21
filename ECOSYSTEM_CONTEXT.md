# kidspire / churchcred Ecosystem — Shared Context

This document describes the full ecosystem of kidspire and churchcred repos. It lives in every repo in the family as `ECOSYSTEM_CONTEXT.md` and is read alongside each repo's own `CLAUDE_CODE_CONTEXT.md`.

When working in any repo in this family, read this file first, then the repo-specific `CLAUDE_CODE_CONTEXT.md`.

---

## The Repos

> **Product model is being redesigned — see `SPIRELY_CONTEXT.md` for the full draft.** Summary:
> **Spirely** is becoming the flagship 5stones.io product — source of truth for profiles
> (accounts, families, guardians, children, invitations) and metadata (ChMS/PCO config). **Inspire**
> is not a separate codebase but the name for the category of ministry-specific frontend/brochure
> products built as **Spirely core + a ministry module** — `kidspire` = Spirely + kidsmin module,
> with `youthspire`/`seniorspire` (youthmin/seniormin modules) planned. **churchcred** is a
> separate, standalone-capable product, *compatible with* Spirely (can read it for shared identity
> when co-deployed) but not dependent on it and not an Inspire "module."
> **None of this has been built yet** — as of this writing, the `kidspire` repo still owns
> `Account`/`Family`/`Child`/`Guardian`/`Invitation`, its own Rodauth config, and its own PCO sync
> directly; nothing has been extracted into a separate Spirely repo. Table below reflects
> *current* reality, not the target state.

| Repo | Type | Auth | PCO | Deploy |
|---|---|---|---|---|
| `kidspire` | Rails Engine gem · MIT · standalone (current: bundles identity + kids-ministry frontend, pre-split) | Own Rodauth (target: delegates to spirely core) | Own PCO app per church | Railway |
| `churchcred` | Rails Engine gem · MIT · standalone | Own (was: Supabase Auth — confirm current state before relying on this) | Own PCO app per church | Railway |
| `spirely` | Rails Engine gem (proposed, not yet created) · MIT · flagship profile/metadata product | Rodauth (owns it) | Owns ChMS/PCO config, pending open question in `SPIRELY_CONTEXT.md` | Railway |
| `kidsmin-cloud` | SaaS platform · Next.js (current stack — likely absorbed into Spirely-cloud, see `SPIRELY_CONTEXT.md`) | Clerk | Platform PCO OAuth app | Vercel + Railway |
| `churchcred-cloud` | SaaS app · Rails + React | Clerk (via kidsmin-cloud JWT) | Platform PCO OAuth app | Railway |

### Standalone vs cloud

The standalone gems are fully self-contained. A church can deploy them independently with zero dependency on the platform. They are MIT licensed and Railway-deployable via template. Per the company mission, the self-hosted line — including self-hosted Spirely — must remain a fully complete product on its own, not a stripped-down version of the cloud offering.

The cloud apps are the hosted SaaS layer. Whether "kidsmin-cloud" survives as a distinct app or collapses into "Spirely-cloud with the kidsmin module enabled" is an open decision — see `SPIRELY_CONTEXT.md`. churchcred-cloud is expected to stay separate either way, mirroring churchcred's standalone "compatible, not dependent" relationship to Spirely.

**Never add cloud dependencies (Clerk, kidsmin-cloud, multi-tenancy) to the standalone gems.**

---

## Shared Tech Decisions

These decisions apply across all repos in the family unless a repo-specific doc explicitly overrides them.

### Backend
- Ruby on Rails (latest stable — check `.ruby-version` in `churchcred` for the current version)
- Rails Engine pattern for gems — mountable, namespaced
- Sidekiq + Redis for background jobs
- PostgreSQL via Supabase (standalone) or Railway Postgres plugin
- AES-256-GCM encryption via a shared `Encryption` module for all stored OAuth tokens

### Frontend (all repos)
- React + TypeScript
- Tailwind CSS
- shadcn/ui component library
- Vite (standalone gems) / Next.js 14 App Router (cloud apps)
- `bun` as package manager

### Design system
- Primary color: deep violet (`#5B21B6` range)
- Accent: warm amber/yellow for CTAs and highlights
- Rounded corners: `rounded-2xl` or higher everywhere
- Typography: friendly, readable, not corporate
- Tone: warm, faith-forward, built for families — not enterprise SaaS

All repos should feel like they came from the same family visually. A parent using kidspire on Sunday and churchcred on Wednesday should see the same design language.

### API conventions
- JSON API, versioned under `/api/v1/`
- Consistent error shape across all repos: `{ error: String, code: String }`
- Try/catch with meaningful logging on every controller action
- Zod (frontend) / dry-validation or strong params (Rails) for input validation

### PCO integration pattern (standalone gems)
- Church admin creates their own PCO OAuth app at `api.planningcenteronline.com`
- Credentials entered via admin UI — never as environment variables
- Stored encrypted per-organization in `church_integrations` (or equivalent) table
- `PcoClient` class handles authenticated requests + silent token refresh
- Background sync jobs run via Sidekiq
- `DEBUG_PCO_SYNC=true` env var enables verbose logging

### PCO integration pattern (cloud apps)
- One PCO OAuth app registered under `kidsmin-cloud` for the entire platform
- Church admin authorizes via platform's `/api/integrations/pco/connect` flow
- Tokens stored encrypted per-tenant in `church_integrations`
- kidsmin-cloud is the PCO intermediary — churchcred-cloud reads synced data from kidsmin-cloud, never talks to PCO directly

### Deployment pattern (standalone gems)
```
Procfile:
  web:    bundle exec puma -C config/puma.rb
  worker: bundle exec sidekiq

railway.toml:
  build:  bundle install && npm install && npm run build && bundle exec rails assets:precompile
  start:  bundle exec puma -C config/puma.rb
  health: /up
```
Worker deployed as separate Railway service, same repo, start command overridden to `bundle exec sidekiq`.

---

## Data Model Conventions

### Naming
- Gem tables are namespaced: `kidspire_families`, `kidspire_children`, `churchcred_points`, etc.
- Cloud schema tables are not namespaced (they live in tenant-isolated schemas)

### Cross-gem relationships (when both gems mounted together)
When `kidspire` and `churchcred` are mounted in the same host app, churchcred reads kidspire tables to resolve family/child identity:

```ruby
# In host app (not inside either gem)
# churchcred looks up children via kidspire
module Churchcred
  class Point < ApplicationRecord
    belongs_to :child, class_name: 'Kidspire::Child',
                       foreign_key: 'kidspire_child_id'
  end
end
```

Neither gem should `require` or `depend_on` the other — the relationship is defined in the host app only.

### Mounting both gems together
```ruby
# config/routes.rb in host app
mount Kidspire::Engine   => '/'
mount Churchcred::Engine => '/churchcred'
```

---

## PCO Data Model (shared understanding)

PCO resources used across the ecosystem:

| PCO Resource | kidspire use | churchcred use |
|---|---|---|
| `People::Person` | Family/child profiles | Resolve check-in to child |
| `People::Household` | Family grouping | — |
| `CheckIns::Event` | Events listing (optional) | Award points per event |
| `CheckIns::EventTime` | Event occurrence | Check-in source |
| `CheckIns::Attendance` | Registration/headcount | — |
| `CheckIns::CheckIn` | — | Points trigger |
| `Calendar::Event` | Events CMS (optional pull) | — |
| `Services::ServiceType` | — | Future: volunteer points |

---

## kidspire — Key Concepts

### kidspire owns its own database
PCO is a sync source and sync target, not the primary system of record. kidspire's Postgres tables are authoritative. PCO sync is bidirectional and optional per church:

- **Inbound sync:** Pull families, children, events from PCO → kidspire tables
- **Outbound sync:** Push profile updates and event registrations from kidspire → PCO (optional, per church setting)

### Sync settings (per church)
```ruby
# kidspire_sync_settings table
inbound_people_sync:  boolean  # pull PCO people → kidspire profiles
outbound_people_sync: boolean  # push kidspire profile changes → PCO
inbound_events_sync:  boolean  # pull PCO calendar events → kidspire events
outbound_registrations_sync: boolean  # push kidspire registrations → PCO
sync_frequency_hours: integer  # default 6
last_synced_at:       datetime
```

### Templating system (theme layer)
kidspire provides a **theme framework** — churches supply their own look, kidspire provides the functionality. This works via Rails Engine view overrides + a component library.

**How it works:**
1. kidspire ships default views in `app/views/kidspire/`
2. A church's theme (a separate gem or local app) overrides views by placing files at the same paths in the host app's `app/views/kidspire/`
3. Rails automatically prefers host app views over engine views
4. kidspire ships a set of **theme variables** (Tailwind CSS custom properties) that themes set to control color, typography, and spacing
5. kidspire's React components accept a `theme` prop that maps to these variables

**Theme contract — what a theme must provide:**
```css
/* Required CSS custom properties */
--kidspire-color-primary:     /* main brand color */
--kidspire-color-accent:      /* CTA / highlight color */
--kidspire-color-background:  /* page background */
--kidspire-color-text:        /* body text */
--kidspire-font-heading:      /* heading font family */
--kidspire-font-body:         /* body font family */
--kidspire-radius:            /* border radius base */
```

**Theme contract — what a theme can override:**
- Any view in `app/views/kidspire/` (layout, pages, partials)
- Any component in `app/javascript/src/components/` via host app src
- The main layout (`kidspire/layouts/application.html.erb`)

**What a theme cannot change:**
- Routes
- Controllers
- Models
- Business logic
- API endpoints

**Default theme:**
kidspire ships a default theme matching the ecosystem design system (violet + amber, rounded, warm). churchcred's default theme matches identically so they look native when mounted together.

---

## churchcred — Key Concepts

### churchcred is the points/rewards layer
It does not manage family identity or event registration — kidspire does that. churchcred's job is:
- Award points to children based on check-in events from PCO
- Track point history
- Define and award badges based on point thresholds
- Optionally show a leaderboard

### churchcred reads kidspire for identity (when co-mounted)
When both gems are mounted, churchcred reads `kidspire_families` and `kidspire_children` for identity. When running standalone, churchcred has its own lightweight person model.

### Points sources
```
check_in  → awarded automatically via PCO sync
manual    → church admin awards directly
event     → awarded for specific event participation
bonus     → one-off admin award
```

---

## Auth Patterns

### Standalone gems (spirely — target state)
- spirely issues JWTs via Rodauth (passwordless email magic link)
- Inspire modules (kidsmin, etc.) validate the JWT and read profile data from spirely core — they're
  the same app/deploy as spirely, not a separate consumer (see `SPIRELY_CONTEXT.md`)
- churchcred, being separate/compatible rather than a module, would validate spirely's JWT and call
  its API like an external consumer if integration is enabled — it does not require spirely to run
- See `SPIRELY_CONTEXT.md` for the in-process vs. networked integration decision (still open)
- **Current state:** kidspire has not yet been split — it still runs its own Rodauth instance
  directly (`app/misc/rodauth_main.rb`, `Account`/`Family`/`Child` models) rather than delegating
  to spirely. Treat any mention of Supabase Auth in older docs as stale; it was replaced by Rodauth
  before spirely was proposed.

### Cloud apps (Clerk)
- Clerk issues JWTs
- `org_id` in JWT = church tenant identifier
- Next.js middleware validates Clerk session on every request
- churchcred-cloud accepts Clerk JWTs from kidsmin-cloud
- Service-to-service calls use a shared API key + Clerk JWT

---

## Repo Relationships Diagram

**Target state (proposed, not built — see `SPIRELY_CONTEXT.md`):**

```
spirely (flagship product, proposed repo)
  └── core: owns accounts, families, children, guardians, invitations (profiles)
  └── core: owns ChMS/PCO connection + sync config (metadata) — pending open question
  └── Rodauth-issued JWTs
  └── self-hosted (MIT gem) + cloud (Spirely-cloud, multi-tenant)

Inspire products = spirely core + a ministry module, e.g.:
  kidspire   = spirely + kidsmin module   (children's ministry frontend/brochure site)
  youthspire = spirely + youthmin module  (future)
  seniorspire = spirely + seniormin module (future)
  └── module = ministry-specific frontend: event listings, registration, themeable public site
  └── module filters spirely's synced ChMS data by that ministry's PCO tag
  └── "kidsmin-cloud" as previously conceived may just be Spirely-cloud w/ kidsmin module enabled

churchcred (separate product — compatible with, not dependent on, spirely/Inspire)
  └── standalone: own DB, own identity fallback (lightweight person model)
  └── when co-deployed with spirely: can read spirely for shared family/child identity instead
  └── churchcred-cloud: same relationship, cloud-side — expected to stay a separate deployed app
```

**Current state (what's actually in the repos today):**

```
kidspire (gem) — not yet split into spirely + kidsmin
  └── owns Rodauth/Account/Family/Child/Guardian/Invitation directly
  └── owns PCO sync (ChurchIntegration, SyncSetting) directly
  └── theme framework: view overrides + CSS variables
  └── core logic reused by kidsmin-cloud

churchcred (gem)
  └── standalone: own auth, own PCO, own DB
  └── mountable alongside kidspire in host app (reads kidspire tables for identity when co-mounted)
  └── core logic reused by churchcred-cloud

kidsmin-cloud (platform)
  └── requires kidspire gem
  └── Clerk SSO
  └── multi-tenant: schema-per-tenant Postgres
  └── PCO OAuth intermediary for all platform apps
  └── pilot tenant: account.jcc.kids

churchcred-cloud
  └── requires churchcred gem
  └── auth: Clerk JWT from kidsmin-cloud
  └── PCO: reads tokens via kidsmin-cloud
  └── data: owned in churchcred-cloud DB, readable by kidsmin-cloud via API
```

---

## What Lives Where

Target state (not yet built):

| Concern | Lives in |
|---|---|
| Accounts, auth (Rodauth/JWT) | spirely core |
| Family/guardian/child profile records, invitations | spirely core |
| ChMS/PCO connection + sync config ("metadata") | spirely core — pending open question in `SPIRELY_CONTEXT.md` |
| Ministry-specific event listings, registrations, brochure/theme site | Inspire module (e.g. kidsmin) |
| Points, badges, leaderboard | churchcred (separate, compatible) |
| PCO check-in sync → points | churchcred |

Current state (kidspire not yet split):

| Concern | Lives in |
|---|---|
| Accounts, auth, family/child/guardian/invitation records | kidspire (directly) |
| Event listings, registrations, PCO sync, theme framework | kidspire (directly) |
| Points, badges, leaderboard, PCO check-in sync | churchcred |
| Platform SSO (Clerk) | kidsmin-cloud |
| Platform PCO OAuth app | kidsmin-cloud |
| Multi-tenancy (schema isolation) | kidsmin-cloud |
| Church provisioning worker | kidsmin-cloud |
| Hosted points (cloud) | churchcred-cloud |

---

## Shared Conventions for Claude Code

When working in any repo in this family:

1. **Read this file first**, then the repo-specific `CLAUDE_CODE_CONTEXT.md`
2. **Mirror churchcred patterns** for anything not explicitly specified — naming, structure, deployment config, PCO client pattern
3. **Never couple standalone gems to cloud apps** — no Clerk imports, no kidsmin-cloud references inside `kidspire` or `churchcred`
4. **Namespace everything in gems** — models, controllers, jobs, helpers all under `Kidspire::` or `Churchcred::`
5. **Design system consistency** — all UIs use the same violet/amber/rounded design language
6. **Error shape is universal** — `{ error: String, code: String }` everywhere
7. **PCO tokens always encrypted** — never stored plaintext, use the shared `Encryption` module pattern
8. **Ask before modifying** — if a change in one repo affects the API contract with another repo, flag it before implementing

---

## GitHub Org

Repos live under `github.com/chadjsdev` and `github.com/5stones-io` (kidspire has moved to the
`5stones-io` org — homepage `5stones.io/kidspire`; confirm current org per-repo before assuming).

- `github.com/5stones-io/kidspire` — standalone gem ✓ (exists)
- `github.com/chadjsdev/churchcred` — standalone gem ✓ (exists)
- `github.com/5stones-io/spirely` — standalone identity gem (proposed, not yet created)
- `github.com/chadjsdev/kidsmin-cloud` — SaaS platform (building)
- `github.com/chadjsdev/churchcred-cloud` — SaaS app (future)

---

*Ecosystem context — kidspire / churchcred family*
*Jubilee Christian Center · Fairfax, Virginia*
*Last updated: April 2026*
