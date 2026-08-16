# Contributing to PulseGuard

## Development setup

1. Install Node.js 22, MongoDB 7, and Redis 7, or use Docker Compose.
2. Copy `backend/.env.example` to `backend/.env` and generate a development JWT secret.
3. Copy `frontend/.env.local.example` to `frontend/.env.local`.
4. Install dependencies with `npm ci` in both `backend` and `frontend`.

Do not commit real environment files, tokens, database exports, monitoring targets,
or check logs.

## Before opening a pull request

```bash
cd backend
npm test
npm audit --omit=dev

cd ../frontend
npm test
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

Keep changes focused and document API or environment changes in the root README and
the relevant `.env.example`. New monitor input must be allowlisted and validated on the
server. Changes to outbound requests must preserve the SSRF protections and redirect ban.

## Pull requests

- Explain the user-facing behavior and security impact.
- Include tests for validation, authentication, scheduling, or state transitions.
- Note migrations or breaking API changes explicitly.
- Do not weaken CI checks to make a change pass.
