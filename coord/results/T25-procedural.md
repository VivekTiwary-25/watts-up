# T25 procedural appliances — result
- Replaced the grey placeholder box with recognisable clay primitives per appliance: fridge, split AC (rounded, louvres), TV (panel + bracket), ceiling fan (rod, housing), round LED panel, washer (ring + control strip), geyser (cylinder + pipes), microwave (window recess + keypad).
- Files: `src/scene/placeholders/*` (kit.tsx = shared unit geometries + per-instance materials hook, one component per appliance, index.tsx map), `src/scene/ApplianceBox.tsx` (renders model in a `name={id}` group + invisible anchor-sized hit box; powered/standby emissive kept), `src/scene/effects/Fan.tsx` (3 blades below the housing), `src/scene/effects/Lighting.tsx` (round glow disc).
- Anchor sizes unchanged; effect planes (TV screen, microwave window, washer door, LED) still sit on the front faces. GLB still replaces the placeholder via ApplianceModel fallback.
- Verify: `npm test`, `npm run build` pass; run `npm run dev` and look at each room.
- Open: not visually checked in a browser; the Light and Fan models share only unit meshes, draw calls ≈ 5–9 per appliance (no merging). Fan/AC/Geyser part colours are only tinted by state, not per-id.
