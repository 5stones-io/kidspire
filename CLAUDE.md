# kidsmin

Read `ECOSYSTEM_CONTEXT.md` and `CLAUDE_CODE_CONTEXT.md` before doing anything.

## Stack

- Ruby 3.3 / Rails 7.2 engine (standalone + mountable)
- React + Vite + TypeScript + Tailwind + shadcn-style components
- Supabase Auth (JWT validation server-side)
- PostgreSQL + Sidekiq 7 + Redis
- Railway deployment

## Dev servers

```bash
# Terminal 1 — Rails API on :3000
bundle exec puma -t 5 -p 3000

# Terminal 2 — Vite frontend on :3036
bun run dev
```

Frontend: http://localhost:3036  
API: http://localhost:3000/api/v1

## Common commands

```bash
bundle exec rails db:migrate
bundle exec rails routes
curl http://localhost:3000/api/v1/events
```

## Key constraints

- No Clerk, no kidsmin-cloud coupling
- All tables namespaced: kidsmin_families, kidsmin_children, etc.
- Routes via scope module: "kidsmin" in config/routes.rb (standalone mode)
- Blueprinter classes use ::Blueprinter::Base (fully qualified)
- Sidekiq pinned to ~> 7.0 (connection_pool 2.x — Ruby 3.3 compat)
- Gems that need explicit Gemfile entries: puma, kaminari, blueprinter, jwt, httparty, redis, rack-cors, rack-attack

## Architecture notes

- Engine routes defined in config/routes.rb using scope module: "kidsmin"
- Vite served at :3036 with proxy to Rails; do NOT use :3000 for the browser
- Admin identity: Supabase JWT app_metadata.role == "admin" (no DB column)
- PCO tokens encrypted via Kidsmin::Encryption (AES-256-GCM)
