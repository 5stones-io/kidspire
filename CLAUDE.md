# kidsmin

Read `ECOSYSTEM_CONTEXT.md` and `CLAUDE_CODE_CONTEXT.md` before doing anything.

## Stack

- Ruby 3.3 / Rails 7.2 engine (standalone + mountable)
- React + Vite + TypeScript + Tailwind + shadcn-style components
- Rodauth (passwordless email magic link, JWT)
- PostgreSQL + Sidekiq 7 + Redis
- Railway deployment

## Dev servers

```bash
overmind start -f Procfile.dev
```

Starts Rails (:3000), Vite (:3036), and Sidekiq together. If background jobs aren't processing, check `overmind connect worker`.

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
- Admin identity: `accounts.admin` boolean column, embedded in JWT payload
- PCO tokens encrypted via Kidsmin::Encryption (AES-256-GCM)

## Engineering Standards
- **Autonomy:** Do not ask me to run commands in separate terminals. Use background processes (`&`) or `tmux` for long-running servers.
- **Verification:** After making a change, you MUST verify it yourself. 
  1. Boot servers if they aren't running.
  2. Run relevant RSpec or React tests.
  3. Use the `browser-check` skill to verify UI changes.
- **Definition of Done:** A task is only "Ready" once you have verified it in the terminal and the browser.

## Commands
- **All servers:** `overmind start -f Procfile.dev`
- **Test Suite:** `bundle exec rspec` and `bun test`

## Development Workflow
- **Standard:** Use `overmind start -f Procfile.dev` to boot the environment.
- **Verification:** Always run `bundle exec rspec` and `bun test` after changes.
- **UI Checks:** Use the `browser-check` skill (Playwright) to verify frontend changes.
- **Autonomy:** If a process crashes, use `overmind restart [process_name]` to fix it yourself.