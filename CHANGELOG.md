# Changelog

All notable changes to Kidspire will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning policy

- **MAJOR** — breaking changes to the public API, mount interface, or database schema requiring manual intervention
- **MINOR** — new features, new API endpoints, new config options (backwards compatible)
- **PATCH** — bug fixes, security patches, dependency updates (no API or schema changes)

Pre-1.0 (`0.x.y`): minor bumps may include breaking changes as the API stabilises.

---

## [Unreleased]

---

## [0.1.0] — 2026-05-01

### Added
- Initial public release as `kidspire` gem (renamed from internal `kidsmin`)
- Mountable Rails 7.2 engine with standalone deployment support
- Family portal — family profiles, guardians, and children management
- Event listings and per-child registration
- Bidirectional Planning Center Online sync (people, children, events, registrations)
- Per-church sync settings (inbound/outbound controls)
- Rodauth passwordless auth (email magic link + JWT)
- PCO OAuth flow with encrypted token storage (AES-256-GCM)
- Sidekiq background jobs for all PCO sync operations
- React + Vite + TypeScript + Tailwind frontend
- SMS invite links via Twilio (optional)
- Railway deployment support (Procfile + railway.toml)
- MIT license

[Unreleased]: https://github.com/5stones-io/kidspire/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/5stones-io/kidspire/releases/tag/v0.1.0
