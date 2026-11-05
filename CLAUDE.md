# Surf Scheduler

Two developers build this together. Work with the skills in `.claude/skills/`:

- **/grill-me**: settle every design decision before code.
- **/to-spec**: write the agreed design to `docs/SPEC.md`.
- **/to-tickets**: split the spec into tickets, one file each in `tickets/`, each listing what blocks it and who owns it.
- **/tdd**: build every ticket test-first.
- **verification-before-completion**: nothing is done until the tests pass and it works in the running app.
- **frontend-design**: any UI work follows its visual direction.
- **web-design-guidelines**: check the UI against it before the demo.

The shared types / API contract changes only after telling the other developer. Two open tickets never touch the same file.

## Issue tracker and triage labels

This is the configuration `/to-spec` and `/to-tickets` expect (they otherwise point to `/setup-matt-pocock-skills`, which this repo does not use).

- **Tracker: local files in this repo.** No GitHub Issues / Linear.
- **Spec:** `/to-spec` writes `docs/SPEC.md` (not a tracker issue).
- **Tickets:** `/to-tickets` writes one file per ticket as `tickets/<NN>-<slug>.md`, numbered from `01` in dependency order. This replaces the skill's default `.scratch/<feature>/issues/` path. Each ticket uses the skill's local template plus an `**Owner:**` line.
- **Owners:** `Marina` (Marina Gershtein) or `Ofek` (Batmuffin12). Split tickets so the two owners' open tickets never touch the same file.
- **Triage labels** (the ticket's `**Status:**` line):
  - `needs-triage`: not yet reviewed
  - `ready-for-agent`: fully specified, can be built now (default for new tickets)
  - `in-progress`: someone is building it
  - `done`: tests pass and it works in the running app
- **API contract:** `docs/openapi.yaml`. Changing it means telling the other developer first.

