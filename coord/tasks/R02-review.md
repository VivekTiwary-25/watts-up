# R02 - Independent code review (worker: Codex Luna) - branch `r02-review`

Read-only review. Do NOT change source files. Write `coord/results/R02-review.md` only (and its .commits line).

Review `src/lib/**`, `src/store/**`, `src/ui/**`, `src/scene/**`, `src/data/**` for:
1. Correctness bugs (wrong maths, stale state, power-cut restore edge cases: start cut while a card is open, pick while in 'flicker', restore twice, hours=0, all off, target at min/max).
2. React/R3F issues: per-frame allocations in useFrame, missing cleanup, subscriptions leaking, effects running twice in StrictMode causing double sounds/animations, objects not disposed.
3. Judge-check risks: anything that could make (1) bill not update live, (2) target progress wrong, (3) power cut allow != 3.
4. Config-driven gaps: hard-coded numbers that belong in `src/data/config.ts`.
Format: a table: severity (high/med/low) | file:line | problem | concrete fix (code snippet if short). Max 25 findings, most severe first. Run `npm test` and mention results.
