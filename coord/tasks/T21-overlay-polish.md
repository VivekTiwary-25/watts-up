# T21 - Power Cut overlay polish (worker: Codex Luna) - branch `t21-overlay-polish`

Found by boss on the live site. Files you may touch: `src/ui/powercut/**`, `src/data/config.ts` (only add `messageMs` to POWER_CUT), `coord/results/T21-overlay-polish.md`.

1. The "Inverter can only run 3 appliances" message shows for only 2s and is easy to miss. Use `POWER_CUT.messageMs = 3500`; show it as a clear amber pill inside the card above the slots, plus a stronger shake (x: 0,-10,10,-8,8,-4,4,0 over ~450ms). Re-trigger on every blocked click (key on `pickError.at`).
2. Show "Picked 2 of 3" progress text and make Confirm label read "Confirm 3 appliances" when ready.
3. Result card: also show "Comfort" bar out of max and highlight in green which of your picks match the best combo.
Update/extend `PowerCutOverlay.test.tsx`. Run `npm run format`. Done = build + tests pass.
