# T16 - Fix R02 review findings (store/bill) (worker: Codex Luna) - branch `t16-review-fixes`

Read `coord/results/R02-review.md` (your own review). Fix findings 1, 3 and the config part of 4. Tests first: write a failing test for each, then fix.

Files you may touch: `src/store/useHouse.ts`, `src/store/useHouse.test.ts`, `src/lib/bill.ts`, `src/lib/bill.test.ts`, `src/data/config.ts` (add `HOURS = { min: 0, max: 24, step: 0.5 }`), `coord/results/T16-review-fixes.md`. Do NOT touch src/ui/** (another worker is editing it; boss wires HOURS into the slider later).

1. HIGH: `pick` only works in phase 'choosing'; `confirmPicks` only from 'choosing'. In 'result', picks are frozen. Add a `retryPicks()` action that returns to 'choosing' keeping current picks (the result card's "Try again"). Add to the contract-compatible interface.
2. LOW: totalUnits === 0 with appliances on -> zero-usage tip ("Your appliances are on but set to 0 hours. Your bill is just the Rs 100 fixed charge." using formatINR).
3. Store hours clamp uses HOURS from config.
Run `npm run format` on touched files. Done = tests + build pass.
