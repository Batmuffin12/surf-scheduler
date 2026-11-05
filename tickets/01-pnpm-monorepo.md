# 01: pnpm monorepo (frontend + backend workspaces)

**Owner:** Ofek

**What to build:** One `pnpm install` at the repo root sets up both apps, and one command from the root runs the frontend and the backend together (plus per-app commands). The existing frontend keeps working unchanged in the running app, and there is an empty-but-runnable `backend` workspace package (NestJS, per the spec) ready for later tickets to fill in. "Worktrees" is read as pnpm workspaces; git worktrees should also work, i.e. nothing in the setup depends on a fixed absolute path or a single checkout.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Root workspace config covers `frontend` and `backend`; the root package is private and pins the pnpm version
- [x] The frontend's npm lockfile is replaced by the single root pnpm lockfile; `pnpm install` from a clean clone succeeds
- [x] `backend` is a minimal NestJS package that starts and answers a trivial health request
- [x] Root scripts: run both apps in parallel, plus build, lint and test across all workspaces
- [x] The frontend dev server still loads in the running app, with the existing email login and Israel map unchanged
- [x] The launch config and `.gitignore` match the new layout
- [x] A short README section documents the commands
