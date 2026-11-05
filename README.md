# Surf Scheduler

pnpm workspace: `frontend` (React + Vite) and `backend` (NestJS). Requires pnpm 11 (pinned via `packageManager`; use Corepack or `npm i -g pnpm@11.1.3`).

```bash
pnpm install          # installs both apps
pnpm dev              # frontend (http://localhost:5173) and backend (http://localhost:3000) in parallel
pnpm dev:frontend     # frontend only
pnpm dev:backend      # backend only (GET /health)
pnpm build            # build all workspaces
pnpm lint             # lint all workspaces
pnpm test             # test all workspaces
```

The frontend dev server proxies `/api/*` to the backend. See `docs/SPEC.md` and `docs/openapi.yaml`.
