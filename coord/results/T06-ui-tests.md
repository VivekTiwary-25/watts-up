# T06 UI behaviour tests

- Added UI coverage for appliance toggles and their live bill effect.
- Covered BillPanel units, tip copy, and active appliance share bars.
- Covered target status above and below the current bill.
- Covered appliance card details, hours slider cost updates, and switch state.
- Covered the complete power cut pick, block, confirm, and restore flow.
- Added a jsdom `ResizeObserver` mock for Radix sliders.
- Files: `src/ui/ui-behavior.test.tsx`, `src/test/setup.ts`, `vite.config.ts`.
- Verify with `npm test` and `npm run build`.
- Results: 32 tests pass; production build passes.
- Open issues: none.
