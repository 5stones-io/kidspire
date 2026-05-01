# kidspire / churchcred Ecosystem — Shared Context

This document describes the full ecosystem of kidspire and churchcred repos. It lives in every repo in the family as `ECOSYSTEM_CONTEXT.md` and is read alongside each repo's own `CLAUDE_CODE_CONTEXT.md`.

When working in any repo in this family, read this file first, then the repo-specific `CLAUDE_CODE_CONTEXT.md`.

---

## The Four Repos

| Repo | Type | Auth | PCO | Deploy |
|---|---|---|---|---|
| `churchcred` | Rails Engine gem · MIT · standalone | Own (Supabase Auth) | Own PCO app per church | Railway |
| `kidspire` | Rails Engine gem · MIT · standalone | Supabase Auth | Own PCO app per church | Railway |
| `kidsmin-cloud` | SaaS platform · Next.js | Clerk | Platform PCO OAuth app | Vercel + Railway |
| `churchcred-cloud` | SaaS app · Rails + React | Clerk (via kidsmin-cloud JWT) | Platform PCO OAuth app | Railway |

### Standalone vs cloud

The standalone gems (`churchcred`, `kidspire`) are fully self-contained. A church can deploy either gem independently with zero dependency on the platform or each other. They are MIT licensed and Railway-deployable via template.

The cloud apps (`kidsmin-cloud`, `churchcred-cloud`) are the hosted SaaS layer. They use the gem logic as their core and add Clerk SSO, multi-tenancy, and platform-level PCO OAuth on top.

**Never add cloud dependencies (Clerk, kidsmin-cloud, multi-tenancy) to the standalone gems.**

---

## Shared Tech Decisions

These decisions apply across all four repos unless a repo-specific doc explicitly overrides them.

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

All four repos should feel like they came from the same family visually. A parent using kidspire on Sunday and churchcred on Wednesday should see the same design language.

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

### Standalone gems (Supabase Auth)
- Supabase Auth issues JWTs
- Rails API validates JWT on every request using Supabase JWT secret
- Frontend uses Supabase JS client for session management
- Login methods: email magic link, Google OAuth, Apple OAuth

### Cloud apps (Clerk)
- Clerk issues JWTs
- `org_id` in JWT = church tenant identifier
- Next.js middleware validates Clerk session on every request
- churchcred-cloud accepts Clerk JWTs from kidsmin-cloud
- Service-to-service calls use a shared API key + Clerk JWT

---

## Repo Relationships Diagram

```
churchcred (gem)
  └── standalone: own auth, own PCO, own DB
  └── mountable alongside kidspire in host app
  └── core logic reused by churchcred-cloud

kidspire (gem)
  └── standalone: Supabase Auth, own PCO, own DB
  └── mountable alongside churchcred in host app
  └── core logic reused by kidsmin-cloud
  └── theme framework: view overrides + CSS variables

kidsmin-cloud (platform)
  └── requires kidspire gem
  └── Clerk SSO (replaces Supabase Auth)
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

| Concern | Lives in |
|---|---|
| Family profile, children records | kidspire |
| Event listings, registrations | kidspire |
| PCO people + calendar sync | kidspire |
| Theme / view override system | kidspire |
| Points, badges, leaderboard | churchcred |
| PCO check-in sync → points | churchcred |
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

All repos live under: `github.com/chadjsdev`

- `github.com/chadjsdev/churchcred` — standalone gem ✓ (exists)
- `github.com/chadjsdev/kidspire` — standalone gem (building)
- `github.com/chadjsdev/kidsmin-cloud` — SaaS platform (building)
- `github.com/chadjsdev/churchcred-cloud` — SaaS app (future)

---

*Ecosystem context — kidspire / churchcred family*
*Jubilee Christian Center · Fairfax, Virginia*
*Last updated: April 2026*
