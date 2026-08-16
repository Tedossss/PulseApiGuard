# PulseGuard web

Next.js App Router frontend for the PulseGuard landing page, authentication, monitor
dashboard, and same-origin Express API proxy.

The app is compiled with `basePath: '/PAG'`. Source routes remain `app/page.tsx`,
`app/auth`, `app/dashboard`, and `app/health`; public routes are `/PAG`, `/PAG/auth`,
`/PAG/dashboard`, and `/PAG/health`. Browser requests to `/PAG/api/*` are rewritten to
the server-only `API_PROXY_TARGET` destination. The standalone portfolio owns `/`,
`/dream`, and unprefixed `/_next/*` paths.

```bash
cp .env.local.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000/PAG`. The demo dashboard is at
`http://localhost:3000/PAG/dashboard?demo=1`.

The dashboard keeps page orchestration, typed API functions, pure data helpers, and
presentational components separate. Browser authentication uses an HttpOnly cookie
scoped to `/PAG`; client-side JavaScript never reads the token.

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```
