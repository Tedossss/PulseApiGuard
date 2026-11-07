# PulseGuard

[![CI](https://github.com/Tedossss/PulseApiGuard/actions/workflows/ci.yml/badge.svg)](https://github.com/Tedossss/PulseApiGuard/actions/workflows/ci.yml)

PulseGuard monitors API uptime. It checks your HTTP endpoints on a schedule, stores latency
and uptime history, and declares an incident only after three failures in a row. It sends
DOWN and recovery alerts to Telegram.

**[Live demo](https://falach.pl/dashboard?demo=1)**: the dashboard with sample data, no account needed.

<img width="1145" height="710" alt="PulseGuard dashboard with endpoint list, uptime trend and check history" src="https://github.com/user-attachments/assets/9bab81a0-83d9-4b50-985b-faf63b5fac57" />

## Features

- Create, edit, delete and search your own endpoint monitors (`GET` or `HEAD`, every 30 s to 24 h).
- Track latency, expected HTTP status, uptime trends and cursor-paginated check history.
- Mark a monitor `DOWN` after three consecutive failures and recover it on the next success.
- Link Telegram from the dashboard settings to receive incident and recovery alerts.
- Run the API and the workers as separate processes, and scale workers horizontally.

## Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Backend  | Node.js 22, TypeScript (strict), Express 5, Mongoose 9        |
| Jobs     | BullMQ job schedulers on Redis, per-monitor Redis locks       |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Recharts       |
| Infra    | Docker Compose, GitHub Actions, MongoDB 7, Redis 7            |
| Tests    | `node:test`, Supertest against real MongoDB and Redis         |

## Architecture

```text
Browser → Next.js UI → same-origin /api proxy → Express API → MongoDB
                                             ↘ Redis (rate limits)
Express API → BullMQ job schedulers → Redis → monitor workers → external endpoints
                                                       ↘ Telegram Bot API
```

The API and the worker share one codebase and run as two processes (`dist/server.js`,
`dist/worker.js`). The API owns users, monitors and dashboards. Workers own checks, state
transitions and alerts.

## Key engineering decisions

**SSRF protection is applied after DNS resolution.** PulseGuard sends requests to URLs that
users supply, so URL checks alone are not enough: a public hostname can resolve to
`127.0.0.1`. The HTTP agents use a custom `lookup` that rejects private, reserved,
IPv4-mapped and NAT64 addresses at connect time. Redirects, credentials in URLs and other
methods are refused. See [`apiTester.ts`](backend/src/services/apiTester.ts).

**One check per monitor at a time.** Every monitor has its own BullMQ job scheduler. A
worker takes a Redis lock (`SET NX PX` with a random token) before it checks a monitor, and
releases the lock with a compare-and-delete Lua script. Several workers can therefore run
without checking the same monitor twice. The Telegram alert goes out after the lock is
released. See [`monitorWorker.ts`](backend/src/workers/monitorWorker.ts).

**Three failures before an incident.** A single timeout should not wake anyone up.
`calculateMonitorState` is a pure function with unit tests, and the worker persists its result.

**Aggregate in the database.** Summaries and trends are MongoDB aggregations
(`$lookup`, `$dateTrunc`). Logs have compound indexes and a 30-day TTL. History pages use
an opaque `(createdAt, _id)` cursor, so ties on equal timestamps are neither skipped nor
duplicated, which offset pagination cannot guarantee.

**Quotas hold under concurrency.** Two parallel requests can both pass a
"count < limit" check. A monitor created past the limit compares its own ObjectId position
and backs out. An integration test fires 8 parallel creates against a limit of 3.

**Sessions the browser cannot read.** Sessions are JWTs in `HttpOnly`, `SameSite=Strict`
cookies with an issuer and audience, valid for 12 h by default. Bearer tokens remain
accepted for non-browser clients. Auth, the general API and manual checks have rate limits
stored in Redis.

## Quick start (Docker)

```bash
cp .env.example .env
# Set JWT_SECRET to the output of: openssl rand -hex 32
# Optional: TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME enable alerts.
docker compose up --build
```

Open `http://localhost:3000`. Readiness: `http://localhost:3000/api/system/ready`.
Docker publishes the frontend on loopback only. Set `FRONTEND_BIND_PORT` if a reverse
proxy needs another host port, `TRUST_PROXY` to the number of proxies in front, and
`SESSION_COOKIE_SECURE=true` behind HTTPS.

## Local development

```bash
# MongoDB and Redis on the ports backend/.env.example expects
docker run -d --name pulseguard-mongo -p 127.0.0.1:27017:27017 mongo:7
docker run -d --name pulseguard-redis -p 127.0.0.1:6379:6379 redis:7-alpine

# API and worker (two terminals)
cd backend && cp .env.example .env && npm ci
npm run dev
npm run dev:worker

# Dashboard
cd frontend && cp .env.local.example .env.local && npm ci && npm run dev
```

## Tests and checks

```bash
cd backend
npm run lint && npm run typecheck
npm test                    # unit tests, no services needed
npm run test:integration    # needs TEST_MONGO_URI and TEST_REDIS_URL, see backend/README.md

cd ../frontend
npm test && npm run lint && npm run build
```

CI runs all of these on every pull request and on every push to `main`. It starts MongoDB
and Redis as service containers, runs production dependency audits, validates the Compose
file and builds the backend image.

## API overview

| Method and path                                           | Purpose                                         |
| --------------------------------------------------------- | ----------------------------------------------- |
| `POST /api/auth/register`, `/login`, `/logout`            | Account and cookie session                      |
| `GET /api/auth/session`                                   | Current user                                    |
| `GET /api/monitor`, `GET /api/monitor/:id`                | List or read your monitors                      |
| `POST /api/monitor/add`, `PUT/DELETE /api/monitor/:id`    | Monitor lifecycle (ownership enforced)          |
| `POST /api/test`                                          | One-off safe check, rate limited                |
| `GET /api/dashboard/summary`                              | Per-monitor status and uptime                   |
| `GET /api/dashboard/trend?hours=24`                       | 5-minute buckets (hourly above 48 h, max 7 d)   |
| `GET /api/dashboard/logs?limit=50&cursor=…&monitorId=…`   | Cursor-paginated history, `limit` ≤ 100         |
| `GET/POST/DELETE /api/telegram/…`                         | Telegram link status, one-time link, disconnect |
| `GET /api/system/live`, `/api/system/ready`               | Liveness; MongoDB + Redis readiness             |

Errors always have the shape `{ "error": string, "code"?: string }`.

## Project structure

```text
backend/src/          API, worker, models, queues, services (TypeScript)
backend/test/         Unit tests and integration/ tests
frontend/app/         Next.js routes: landing, auth, dashboard
frontend/lib/         Browser API client
.github/workflows/    CI
docker-compose.yml    Production-like local stack
```

## Current scope

- Checks support only `GET` and `HEAD`, without request bodies or custom headers.
- Telegram is the only alert channel. Email, Slack and webhooks are not implemented.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
