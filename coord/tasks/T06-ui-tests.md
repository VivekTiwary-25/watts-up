# T06 - UI behaviour tests (worker: Codex Luna) - branch `t06-ui-tests`

Goal: prove the judge checks in tests (jsdom + @testing-library/react, already installed). Do not change app code unless a test exposes a real bug; if so, make the smallest fix and note it.

Files you may touch: `src/ui/*.test.tsx` (new), `src/test/setup.ts` (new, e.g. matchMedia/ResizeObserver mocks), `vite.config.ts` (only `test.setupFiles`), `package.json` (only add devDependency `@testing-library/user-event` / `@testing-library/jest-dom` if needed), minimal bug fixes in `src/ui/**`, `coord/results/T06-ui-tests.md`.

Tests (reset the zustand store between tests via `useHouse.setState(initial)`):
1. ApplianceList: toggling "Split AC" on raises the bill total shown in BillPanel; toggling off lowers it back (judge check 1).
2. BillPanel: shows units and tip text; shares bars count = ON appliances.
3. TargetPanel: set target below current bill -> "over target" state text; above -> "under target" (judge check 2).
4. ApplianceCard: selecting an appliance shows its name/watts; hours slider change updates monthly cost; switch toggles `on`.
5. Store-level power cut flow end-to-end: startPowerCut -> pick 3 -> 4th blocked (pickError) -> confirm true -> restorePower restores (judge check 3).
Done = `npm test` + `npm run build` pass.
