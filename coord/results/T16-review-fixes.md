# T16 Review Fixes
- Added `retryPicks()` to return a confirmed power cut to choosing with the current selection intact.
- Picks now change only while the cut flow is in `choosing`, and confirmation is accepted only in that phase.
- Added `HOURS = { min: 0, max: 24, step: 0.5 }`; store hour bounds now use its min and max.
- Bills with enabled appliances and zero total usage now show a fixed-charge zero-usage tip.
- Files: `src/store/useHouse.ts`, `src/store/useHouse.test.ts`, `src/lib/bill.ts`, `src/lib/bill.test.ts`, `src/data/config.ts`.
- Formatting: ran Prettier on the five touched source files.
- Verify: `npm test -- --run src/store/useHouse.test.ts src/lib/bill.test.ts` passes (20 tests); `npm run build` passes.
- Open issue: full `npm test` has one existing failure in `src/lib/sound.test.ts`, which calls `pick` during `flicker`; the task requires `choosing`-only picks and excludes that test from the allowed files.
- Build emits the existing large Three.js chunk warning.
