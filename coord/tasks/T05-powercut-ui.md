# T05 — Power Cut overlay UI (worker: Grok) · branch `t05-powercut-ui`

Code against `coord/CONTRACT.md` (Store, Power cut). T02 builds store + powercut logic in parallel; if `src/store/useHouse.ts` / `src/lib/powercut.ts` are missing, create TEMPORARY stubs exactly matching the contract and say so in your result (boss keeps T02's).

Files you may touch: `src/ui/powercut/**` (new), `coord/results/T05-powercut-ui.md`, stubs above. Do NOT edit App.tsx (boss mounts `<PowerCutOverlay />`).

Build (use `motion`; glass card style `.glass`, `.clay` buttons; respect reduced motion):
1. `PowerCutOverlay.tsx` — reads `powerCut` phase.
   - 'flicker': full-screen lightning flicker (white flashes at irregular intervals, ~POWER_CUT.flickerMs) then darkness vignette; then calls `setPowerCutPhase('choosing')`. Reduced motion: no flashes, short fade.
   - 'choosing': dark vignette (pointer-events-none) + glass card "Inverter backup: choose 3 to keep running." showing 3 slots filled by picked appliance names (click slot to unpick), live battery time + load watts for current picks, Confirm button disabled unless exactly 3. When `pickError` changes: card shakes (x keyframes) and shows the message for ~2s (aria-live assertive).
   - 'result': result card: comfort `score/max`, battery time (h m), cost per hour ₹, your picks, and "Best possible combo" (bestCombo) with its numbers + one-line comparison ("Yours lasts 1h 10m less" etc.), note "checked all 56 combinations". Buttons: "Restore power" (restorePower) and "Try again" (back to choosing, keep phase on).
2. `BatteryGauge.tsx` — small battery icon fill ∝ min(hours/8,1), color shifts red when < POWER_CUT.minBackupHours.
3. `formatDuration.ts` (+ `formatDuration.test.ts`): 1.5 → "1h 30m", 0.25 → "15m", 5.43 → "5h 26m".
Commit after each piece (feat(powercut): ...). Done = build + tests pass. Write result file.
