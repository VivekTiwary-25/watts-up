# T26 result - submission docs

- Rewrote `README.md` in the requested order (problem, 5 features, run steps + live URL, two screenshot links, 3-step demo with exact numbers, limitations, credits copied from CREDITS.md, Built with AI), then kept bill maths, Power Cut, architecture, stack. Stale numbers removed.
- Added `docs/DOC-01` to `DOC-06` (one commit each).
- Added `src/store/submission-checks.test.ts` (9 tests covering the five DOC-03 checks).
- Verify: `npm test` and `npm run build` both pass.
- Findings: the target bill is a slider, so 0/negative/empty cannot be typed; DOC-03 says so and relies on `setTarget` clamping/ignoring in the unit test.
- BOUNDARY: no hours setting lands exactly on 100 or 200 units with the current appliances, so the test uses bill == target (AC alone, 5 h/day = Rs 1,300, target 1,300 -> "Rs 0 under target"), plus `energyCharge(100)=400` and `(200)=1000`.
- Open: `docs/screenshot-main.png` and `docs/screenshot-result.png` must be captured by hand; fridge and washer credits still say FILL IN; DOC-03 slider and runbook UI labels (intro button, floor buttons) were not clicked in a browser.
