# PulseGuard API

Express and MongoDB service for authentication, monitor ownership, scheduled HTTP
checks, uptime/latency aggregation, and health reporting.

## Environment

Copy `.env.example` to `.env` and replace `JWT_SECRET` with at least 32 random
characters. To enable alerts, set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME`.
Never commit the resulting `.env` file.

```bash
cp .env.example .env
npm ci
npm run dev
```

Default URL: `http://127.0.0.1:3001`.

## API groups

- `/api/auth` — register, sign in, inspect, and end an HttpOnly cookie session
- `/api/monitor` — authenticated monitor lifecycle
- `/api/test` — authenticated one-off safe HTTP check
- `/api/dashboard` — authenticated summary and trend data
- `/api/telegram` — Telegram connection status, one-time link creation, and disconnect
- `/api/system/live` — process liveness
- `/api/system/ready` and `/api/system/health` — MongoDB and Redis readiness

See the repository root README for security and deployment notes.
