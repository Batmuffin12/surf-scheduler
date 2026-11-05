# Surf Scheduler frontend

React + TypeScript (Vite) with [Mantine](https://mantine.dev) for UI components.

```bash
pnpm install        # run from the repo root
pnpm dev            # http://localhost:5173, talks to the backend on :3000
pnpm dev:mock       # same app, but every API call returns mock data (no backend needed)
pnpm test
pnpm build
pnpm lint
pnpm api:types      # regenerate src/api/schema.d.ts after docs/openapi.yaml changes
```

## API layer

Screens call `api` from `src/api` (for example `api.signIn(email)`, `api.getBeachGrades(userId, at)`).

- **Mock mode** (`pnpm dev:mock`, from `.env.mock`): answers with data from `src/api/mockData.ts`, after a short delay so loading states show.
- **Real mode** (`pnpm dev`): calls the backend with the typed client. Endpoints not yet in `docs/openapi.yaml` throw `NotAvailableYetError`.
- `src/api/types.ts` holds **draft** types for profile, grades and suggestions. They are not in the API contract yet; replace them with generated types once the backend adds them.

API calls go to `/api/*`, which the dev server forwards to the backend at `http://localhost:3000` (see `../docs/openapi.yaml`). The theme (colors, fonts) lives in `src/theme.ts`.
