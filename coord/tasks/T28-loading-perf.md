# T28 - Loading screen + perf caps (worker: Vachana opus) - branch `t28-loading-perf` - stop 19:15

Files you may touch: `src/App.tsx`, `src/ui/LoadingScreen.tsx`, `coord/results/T28-loading-perf.md`. Nothing else.

1. Mount `LoadingScreen` (already written, uses drei `useProgress`) in `App.tsx` above the HUD so it shows
   while the GLB models load (the villa house.glb is ~50 MB). Guard it so it can NEVER stick:
   - hide once `!active && progress === 100`, OR once `!active` has held for 1.5 s after at least one item loaded,
   - hard fallback: hide after 45 s no matter what,
   - if nothing starts loading within 3 s, hide.
   Keep reduced-motion handling. Show "Loading the villa… NN%" style text, glass look consistent with the app.
2. Perf for a weak laptop GPU (RTX 2050): in `App.tsx` Canvas, keep `dpr` capped (max 1.5), keep
   `powerPreference: 'high-performance'`; do NOT touch PerformanceMonitor (lives in src/scene/Quality.tsx).
3. `npm test`, `npm run build`, `npm run lint` must pass. Small commits. Finish with the result file, commit, exit.
