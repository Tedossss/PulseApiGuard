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
                                             ↘ monitoring worker → external endpoints
```

The worker runs every five seconds and respects each monitor's configured interval
between 30 seconds and 24 hours. A monitor moves to `DOWN` after three consecutive
failures. Requests time out after ten seconds.

## Security

- Real `.env` files, build output, caches, logs, and dependencies are excluded.
- JWT secrets must contain at least 32 characters; tokens expire after 12 hours by default.
- Authentication, general API, and manual checks use Redis-backed shared rate limits.
- Accounts are limited to 20 monitors by default and checks run no more often than every 30 seconds.
- CORS uses an explicit origin allowlist.
- Monitor ownership is checked before reads, updates, and deletes.
- Update fields and HTTP methods are allowlisted.
- Monitoring requests reject local/private network destinations, credentials in URLs,
  non-HTTP protocols, and redirects to reduce SSRF risk.

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
