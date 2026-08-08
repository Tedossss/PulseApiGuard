# PulseGuard

PulseGuard is a full-stack API monitoring platform with configurable HTTP checks,
latency and uptime history, incident state transitions, HttpOnly JWT sessions, and
per-user dashboards.

<img width="1145" height="710" alt="image" src="https://github.com/user-attachments/assets/9bab81a0-83d9-4b50-985b-faf63b5fac57" />

## Features

- Create, edit, delete, and search owned endpoint monitors.
- Schedule `GET` or `HEAD` checks from every 30 seconds to every 24 hours.
- Track latency, expected HTTP status, uptime trends, and cursor-paginated check history.
- Confirm a `DOWN` incident after three consecutive failures and recover on success.
- Connect Telegram from dashboard settings for confirmed incident and recovery alerts.
- Run API and workers independently with BullMQ scheduling and distributed Redis locks.
- Preview the dashboard without an account at `/dashboard?demo=1`.
- Open the PulseGuard project presentation at `/PAG`; the deployment root is a small
  project chooser shared with CoLab.

## Stack

- Next.js, React, TypeScript, Recharts
- Node.js, Express, MongoDB, Mongoose
- BullMQ, Redis, Docker Compose, and dependency-aware health checks

- <img width="1914" height="853" alt="image" src="https://github.com/user-attachments/assets/8a7ca274-46f0-4dde-a84e-06117539933d" />


## Architecture

```text
Browser → Next.js UI → same-origin /api proxy → Express API → MongoDB
                                             ↘ Redis rate limits
Express API → BullMQ job schedulers → Redis → monitoring workers → external endpoints
                                                     ↘ Telegram Bot API
```

Each monitor has a BullMQ job scheduler that respects its configured interval between
30 seconds and 24 hours. Dedicated workers use distributed per-monitor locks, controlled
concurrency, and exponential retry for infrastructure failures. A monitor moves to `DOWN`
after three consecutive failures. HTTP checks time out after ten seconds. A Redis lease
elects one worker as the Telegram polling leader when multiple workers are running.
Alert messages omit URL query strings and fragments so endpoint credentials are not
copied into Telegram or lock-screen notifications.

## Security

- Real `.env` files, build output, caches, logs, and dependencies are excluded.
- JWT secrets must contain at least 32 characters; browser sessions use HttpOnly,
  SameSite=Strict cookies that expire after 12 hours by default.
- Authentication, general API, and manual checks use Redis-backed shared rate limits.
- Accounts are limited to 20 monitors by default and checks run no more often than every 30 seconds.
- API and worker processes are separate; workers can scale horizontally without running
  the same monitor concurrently.
- Monitoring logs have compound query indexes and expire automatically after 30 days.
- Dashboard summaries and time-series trends are calculated in MongoDB aggregations
  instead of loading all logs into application memory.
- CORS uses an explicit origin allowlist.
- Monitor ownership is checked before reads, updates, and deletes.
- Update fields and HTTP methods are allowlisted.
- Monitoring requests reject local/private network destinations, credentials in URLs,
  non-HTTP protocols, and redirects to reduce SSRF risk.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/session` returns the current cookie-authenticated user.
- `POST /api/monitor/add`, `GET /api/monitor`, `PUT /api/monitor/:id`,
  `DELETE /api/monitor/:id` implement the monitor lifecycle.
- `GET /api/dashboard/summary` returns per-monitor status and aggregate uptime.
- `GET /api/dashboard/trend?hours=24` returns five-minute buckets; ranges above 48
  hours use hourly buckets and are capped at seven days.
- `GET /api/dashboard/logs?limit=50&cursor=...&monitorId=...` provides ownership-safe
  cursor pagination. `limit` is capped at 100.
- `GET /api/system/live` checks the API process; `/api/system/ready` verifies MongoDB
  and Redis connectivity.
- `GET /api/telegram/status`, `POST /api/telegram/link`, and `DELETE /api/telegram/link`
  manage the authenticated user's Telegram connection.

Set `TRUST_PROXY` to the exact number of trusted reverse proxies when deploying behind
one. Bearer tokens remain accepted for non-browser API clients, while the web application
does not expose its session token to JavaScript. Set `SESSION_COOKIE_SECURE=true` whenever
the public deployment uses HTTPS; the Docker Compose default remains `false` for local HTTP.

## Run with Docker

```bash
cp .env.example .env
# Replace JWT_SECRET in .env with: openssl rand -hex 32
# Add TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME to enable Telegram alerts.
docker compose up --build
```

Open `http://localhost:3000`. The API readiness endpoint is available through
`http://localhost:3000/api/system/ready`; frontend liveness is exposed at
`http://localhost:3000/health`. Docker publishes the frontend on loopback only;
production traffic should reach it through the host reverse proxy. Compose also
caps each container's JSON logs at three 10 MB files to prevent unbounded disk use.
In the shared `falach.pl` deployment, Nginx sends `/colab` to CoLab and every other
path to this frontend, so `/`, `/PAG`, authentication, dashboard, API, and health
routes stay within the PulseGuard service.

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
cd backend && npm test
cd ../frontend && npm test && npm run lint && npm run build
cd .. && JWT_SECRET=test-secret-that-is-at-least-32-characters docker compose config
```

GitHub Actions runs tests, production dependency audits, lint, and the frontend build
for every pull request and push to `main`.

## Project structure

```text
backend/                 Express API, MongoDB models, BullMQ queues and worker
frontend/app/            Next.js routes and UI
frontend/lib/            Shared browser API transport
.github/workflows/       Continuous integration
docker-compose.yml       Local production-like stack
```

## Current scope

- Checks intentionally support only `GET` and `HEAD`; request bodies and custom headers
  are not implemented.
- PulseGuard delivers Telegram alerts; email, SMS, and Slack are not implemented.
- Logs expire after 30 days. There is no long-term analytics export yet.
- The repository does not currently declare an open-source license. Reuse permission
  must be chosen by the repository owner before public distribution.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and
[SECURITY.md](SECURITY.md) for vulnerability reporting.

## Repository safety

Run this before the first push and confirm that no command prints a real secret:

```bash
git status --short
git ls-files | grep -E '(^|/)\.env($|\.)' || true
```

Only the example environment files should be committed.
