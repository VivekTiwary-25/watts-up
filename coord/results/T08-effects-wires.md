# T08 result: living-house effects + energy wires

**Done:** I built all 8 steps. Everything lives in `src/scene/effects/` and is mounted from `<Effects/>` in `Scene.tsx`. `MainsDriver` mounts first. Each frame it runs `stepMains` (power-cut phase, flicker, eased blackout) and calls `invalidate()`, so `App.tsx` keeps `frameloop="demand"` and I didn't change it. Each effect eases its own 0..1 level with `useLevel(id)` (built on `drive.targetLevel`). There are no React re-renders and no per-frame allocations. Geometries and materials are created once at module level or in `useMemo`. Lights stay mounted all the time and only their intensity changes, so shaders never recompile.
- **Lights** (`Lighting.tsx`): the hemisphere, ambient and sun lights blend between three states (lights on, moonlight, power cut). Each room has a warm point light and an emissive ceiling panel. These replace the static lights and `RoomLights` that were in `Scene.tsx`.
- **Appliances:** `Fan.tsx` (blade cross, eased spin), `Tv.tsx` (emissive screen, `toneMapped={false}`, gentle flicker), `Ac.tsx` (additive haze cone plus a blue bedroom light), `Geyser.tsx` (generated scrolling noise, a static alpha mask, warm additive tint), `Utility.tsx` (status LEDs on the fridge, washer and microwave, microwave window glow, spinning washer drum).
- **Wires** (`EnergyWires.tsx`): a riser from the meter, then one drei `QuadraticBezierLine` per plug, using world units. That is 7 appliances plus 4 room lights. Width is `wireWidth(watts)`. Colour runs cool to hot by watts, and the dashes flow while the appliance is powered. Unpowered wires stay faint at opacity 0.07. They arc over the walls (an existing test checks this).
- **Power cut:** during `flicker`, whatever was on stutters (fast ease) while the house fades to dark. After that only the picks come back, along with their wires. With reduced motion everything snaps and all animation stops.

**Verify:** `npm test` (48 pass, including the new `mains.test.ts` for the flicker → dark → restore sequence) and `npm run build` (passes). Then `npm run dev`: toggle the appliances, then start a Power Cut.

**Open issues:**
- **Not checked visually.** I couldn't open a browser from this sandbox, so all checks are type, test and build only. Please eyeball the haze cone angle, the shimmer and the wire thickness.
- **Result file name:** the task file says `T08-effects.md`; I used this name because the boss prompt asked for it.
- **Grey boxes go dark too early:** `ApplianceBox.tsx` (not my file) uses `isPowered`, so the boxes go dark the moment the flicker starts while my effects are still stuttering. The meter glow in `Scene.tsx` also ignores the blackout.
- **No bloom yet:** `LineMaterial` colours top out at 1, so bloom needs `luminanceThreshold` around 0.65 (R01 §7).
- **Lint:** oxlint shows one warning in `useLevel.ts` because it mutates a `useState` object on purpose.
