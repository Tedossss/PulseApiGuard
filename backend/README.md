# PulseGuard API

TypeScript (strict) Express and MongoDB service for authentication, monitor ownership, scheduled HTTP
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

Default URL: `http://127.0.0.1:3001`. Run the monitor worker in another terminal with
`npm run dev:worker`.

## Scripts

| Command                              | What it does                             |
| ------------------------------------ | ---------------------------------------- |
| `npm run dev` / `npm run dev:worker` | API / worker with reload (tsx)           |
| `npm run build`                      | Compile `src/` to `dist/`                |
| `npm start` / `npm run worker`       | Run the compiled API / worker            |
| `npm run typecheck`                  | `tsc --noEmit` over sources and tests    |
| `npm run lint`                       | Prettier check                           |
| `npm test`                           | Unit tests, no services needed           |
| `npm run test:integration`           | API tests against real MongoDB and Redis |

Integration tests use their own database and are skipped unless both URLs are set:

```bash
docker run -d --rm --name pg-test-mongo -p 127.0.0.1:27118:27017 mongo:7
docker run -d --rm --name pg-test-redis -p 127.0.0.1:6390:6379 redis:7-alpine
TEST_MONGO_URI=mongodb://127.0.0.1:27118/pulseguard_test \
TEST_REDIS_URL=redis://127.0.0.1:6390/0 npm run test:integration
```

They drop that database and flush that Redis database, so never point them at real data.

## API groups

- `/api/auth` — register, sign in, inspect, and end an HttpOnly cookie session
- `/api/monitor` — authenticated monitor lifecycle
- `/api/test` — authenticated one-off safe HTTP check
- `/api/dashboard` — authenticated summary and trend data
- `/api/telegram` — Telegram connection status, one-time link creation, and disconnect
- `/api/system/live` — process liveness
- `/api/system/ready` and `/api/system/health` — MongoDB and Redis readiness

See the repository root README for security and deployment notes.
