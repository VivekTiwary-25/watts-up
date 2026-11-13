# T28 — Loading screen + perf caps — result

**Done.** LoadingScreen is mounted in `App.tsx` after `<HUD />` (z-50 overlay) and is guarded so it can't get stuck.

- Files: `src/App.tsx`, `src/ui/LoadingScreen.tsx`
- Hide rules (`useLoadingGate`): `!active && progress === 100`; OR `!active` for 1.5 s after ≥1 item loaded; OR nothing started within 3 s; OR a hard 45 s fallback. Once hidden it stays hidden, so models that lazy-load later never bring it back.
- UI: glass card (`glass` utility) on a navy radial background, cyan progress bar, "Loading the villa… NN%" text, `role="status"` + progressbar aria. Reduced motion: no fade on exit and the bar doesn't animate (`motion-safe:`).
- Perf: Canvas `dpr={[1, MAX_DPR]}` with `MAX_DPR = Math.min(1.5, QUALITY.dpr.high)`; `powerPreference: 'high-performance'` kept; Quality.tsx not touched.
- Verify: `npm run dev` with DevTools throttled to "Fast 4G" shows the overlay with a % that fades out once house.glb loads. `npm test` (116 passed), `npm run build` and `npm run lint` pass, with no lint warnings in the files I touched.

**Open issue:** `QUALITY.dpr.high` in `config.ts` is still 1.75, and `Quality.tsx` calls `setDpr(min(device, QUALITY.dpr[tier]) * current)`. At runtime that can raise DPR above the Canvas cap to 1.75. Fix: set `QUALITY.dpr.high` to 1.5 in `src/data/config.ts` (outside my file list).
