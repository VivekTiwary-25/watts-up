# T13 - Model pipeline + house loader (worker: Codex Luna) - branch `t13-models`

Real models will land later in `public/models/` (fan.glb ac.glb fridge.glb tv.glb light.glb washer.glb geyser.glb microwave.glb house.glb + one .hdr). Prepare everything so dropping them in just works. Read `coord/results/R01-research.md` sections 3, 4, 7, 8.

Files you may touch (new files only): `scripts/optimize-models.mjs`, `src/scene/HouseModel.tsx`, `src/scene/hideShell.ts`, `src/scene/hideShell.test.ts`, `src/scene/Environment.tsx`, `docs/MODELS.md`, `coord/results/T13-models.md`. Do NOT edit existing files (boss wires them in).

1. `scripts/optimize-models.mjs` (node, no new deps; shells out to `npx -y @gltf-transform/cli@4`): for each `public/models/raw/*.glb` -> `public/models/<name>.glb` using `optimize --compress meshopt --texture-compress webp --texture-size 1024 --simplify false --join false --flatten false`; prints before/after sizes and total. Copies `raw/*.hdr` through (or resizes if a tool is available; otherwise just copies and warns if > 3 MB).
2. `hideShell.ts`: `hideShell(root)` from R01 section 4 (name tokens + thin top-slab bbox) returning the list of hidden node names; unit test with a small synthetic THREE scene (roof mesh hidden, tabletop kept, tall wall kept).
3. `HouseModel.tsx`: probes `/models/house.glb` (reuse `glbExists` from `src/scene/glb.ts` - import, don't edit), loads with useGLTF inside ErrorBoundary + Suspense, clones, calls hideShell once, enables cast/receive shadows, fits it to the 12x10 footprint (scale + center). Returns null if missing/failed (so the grey-box House stays).
4. `Environment.tsx`: if any `/models/*.hdr` exists (probe a fixed name `/models/env.hdr`), drei `<Environment files=... background={false} environmentIntensity={0.6} />`; else drei `<Environment preset="night" />` fallback (bundled presets fetch from a CDN - if that is the case, instead use a local `<Lightformer>` rig, no network).
5. `docs/MODELS.md`: drop-in instructions for the team (names, raw folder, run `node scripts/optimize-models.mjs`, size budget: total < 15 MB, credits sheet to README).
Done = build + tests pass.
