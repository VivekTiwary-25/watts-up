# T18 - Integration: models, environment, card during power cut (worker: Vachana, sonnet) - branch `t18-integration`

Files you may touch: `src/scene/Scene.tsx`, `src/scene/glb.ts`, `src/scene/House.tsx` (only to hide grey-box walls/floor when house.glb loaded), `src/ui/ApplianceCard.tsx`, `src/ui/*.test.tsx` (only for ApplianceCard), `coord/results/T18-integration.md`. NOT src/ui/powercut/**, NOT AnimatedNumber/setup.ts (others).

1. Mount `<HouseModel />` and `<Environment />` (both in src/scene, already merged, see docs/MODELS.md) in Scene. When HouseModel actually loaded, hide the grey-box shell (expose an `onLoaded` callback or a tiny state in Scene) - appliance boxes/models stay.
2. `glb.ts` modelUrl uses `APPLIANCE_BY_ID[id].modelFile` instead of `<id>.glb`.
3. R02 finding (Med): during a power cut the ApplianceCard switch must reflect `picks` (label "Keep on inverter", checked = picked, toggling calls `pick`), and outside a cut the normal on/off. Use `HOURS` from config (min/max/step) for the hours slider. Add a test.
4. Confirm frameloop: Canvas is `frameloop="demand"`; make sure fan/TV/wires/geyser animate continuously while anything animated is powered (invalidate in useFrame drivers or switch to "always" when needed) - verify in code and note in result.
Run `npm run format` on touched files. Done = build + tests pass.
