# PulseGuard Dashboard

Next.js dashboard for configuring API monitors and reviewing availability,
latency, and incident states.

```bash
cp .env.local.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. Browser requests use same-origin `/api` paths;
Next.js proxies them to the server-only `API_PROXY_TARGET` value.

The dashboard is split into page orchestration, typed API functions, pure data helpers,
and presentational components under `app/dashboard`. Browser authentication is handled by
an HttpOnly cookie and is never read from client-side JavaScript.

```bash
npm test
npm run lint
npm run build
```
