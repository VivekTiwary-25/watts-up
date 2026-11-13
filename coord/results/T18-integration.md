# T18 integration — result

- Scene now mounts `<Environment />` and `<HouseModel />`. Scene probes `/models/house.glb` with `glbExists` and passes `hideShell` to `House`, which returns null once the file exists. Appliance boxes and models stay. `HouseModel.tsx` was outside my file list, so there is no `onLoaded` callback. The shell hides when the file exists, not when parsing succeeds. If house.glb is corrupt, `HouseModel`'s error boundary renders nothing and the shell is already hidden.
- `glb.ts`: `modelUrl` uses `APPLIANCE_BY_ID[id].modelFile`.
- `ApplianceCard`: during a power cut the switch reads "Keep on inverter", is checked when the appliance is picked, and calls `pick`. Outside a cut it keeps the normal on/off and `toggle`. The hours slider uses `HOURS` min/max/step. Note that `pick` only acts in the `choosing` phase.
- Test added in `src/ui/ui-behavior.test.tsx` (picks switch during a cut).
- Frameloop (code check only, not run in a browser): the Canvas is `frameloop="demand"`. `MainsDriver` calls `invalidate()` every frame unless reduced motion is on, and on every store change. So fan, TV, wires and geyser keep animating while motion is allowed. With reduced motion, frames render only on store changes, so the effects snap to their state and don't animate continuously. No change was needed.
- Files: `src/scene/{Scene,glb,House}.tsx/.ts`, `src/ui/ApplianceCard.tsx`, `src/ui/ui-behavior.test.tsx`.
- Verify: `npm test` (70 pass) and `npm run build` pass. `npm run dev`, then check the shell hides once `public/models/house.glb` is present.
- Open: an `onLoaded` callback in `HouseModel` would be more exact than the existence probe.
