# T05 power-cut UI result

- Added `src/ui/powercut/PowerCutOverlay.tsx`, `BatteryGauge.tsx`, `formatDuration.ts`, and `index.ts`. Mount with `import { PowerCutOverlay } from '@/ui/powercut'`. App.tsx was not edited.
- Flicker runs irregular white flashes for `POWER_CUT.flickerMs`, then a dark vignette, then `setPowerCutPhase('choosing')`. Reduced motion skips the flashes and fades in 400ms.
- Choosing is a bottom glass card: 3 slots (click to unpick), live backup time and load watts, Confirm disabled unless exactly 3. A new `pickError` shakes the card and shows the message for 2s on an assertive live region. The vignette is pointer-events-none so the house stays clickable.
- Result shows comfort `score/max` via `comfortScore`, backup time, ₹/h, your picks, and `bestCombo()` with the same numbers. Comparison is duration-based ("Yours lasts 4h 36m less"). Note uses `allCombos().length`. Restore power calls `restorePower`. Try again returns to choosing and keeps the current picks.
- Battery fill is `min(hours/8, 1)` and turns red below `POWER_CUT.minBackupHours`. Overlay is `z-50`; stack it after the HUD if that panel uses a higher layer.
- Temporary stubs, discard if T02 landed: `src/data/appliances.ts`, `src/data/config.ts`, `src/lib/powercut.ts`, `src/store/useHouse.ts`. `useBill` is inlined in the store stub because `src/lib/bill.ts` is not in this clone.
- Verify: `npm test` (18 passed) and `npm run build` (passed). Overlay tests cover confirm gating, unpick, the 2s limit, the 4h 36m gap, restore, and flicker advance.
