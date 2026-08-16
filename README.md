# PulseGuard

PulseGuard is a product-only API monitoring application for owned HTTP endpoints. It
combines configurable checks, latency and uptime history, confirmed incident state
transitions, HttpOnly sessions, and optional Telegram incident/recovery alerts.

## Public route boundary

The Next.js application has a build-time `basePath` of `/PAG`. Its source routes stay
at the App Router root while their public URLs are:

| Public URL | Purpose |
| --- | --- |
| `/PAG` | Product landing page |
| `/PAG/auth` | Registration and sign-in |
| `/PAG/dashboard` | Authenticated dashboard; add `?demo=1` for the read-only demo |
| `/PAG/api/*` | Same-origin proxy to the Express `/api/*` routes |
| `/PAG/health` | Frontend liveness |
| `/PAG/_next/*` | PulseGuard framework assets |

This repository intentionally does not own `/`, `/dream`, or the unprefixed `/_next/*`
namespace. A standalone portfolio can serve those paths while the reverse proxy mounts
this application at `/PAG`. The root site's `robots.txt` should advertise
`https://falach.pl/PAG/sitemap.xml` if product indexing is desired. Changing the base
path requires a new frontend build.

## Features

- Create, edit, delete, and search owned endpoint monitors.
- Schedule `GET` or `HEAD` checks from every 30 seconds to every 24 hours.
- Track latency, expected HTTP status, uptime trends, and cursor-paginated history.
- Confirm `DOWN` only after three consecutive failures and recover on the next success.
- Connect Telegram for confirmed incident and recovery alerts.
- Run the Express API and BullMQ workers independently with Redis-backed locks.
- Reject local/private targets, embedded URL credentials, unsafe methods, and redirects.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, Recharts
- Node.js, Express, MongoDB, Mongoose
- BullMQ, Redis, Docker Compose

## Architecture

```text
Browser /PAG/api/* → Next.js rewrite → Express /api/* → MongoDB
                                                ↘ Redis rate limits
Express → BullMQ schedulers → Redis → workers → owned public endpoints
                                           ↘ Telegram Bot API
```

Each monitor has a BullMQ scheduler for its configured interval. Workers use
distributed per-monitor locks, bounded concurrency, and retry infrastructure failures.
HTTP checks time out after ten seconds. A Redis lease elects one Telegram polling leader
when multiple workers run. Alert messages omit URL queries and fragments.

## Security

- JWT secrets must contain at least 32 characters.
- Browser sessions use `HttpOnly`, `SameSite=Strict` cookies scoped to `Path=/PAG` and
  expire after 12 hours by default. Login/logout responses also expire the former root-
  scoped cookie so upgrades do not leave stale sessions behind.
- Browser code never reads the session token; non-browser clients may use Bearer tokens.
- API, authentication, and manual-check rate limits use Redis.
- Monitor ownership is checked before reads, updates, and deletes.
- Monitoring logs expire after 30 days and use bounded aggregation/pagination paths.
- CORS uses an explicit origin allowlist.

Set `TRUST_PROXY` to the exact trusted proxy count. Set
`SESSION_COOKIE_SECURE=true` whenever the public deployment uses HTTPS.

## API overview

Express owns these internal paths; browser callers reach the same paths below
`/PAG/api` through Next.js:

- `/api/auth` — register, sign in, inspect, and end a session
- `/api/monitor` — authenticated monitor lifecycle
- `/api/test` — authenticated one-off safe check
- `/api/dashboard` — summaries, trends, and cursor-paginated logs
- `/api/telegram` — Telegram status, linking, and disconnect
- `/api/system/live` — process liveness
- `/api/system/ready` and `/api/system/health` — MongoDB/Redis readiness

## Run with Docker

```bash
cp .env.example .env
# Replace JWT_SECRET with output from: openssl rand -hex 32
# Add TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME to enable Telegram alerts.
docker compose up --build
```

Open `http://localhost:3000/PAG`. API readiness is available through
`http://localhost:3000/PAG/api/system/ready`, and frontend liveness is
`http://localhost:3000/PAG/health`. Compose publishes the frontend on loopback only;
set `FRONTEND_BIND_PORT` when the host reverse proxy uses another loopback port.

## Run locally

Backend:

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

Frontend, in another terminal:

```bash
cd frontend
cp .env.local.example .env.local
npm ci
npm run dev
```

## Checks

```bash
cd backend && npm test && npm audit --omit=dev
cd ../frontend && npm test && npm run lint && npm run typecheck && npm run build
npm audit --omit=dev
cd .. && JWT_SECRET=test-secret-that-is-at-least-32-characters docker compose config
```

GitHub Actions runs the same product tests, production dependency audits, lint,
type-checking, and frontend build for pull requests and pushes to `main`.

## Current scope

- Checks intentionally support only `GET` and `HEAD`; request bodies and custom headers
  are not implemented.
- Telegram is the only notification integration.
- Logs expire after 30 days; there is no long-term analytics export.
- The repository does not declare an open-source license.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and
[SECURITY.md](SECURITY.md) for vulnerability reporting.
