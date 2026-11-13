# T20 - Scene polish from live test (worker: Vachana, sonnet) - branch `t20-scene-polish`

Found by boss on the live site. Files you may touch: `src/scene/**`, `src/data/config.ts` (VISUALS only), `coord/results/T20-scene-polish.md`.

1. Living room: the LED ceiling-light placeholder overlaps the ceiling fan box, so clicking the fan picks the lights. Separate them in `layout.ts` (move the light panel off the fan, e.g. towards a wall) in every room where they collide; add a layout test that no two clickable anchors overlap in plan view.
2. Blocked 4th pick during a power cut: flash the clicked appliance red (emissive pulse ~600ms) so the block is visible in 3D, driven by `pickError.at` changing in the store. Reduced motion: static red tint for 600ms.
3. Picked appliances during a cut: add a soft green ring/halo under each picked appliance so players see their 3 choices in the dark house.
Run `npm run format`. Done = build + tests pass.
