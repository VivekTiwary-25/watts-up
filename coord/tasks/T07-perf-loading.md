# T07 - Bundle split + loading screen (worker: Codex Sol) - branch `t07-perf-loading`

Files you may touch: `vite.config.ts` (build + resolve only), `src/ui/LoadingScreen.tsx` (new), `src/main.tsx`, `index.html` (title, meta description, theme-color, inline SVG favicon), `coord/results/T07-perf-loading.md`.

1. vite.config.ts: `resolve.dedupe: ['three']`; `build.rolldownOptions.output` (or rollupOptions if that's what Vite 8 accepts) manual chunking so `three`, `@react-three/*`+`postprocessing`, and `motion`/`gsap` land in separate vendor chunks; raise chunkSizeWarningLimit only for the three chunk if still needed. Verify with `npm run build` output sizes and put before/after sizes in the result.
2. `src/ui/LoadingScreen.tsx`: full-screen navy overlay with app name "Watt's Up?", a thin glowing progress bar driven by drei `useProgress()` (works outside Canvas), fades out (motion) when `active` is false and progress 100; reduced-motion = no fade. Export it; boss mounts it in App.
3. index.html: title "Watt's Up? - Interactive Home Energy Bill", meta description, `theme-color` #0b1020, inline SVG lightning favicon (data URI), `lang="en"`.
Done = build + tests pass.
