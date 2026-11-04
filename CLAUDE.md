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
