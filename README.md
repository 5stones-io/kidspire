# Kidspire

A self-hostable children's ministry portal built as a Rails Engine gem. Family profiles, children management, event registration, and Planning Center sync — all in a single deployable package.

Part of the [5stones Software](https://5stones.io) suite. MIT licensed. No dependency on any hosted platform.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

---

## Part of the 5stones suite

| Repo | What it is |
|---|---|
| **`kidspire`** (this repo) | Kids ministry portal. Standalone. Self-hostable. MIT. |
| `churchcred` | Standalone points/badges gem. Self-hostable. MIT. Works alongside Kidspire. |
| More coming | Youthspire, Seniorspire — built on the same Inspire framework |

> Built by [5stones Software](https://5stones.io) — open source tools churches can actually own.

---

## What It Does

- **Family profiles** — parents create accounts, add children, manage contact info
- **Children management** — name, birthdate, grade, allergies/notes per child
- **Event registration** — public event listings with per-child signup forms
- **Planning Center sync** — connect your PCO account; family and child records sync automatically
- **Passwordless auth** — email magic link via Rodauth — no password required

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Ruby on Rails (API + Engine) |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Rodauth (passwordless email magic link) |
| Database | PostgreSQL |
| Background jobs | Sidekiq + Redis |
| Deployment | Railway (Procfile + railway.toml included) |

---

## Quick Start (Railway)

The fastest path is one-click Railway deploy:

1. Click **Deploy on Railway** above
2. Fill in the required environment variables in the Railway template form
3. Railway provisions PostgreSQL, Redis, and both services automatically
4. Once deployed, open a Railway shell and grant admin to your account:
   ```bash
   railway run bundle exec rails console
   # then: Account.find_by(email: 'you@yourchurch.org').update!(admin: true)
   ```

### Local setup

**Prerequisites:** PostgreSQL, Redis, Node.js, and [overmind](https://github.com/DarthSim/overmind) running locally.

```bash
git clone https://github.com/5stones-io/kidspire
cd kidspire
cp .env.example .env
```

Edit `.env` and set at minimum:
- `DATABASE_URL` — replace `your_pg_username` with your local Postgres username (`whoami` on Mac/Linux)
- `SECRET_KEY_BASE` — generate with `openssl rand -hex 64`
- `ENCRYPTION_KEY` — generate with `openssl rand -hex 32`

```bash
bundle install
bun install
npx playwright install chromium  # for UI testing
bundle exec rails db:create db:migrate db:seed
overmind start -f Procfile.dev  # Rails :3000, Vite :3036, Sidekiq
```

---

## Using as a gem (mountable engine)

Add to your Gemfile:

```ruby
gem 'kidspire'
```

Mount in `config/routes.rb`:

```ruby
mount Kidspire::Engine => '/'
```

Run the engine migrations:

```bash
bundle exec rails kidspire:install:migrations
bundle exec rails db:migrate
```

Configure in an initializer:

```ruby
# config/initializers/kidspire.rb
Kidspire.configure do |config|
  config.pco_client_id     = ENV['PCO_CLIENT_ID']      # optional
  config.pco_client_secret = ENV['PCO_CLIENT_SECRET']  # optional
  config.pco_redirect_uri  = ENV['PCO_REDIRECT_URI']   # optional
  config.encryption_key    = ENV['ENCRYPTION_KEY']
  config.frontend_base_url = ENV['FRONTEND_BASE_URL']
end
```

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string. Auto-set by Railway PostgreSQL plugin. |
| `REDIS_URL` | Redis connection string. Auto-set by Railway Redis plugin. |
| `SECRET_KEY_BASE` | Rails secret key. Generate: `openssl rand -hex 64` |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting PCO tokens. Generate: `openssl rand -hex 32` |
| `FRONTEND_BASE_URL` | Public URL of your deployment. e.g. `https://your-app.up.railway.app` |
| `VITE_API_BASE_URL` | API base URL baked into the frontend at build time. e.g. `https://your-app.up.railway.app/api/v1` |

### Email (required for magic link auth)

| Variable | Description |
|---|---|
| `SMTP_ADDRESS` | SMTP host. e.g. `smtp.resend.com` ([Resend](https://resend.com) recommended — free tier) |
| `SMTP_PORT` | SMTP port. `465` for Resend. |
| `SMTP_USERNAME` | SMTP username. `resend` for Resend. |
| `SMTP_PASSWORD` | SMTP password / API key. |
| `SMTP_DOMAIN` | Your verified sending domain. |
| `MAILER_FROM` | From address. e.g. `noreply@yourchurch.org` |

### Optional

| Variable | Description |
|---|---|
| `PCO_CLIENT_ID` | Planning Center OAuth client ID. Required for PCO sync. |
| `PCO_CLIENT_SECRET` | Planning Center OAuth client secret. Required for PCO sync. |
| `PCO_REDIRECT_URI` | e.g. `https://your-app.up.railway.app/auth/pco/callback` |
| `PCO_KIDS_MINISTRY_TAG` | PCO tag name to filter events. Defaults to pulling all events. |
| `TWILIO_ACCOUNT_SID` | Twilio SID for SMS invite links. |
| `TWILIO_AUTH_TOKEN` | Twilio auth token. |
| `TWILIO_FROM_NUMBER` | Twilio phone number. |
| `CORS_ORIGINS` | Allowed CORS origins. Defaults to `FRONTEND_BASE_URL`. |
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

### Step 2 — Enter credentials in Kidspire

1. Log in as admin
2. Navigate to **PCO Sync** → **PCO API Configuration**
3. Paste Client ID and Client Secret → **Save**

### Step 3 — Authorize

Click **Connect PCO** — approve the PCO consent screen. Kidspire stores your access and refresh tokens automatically.

---

## Services

| Service | Command |
|---|---|
| `web` | `bundle exec rails db:migrate && bundle exec puma -C config/puma.rb` |
| `worker` | `bundle exec sidekiq` |

### Railway worker service setup

Railway runs one process per service. Sidekiq needs its own service:

1. In your Railway project, click **+ New → GitHub Repo** → select this same repo
2. Name it `worker`
3. Override **Start Command** to: `bundle exec sidekiq`
4. Override **Build Command** to: `bundle install`
5. Share the same `DATABASE_URL` and `REDIS_URL` environment variables from the PostgreSQL and Redis plugins

Without the worker service, background PCO sync jobs will not run. The web app still functions — sync must be triggered manually via the admin panel.

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

Kidspire and churchcred are designed to run alongside each other. Kidspire handles family identity and event management. churchcred handles points, badges, and check-in rewards. They share the same PCO connection and the same family/child data model.

To run both:

```ruby
# Gemfile
gem 'kidspire'
gem 'churchcred'
```

```ruby
# config/routes.rb
mount Kidspire::Engine   => '/'
mount Churchcred::Engine => '/churchcred'
```

---

## Contributing

Open issues before large PRs. See [5stones.io](https://5stones.io) for the broader suite roadmap.

---

## License

MIT — see `LICENSE`

## Built by

[5stones Software](https://5stones.io) · Open source tools for the local church
