# PulseGuard

PulseGuard is a full-stack API monitoring platform with configurable HTTP checks,
latency and uptime history, incident state transitions, JWT authentication, and
per-user dashboards.

## Stack

- Next.js, React, TypeScript, Recharts
- Node.js, Express, MongoDB, Mongoose
- Docker Compose and MongoDB health checks

## Architecture

```text
Browser → Next.js UI → same-origin /api proxy → Express API → MongoDB
                                             ↘ Redis rate limits
Express API → BullMQ job schedulers → Redis → monitoring workers → external endpoints
```

Each monitor has a BullMQ job scheduler that respects its configured interval between
30 seconds and 24 hours. Dedicated workers use distributed per-monitor locks, controlled
concurrency, and exponential retry for infrastructure failures. A monitor moves to `DOWN`
after three consecutive failures. HTTP checks time out after ten seconds.

## Security

- Real `.env` files, build output, caches, logs, and dependencies are excluded.
- JWT secrets must contain at least 32 characters; tokens expire after 12 hours by default.
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

## Dashboard data API

- `GET /api/dashboard/summary` returns per-monitor status and aggregate uptime.
- `GET /api/dashboard/trend?hours=24` returns five-minute buckets; ranges above 48
  hours use hourly buckets and are capped at seven days.
- `GET /api/dashboard/logs?limit=50&cursor=...&monitorId=...` provides ownership-safe
  cursor pagination. `limit` is capped at 100.

Set `TRUST_PROXY` to the exact number of trusted reverse proxies when deploying behind
one. Browser tokens currently use local storage; for a high-risk production environment,
prefer short-lived access tokens plus rotated HttpOnly refresh cookies and CSRF protection.

## Run with Docker

```bash
cp .env.example .env
# Replace JWT_SECRET in .env with: openssl rand -hex 32
docker compose up --build
```

Open `http://localhost:3000`. The API health endpoint is available through
`http://localhost:3000/api/system/health`.

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
cd ../frontend && npm run lint && npm run build
```

## Repository safety

Run this before the first push and confirm that no command prints a real secret:

```bash
git status --short
git ls-files | grep -E '(^|/)\.env($|\.)' || true
```

Only the example environment files should be committed.
