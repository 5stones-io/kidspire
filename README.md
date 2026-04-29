# kidsmin

A self-hostable children's ministry portal built as a Rails Engine gem. Family profiles, children management, event registration, and Planning Center sync — all in a single deployable package.

MIT licensed. No dependency on any hosted platform.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

---

## Part of the kidsmin/churchcred family

| Repo | What it is |
|---|---|
| **`kidsmin`** (this repo) | Standalone gem. Self-hostable. MIT. |
| `kidsmin-cloud` | Hosted SaaS platform built on this gem. Clerk SSO. Multi-tenant. |
| `churchcred` | Standalone points/badges gem. Self-hostable. MIT. Works alongside kidsmin. |
| `churchcred-cloud` | Hosted SaaS version of churchcred. Plugs into kidsmin-cloud. |

Want managed hosting instead of self-hosting? See [kidsmin-cloud](https://github.com/chadjsdev/kidsmin-cloud).

---

## What It Does

- **Family profiles** — parents create accounts, add children, manage contact info
- **Children management** — name, birthdate, grade, allergies/notes per child
- **Event registration** — public event listings with per-child signup forms
- **Planning Center sync** — connect your PCO account; family and child records sync automatically
- **Supabase Auth** — email magic link, Google OAuth, Apple OAuth — no password required

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Ruby on Rails (API + Engine) |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (magic link, Google, Apple) |
| Database | PostgreSQL (via Supabase or your own Postgres) |
| Background jobs | Sidekiq + Redis |
| Deployment | Railway (Procfile + railway.toml included) |

---

## Quick Start (Railway)

The fastest path is one-click Railway deploy:

1. Click **Deploy on Railway** above
2. Add the **PostgreSQL** and **Redis** plugins to your Railway project
3. Set the required environment variables (see below)
4. Deploy — the app builds and runs automatically

### Manual setup

```bash
git clone https://github.com/chadjsdev/kidsmin
cd kidsmin
bundle install
npm install
bundle exec rails db:setup
npm run dev        # frontend on :8080, proxies /api to :3000
bundle exec rails s # Rails API on :3000
bundle exec sidekiq # background jobs
```

---

## Using as a gem (mountable engine)

Add to your Gemfile:

```ruby
gem 'kidsmin'
```

Mount in `config/routes.rb`:

```ruby
mount Kidsmin::Engine => '/'
```

Run the engine migrations:

```bash
bundle exec rails kidsmin:install:migrations
bundle exec rails db:migrate
```

Configure in an initializer:

```ruby
# config/initializers/kidsmin.rb
Kidsmin.configure do |config|
  config.supabase_url      = ENV['SUPABASE_URL']
  config.supabase_anon_key = ENV['SUPABASE_ANON_KEY']
  config.pco_client_id     = ENV['PCO_CLIENT_ID']      # optional
  config.pco_client_secret = ENV['PCO_CLIENT_SECRET']  # optional
  config.encryption_key    = ENV['ENCRYPTION_KEY']
end
```

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string. Auto-set by Railway PostgreSQL plugin. |
| `REDIS_URL` | Redis connection string. Auto-set by Railway Redis plugin. |
| `RAILS_MASTER_KEY` | Contents of `config/master.key` — decrypts credentials. |
| `SUPABASE_URL` | Your Supabase project URL. |
| `SUPABASE_ANON_KEY` | Supabase anon key (safe for browser). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server only. |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting PCO tokens. `openssl rand -hex 32` |

### Optional

| Variable | Description |
|---|---|
| `PCO_CLIENT_ID` | Planning Center OAuth client ID. Required for PCO sync. |
| `PCO_CLIENT_SECRET` | Planning Center OAuth client secret. Required for PCO sync. |
| `VITE_API_BASE_URL` | Frontend API base URL. Baked in at build time. e.g. `https://your-app.up.railway.app/api/v1` |
| `RAILS_LOG_LEVEL` | Defaults to `info`. |
| `DEBUG_PCO_SYNC` | Set `true` for verbose PCO sync logs. |

---

## Planning Center Setup

### Step 1 — Create a PCO OAuth app

1. Go to [api.planningcenteronline.com/oauth/applications](https://api.planningcenteronline.com/oauth/applications)
2. Click **New Application**
3. Set redirect URIs:
   ```
   https://your-app.up.railway.app/auth/pco/callback
   https://your-app.up.railway.app/auth/pco/login/callback
   ```
4. Select scopes: `people`, `check_ins`, `services`
5. Copy the **Client ID** and **Client Secret**

### Step 2 — Enter credentials in kidsmin

1. Log in as admin
2. Navigate to **PCO Sync** → **PCO API Configuration**
3. Paste Client ID and Client Secret → **Save**

### Step 3 — Authorize

Click **Connect PCO** — approve the PCO consent screen. kidsmin stores your access and refresh tokens automatically.

---

## Services (Procfile)

| Service | Command |
|---|---|
| `web` | `bundle exec puma -C config/puma.rb` |
| `worker` | `bundle exec sidekiq` |

On Railway, deploy `worker` as a separate service with start command overridden to `bundle exec sidekiq`.

---

## Allowed Hosts

Configure in `config/environments/production.rb`:

```ruby
config.hosts = [
  "your-app.up.railway.app",
  "your-custom-domain.com"
]
```

---

## Health Check

Rails default `/up` endpoint. Railway health checks hit this automatically.

---

## Relationship to churchcred

`kidsmin` and `churchcred` are designed to run alongside each other. kidsmin handles family identity and event management. churchcred handles points, badges, and check-in rewards. They share the same PCO connection and the same family/child data model.

To run both:

```ruby
# Gemfile
gem 'kidsmin'
gem 'churchcred'
```

```ruby
# config/routes.rb
mount Kidsmin::Engine   => '/'
mount Churchcred::Engine => '/churchcred'
```

---

## Contributing

Open issues before large PRs. The gem's data model and API surface affect kidsmin-cloud — breaking changes need coordination.

---

## License

MIT — see `LICENSE`

## Built by

[Jubilee Christian Center](https://jcc.org) · Fairfax, Virginia
Children's Ministry Technology Team
