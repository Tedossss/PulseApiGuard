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
