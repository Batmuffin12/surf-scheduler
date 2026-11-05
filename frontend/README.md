# Surf Scheduler frontend

React + TypeScript (Vite) with [Mantine](https://mantine.dev) for UI components.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
npm run lint
```

API calls go to `/api/*`, which the dev server forwards to the backend at `http://localhost:3000` (see `../docs/openapi.yaml`). The theme (colors, fonts) lives in `src/theme.ts`.
