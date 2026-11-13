# R03 — scene review + fixes (branch `r03-scene-review`)

Reviewed all of `src/scene/**`, fixed every HIGH/MED issue in scene files and added tests for them.
To check: `npm test` (104 pass, new: `framing`, `mergeBoxes`, `useApplianceInteraction`, `useDispose`) and `npm run build` (passes).

| Sev | file:line | issue | fixed? |
| --- | --- | --- | --- |
| HIGH | layout.ts (tv anchor) | TV sat against the front wall facing away, so the wall hid it in overview and in living-room view (and blocked clicks on it) | yes: moved to the living↔bedroom wall facing the camera; `framing.test` checks it |
| HIGH | layout.ts (washer anchor) | The kitchen/bathroom wall hid the washer in overview | yes: moved to z=-3 |
| MED | House.tsx walls | 28 wall/skirting meshes (28 draw calls, plus shadow pass); walls had `onClick` so they were raycast and blocked clicks | yes: merged into 4 meshes with `raycast` turned off (`mergeBoxes.ts`) |
| MED | House.tsx + HouseModel | Once `house.glb` loads, `House` returned null, so the floors went and overview room clicks stopped working | yes: invisible floor click targets stay |
| MED | ApplianceModel.tsx | GLB appliances were raycast against every triangle on each pointer move | yes: GLB meshes `raycast` turned off, plus an invisible unit-box hit target (material.visible=false, so no outline or shadow) |
| MED | PickFeedback.tsx:~88 | Red "blocked" flash used `selected`, so a refused pick from the UI overlay flashed the wrong appliance | yes: uses `lastScenePick` (3D clicks only) |
| MED | CameraRig/PickFeedback useFrame | `window.matchMedia()` was called every frame (new object each frame) | yes: use the cached `MOTION.reduce` |
| MED | ApplianceBox.tsx | In a power cut, unpicked grey boxes went near-black (hemi 0.06, ambient 0.02), so they were hard to find and pick | yes: faint cool standby emissive while the cut is on |
| MED | CameraRig + layout `fitShot` | On portrait phones/tablets the room shots cut off appliances (light, fridge, washer) | yes: camera pulls back by up to 2.6x when aspect < 1.5; tested at 9:19.5 and 3:4 |
| LOW | effects/Tv, Ac, Geyser, Lighting, Utility | Materials, geometry and textures made in `useMemo` were never disposed | yes: `useDispose` hook |
| LOW | ApplianceModel/HouseModel | Shadow maps are cached, so a model that loads late only shows up in shadows after the 1 s refresh | yes: `markShadowsDirty` on load |
| LOW | MainsDriver.tsx:19 | `frameloop="demand"` still renders every frame whenever motion is allowed. The default state always animates (fan, wires), and idling would make TierMonitor drop the quality tier | no, kept on purpose. Reduced motion renders only on demand and was checked: AccumulativeShadows and R3F mount/unmount invalidate themselves |
| LOW | Overview shot on portrait | Overview cuts off the house sides on phones; pulling back would push it into the fog (near 20) | no. Boss: decide whether overview should rotate or zoom on mobile |
| LOW | CameraRig intro useFrame | `setLookAt` returns a Promise every frame (small GC churn) | no (only during intro) |
| OK | hover/touch | Out-then-over order means no cursor flicker; GLB children share one event id; first tap selects, second toggles; drags over 6px ignored | already correct; now covered by tests |
| OK | StrictMode | Effects clean up (subs, timers, keydown, shadow autoUpdate); a dispose followed by reuse re-uploads safely | — |

Outside src/scene, for the boss: add `id` to `pickError` in the store so the scene can flash blocked picks made from the UI too. `oxlint` has 9 old `react(immutability)`/`set-state-in-effect` warnings in scene effects (R3F mutation pattern), and none of them are new.
