# kidspire gem — Claude Code Context Handoff

Read `ECOSYSTEM_CONTEXT.md` first, then this file. This doc covers what is unique to the `kidspire` gem repo.

---

## What This Repo Is

The `kidspire` standalone Rails Engine gem. Self-hostable, MIT licensed, Railway-deployable. Provides:

- Family profile management (parents, children, contact info)
- Children records (name, birthdate, grade, allergy/notes)
- Event listings and per-child registration
- Bidirectional Planning Center sync (people, children, events, registrations)
- Per-church sync settings (inbound/outbound, frequency)
- Supabase Auth (magic link, Google, Apple)
- **Theme framework** — view override system + CSS variable contract so churches can style kidspire with their own brand

**Zero dependency on kidsmin-cloud, Clerk, or any hosted platform. Never add those dependencies here.**

---

## Reference Implementation: churchcred

Before writing any code, fetch and read the churchcred repo at `https://github.com/chadjsdev/churchcred`. kidspire mirrors churchcred's structure exactly:

- Same Rails + React/Vite + TypeScript + Tailwind + shadcn/ui stack
- Same Railway deployment pattern (Procfile + railway.toml)
- Same PCO OAuth pattern (credentials in DB, connect/callback flow, PcoClient class)
- Same Supabase Auth JWT validation pattern
- Same gemspec structure
- Same error response shape: `{ error: String, code: String }`

When in doubt about any pattern not covered here, look at how churchcred does it.

---

## Repo Structure

```
kidspire/
├── app/
│   ├── controllers/kidspire/
│   │   ├── application_controller.rb   # Supabase JWT validation
│   │   ├── families_controller.rb
│   │   ├── children_controller.rb
│   │   ├── events_controller.rb
│   │   ├── registrations_controller.rb
│   │   ├── sync_settings_controller.rb # per-church sync config
│   │   └── auth/
│   │       ├── pco_controller.rb       # /auth/pco/connect + /auth/pco/callback
│   │       └── supabase_controller.rb
│   ├── models/kidspire/
│   │   ├── family.rb
│   │   ├── child.rb
│   │   ├── event.rb
│   │   ├── registration.rb
│   │   ├── church_integration.rb
│   │   └── sync_setting.rb
│   ├── jobs/kidspire/
│   │   ├── pco_inbound_people_sync_job.rb
│   │   ├── pco_inbound_events_sync_job.rb
│   │   ├── pco_outbound_profile_sync_job.rb
│   │   └── pco_outbound_registration_sync_job.rb
│   └── javascript/                     # React/Vite frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/                 # shadcn/ui base components
│       │   │   └── kidspire/           # domain components (FamilyCard, ChildCard, EventCard...)
│       │   ├── pages/
│       │   │   ├── public/             # Home, Events, About
│       │   │   └── portal/             # Dashboard, Profile, Children
│       │   ├── hooks/
│       │   ├── lib/
│       │   │   ├── supabase.ts         # Supabase Auth client
│       │   │   └── api.ts              # API client
│       │   └── theme/
│       │       ├── default.css         # default theme CSS variables
│       │       └── tokens.ts           # typed theme token exports
│       ├── index.html
│       └── vite.config.ts
├── app/views/kidspire/                 # default Rails views (overridable by host)
│   ├── layouts/
│   │   └── application.html.erb       # main layout — loads Vite assets
│   └── application/
│       └── index.html.erb             # catch-all → serves React app
├── config/
│   └── routes.rb
├── db/
│   └── migrate/
├── lib/
│   ├── kidspire.rb
│   └── kidspire/
│       ├── engine.rb
│       ├── configuration.rb
│       ├── pco_client.rb
│       ├── encryption.rb
│       └── version.rb
├── test/
├── .env
├── .ruby-version
├── Dockerfile
├── Gemfile
├── Procfile
├── README.md
├── kidspire.gemspec
├── package.json
├── railway.toml
├── tailwind.config.ts
├── CLAUDE_CODE_CONTEXT.md             # this file
└── ECOSYSTEM_CONTEXT.md              # shared family context
```

---

## Database Schema

```ruby
# Core tables

create_table :kidspire_families do |t|
  t.string   :supabase_uid,            null: false, index: { unique: true }
  t.string   :family_name
  t.string   :primary_contact_name
  t.string   :email
  t.string   :phone
  t.string   :pco_person_id            # PCO People ID for sync matching
  t.string   :pco_household_id         # PCO Household ID
  t.datetime :pco_last_synced_at
  t.timestamps
end

create_table :kidspire_children do |t|
  t.references :family, null: false, foreign_key: { to_table: :kidspire_families }
  t.string   :first_name
  t.string   :last_name
  t.date     :birthdate
  t.string   :grade
  t.text     :notes                    # allergies, special needs
  t.string   :pco_person_id           # PCO People ID for sync matching
  t.datetime :pco_last_synced_at
  t.timestamps
end

create_table :kidspire_events do |t|
  t.string   :title
  t.text     :description
  t.datetime :event_date
  t.integer  :age_min
  t.integer  :age_max
  t.integer  :capacity
  t.string   :pco_event_id            # PCO Calendar or CheckIns event ID
  t.string   :pco_source              # "calendar" | "check_ins"
  t.datetime :pco_last_synced_at
  t.timestamps
end

create_table :kidspire_registrations do |t|
  t.references :family,  null: false, foreign_key: { to_table: :kidspire_families }
  t.references :event,   null: false, foreign_key: { to_table: :kidspire_events }
  t.references :child,   null: false, foreign_key: { to_table: :kidspire_children }
  t.boolean    :synced_to_pco,        default: false
  t.datetime   :pco_synced_at
  t.timestamps
end

create_table :kidspire_church_integrations do |t|
  t.string   :token_type,             null: false  # "personal" | "oauth"
  t.text     :access_token                         # AES-256-GCM encrypted
  t.text     :refresh_token                        # AES-256-GCM encrypted
  t.string   :scope
  t.datetime :expires_at
  t.timestamps
end

# Per-church sync settings
create_table :kidspire_sync_settings do |t|
  t.boolean  :inbound_people_sync,           default: true
  t.boolean  :outbound_people_sync,          default: false
  t.boolean  :inbound_events_sync,           default: true
  t.boolean  :outbound_registrations_sync,   default: false
  t.integer  :sync_frequency_hours,          default: 6
  t.datetime :last_synced_at
  t.timestamps
end
```

---

## Bidirectional PCO Sync

kidspire owns its Postgres tables as the source of truth. PCO is a sync source and sync target — not authoritative. Sync direction is controlled per church via `kidspire_sync_settings`.

### Inbound (PCO → kidspire)

**People sync** (`PcoInboundPeopleSyncJob`):
1. Pull `People::Person` records from PCO
2. Match to `kidspire_families` by `pco_person_id` or email
3. Create or update family + children records
4. Store `pco_person_id` for future sync matching
5. Update `pco_last_synced_at`

**Events sync** (`PcoInboundEventsSyncJob`):
1. Pull `Calendar::Event` and/or `CheckIns::Event` from PCO
2. Filter to children/kids ministry events (configurable tag or ministry filter)
3. Create or update `kidspire_events` records
4. Store `pco_event_id` and `pco_source`

### Outbound (kidspire → PCO)

**Profile sync** (`PcoOutboundProfileSyncJob`):
- Triggered when a family updates their profile (after_commit callback, async)
- Only runs if `outbound_people_sync: true`
- If `pco_person_id` exists: PATCH the PCO person record
- If no `pco_person_id`: optionally create a new PCO person (configurable)

**Registration sync** (`PcoOutboundRegistrationSyncJob`):
- Triggered when a registration is created
- Only runs if `outbound_registrations_sync: true`
- Creates a PCO `Registrations::Attendee` or `CheckIns::CheckIn` record
- Marks registration with `synced_to_pco: true` and `pco_synced_at`

### Sync conflict resolution
- **Inbound wins by default** — if both sides changed since last sync, PCO data takes precedence
- `pco_last_synced_at` timestamp used to detect stale local records
- Conflict resolution strategy is configurable: `pco_wins` | `kidspire_wins` | `newest_wins`

---

## Theme Framework

kidspire provides a theme layer so churches can brand the portal without forking the gem.

### How it works

Rails Engine view override: any file placed in the host app at the same path as a kidspire engine view automatically takes precedence.

```
host_app/
└── app/
    └── views/
        └── kidspire/          ← overrides engine views
            └── layouts/
                └── application.html.erb   ← custom layout
```

### CSS variable contract

kidspire reads these CSS custom properties. A theme sets them in its own stylesheet:

```css
:root {
  /* Required — kidspire reads these */
  --kidspire-color-primary:      #5B21B6;   /* violet default */
  --kidspire-color-primary-fg:   #ffffff;
  --kidspire-color-accent:       #D97706;   /* amber default */
  --kidspire-color-accent-fg:    #ffffff;
  --kidspire-color-background:   #ffffff;
  --kidspire-color-surface:      #F9FAFB;
  --kidspire-color-text:         #111827;
  --kidspire-color-text-muted:   #6B7280;
  --kidspire-color-border:       #E5E7EB;
  --kidspire-font-heading:       'Inter', sans-serif;
  --kidspire-font-body:          'Inter', sans-serif;
  --kidspire-radius:             1rem;       /* base border radius */
  --kidspire-radius-sm:          0.5rem;
}
```

### Theme gem pattern

A church theme is a small gem or local directory:

```
my-church-theme/
├── app/
│   └── views/
│       └── kidspire/
│           └── layouts/
│               └── application.html.erb  # custom layout
├── app/
│   └── assets/
│       └── stylesheets/
│           └── my_church_theme.css       # sets CSS variables
└── my_church_theme.gemspec
```

```ruby
# Host app Gemfile
gem 'kidspire'
gem 'my_church_theme', path: './themes/my_church_theme'
```

### React component theming

kidspire's React components read the CSS variables above via Tailwind's `var()` utility. Components accept an optional `className` prop for additional host app styling. They do not accept a `theme` object prop — CSS variables are the contract.

### Default theme

kidspire ships a default theme matching the ecosystem design system:
- Primary: `#5B21B6` (violet)
- Accent: `#D97706` (amber)
- Radius: `rounded-2xl`
- Fonts: Inter

churchcred's default theme is identical so they look native when mounted together.

---

## API Routes

```ruby
Kidspire::Engine.routes.draw do
  namespace :api do
    namespace :v1 do
      resource  :family,        only: [:show, :update]
      resources :children,      only: [:index, :create, :update, :destroy]
      resources :events,        only: [:index, :show]
      resources :registrations, only: [:create, :destroy]
      resource  :sync_settings, only: [:show, :update]
      post '/sync/trigger', to: 'sync#trigger'   # manual sync trigger
    end
  end

  namespace :auth do
    namespace :pco do
      get :connect
      get :callback
      get :login_callback
    end
    get '/callback', to: 'supabase#callback'
  end

  get '*path', to: 'application#frontend',
    constraints: ->(req) { !req.xhr? && req.format.html? }
end
```

---

## Configuration

```ruby
Kidspire.configure do |config|
  config.supabase_url               = ENV['SUPABASE_URL']
  config.supabase_anon_key          = ENV['SUPABASE_ANON_KEY']
  config.supabase_service_role_key  = ENV['SUPABASE_SERVICE_ROLE_KEY']
  config.pco_client_id              = ENV['PCO_CLIENT_ID']
  config.pco_client_secret          = ENV['PCO_CLIENT_SECRET']
  config.pco_redirect_uri           = ENV['PCO_REDIRECT_URI']
  config.encryption_key             = ENV['ENCRYPTION_KEY']
  config.frontend_base_url          = ENV['FRONTEND_BASE_URL']

  # PCO event filter — which PCO ministry tag/department to pull events from
  # Defaults to nil (pull all events)
  config.pco_kids_ministry_tag      = ENV['PCO_KIDS_MINISTRY_TAG']
end
```

---

## Environment Variables

```bash
DATABASE_URL=                    # auto-set by Railway Postgres plugin
REDIS_URL=                       # auto-set by Railway Redis plugin
RAILS_MASTER_KEY=                # contents of config/master.key
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_KEY=                  # openssl rand -hex 32
VITE_API_BASE_URL=               # e.g. https://your-app.up.railway.app/api/v1
PCO_CLIENT_ID=
PCO_CLIENT_SECRET=
PCO_REDIRECT_URI=                # https://your-app.up.railway.app/auth/pco/callback
PCO_KIDS_MINISTRY_TAG=           # optional: filter PCO events by ministry tag
RAILS_LOG_LEVEL=info
DEBUG_PCO_SYNC=false
```

---

## Relationship to churchcred

When both gems are mounted in the same host app, churchcred reads kidspire for child identity. This cross-gem link is defined in the host app — not inside either gem.

```ruby
# host app config/initializers/churchcred_kidspire.rb
Churchcred.configure do |config|
  config.child_model      = 'Kidspire::Child'
  config.family_model     = 'Kidspire::Family'
  config.child_foreign_key = 'kidspire_child_id'
end
```

kidspire does not depend on churchcred. churchcred does not depend on kidspire. The host app wires them together.

---

## Claude Code Session Starter

Paste this as your first message when opening Claude Code in this repo:

---

> I am building the `kidspire` standalone Rails Engine gem. Read `ECOSYSTEM_CONTEXT.md` first, then `CLAUDE_CODE_CONTEXT.md` in full before doing anything else.
>
> Key constraints:
> - Mirror the churchcred gem at github.com/chadjsdev/churchcred for all patterns
> - Auth is Supabase Auth — no Clerk, no kidsmin-cloud coupling ever
> - PCO sync is bidirectional — per-church settings control direction
> - kidspire owns its own Postgres tables as source of truth — PCO is sync source/target
> - Theme framework via Rails Engine view overrides + CSS variable contract
> - React components use CSS variables for theming — no theme prop objects
> - Zero dependency on kidsmin-cloud or churchcred — host app wires them together
>
> Start by:
> 1. Reading ECOSYSTEM_CONTEXT.md
> 2. Reading CLAUDE_CODE_CONTEXT.md
> 3. Fetching github.com/chadjsdev/churchcred — read Gemfile, churchcred.gemspec, db/schema.rb, app/controllers, lib/churchcred/pco_client.rb, railway.toml, Procfile
> 4. Telling me what you plan to scaffold before writing a single line of code
>
> Build order:
> 1. Gem scaffold (gemspec, engine.rb, configuration.rb, version.rb)
> 2. Database migrations
> 3. Models
> 4. Controllers + routes
> 5. Supabase Auth JWT validation (application_controller.rb)
> 6. PCO client + OAuth connect/callback flow
> 7. Sync jobs (inbound people, inbound events, outbound profile, outbound registrations)
> 8. Sync settings controller
> 9. Theme framework (CSS variables, default theme, view override structure)
> 10. React/Vite frontend scaffold
> 11. Railway deployment config (Procfile, railway.toml)

---

*kidspire gem · standalone · MIT · April 2026*
*Part of the kidspire/churchcred family — github.com/chadjsdev*
