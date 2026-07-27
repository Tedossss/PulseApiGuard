# PulseGuard API

Express and MongoDB service for authentication, monitor ownership, scheduled HTTP
checks, uptime/latency aggregation, and health reporting.

## Environment

Copy `.env.example` to `.env` and replace `JWT_SECRET` with at least 32 random
characters. Never commit the resulting `.env` file.

```bash
cp .env.example .env
npm ci
npm run dev
```

Default URL: `http://127.0.0.1:3001`.

## API groups

- `/api/auth` — register and sign in
- `/api/monitor` — authenticated monitor lifecycle
- `/api/test` — authenticated one-off safe HTTP check
- `/api/dashboard` — authenticated summary and trend data
- `/api/system/health` — service health

See the repository root README for security and deployment notes.
