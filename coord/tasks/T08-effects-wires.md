# T08 - Living-house effects + energy wires (worker: Vachana, opus) - branch `t08-effects`

Skills: `threejs`. Read `coord/results/R01-research.md` sections 5-7 and follow them. Positions come from `src/scene/layout.ts`; state from `@/store/useHouse` (`isPowered(state, id)` decides if something is running; during a power cut only the 3 picks run).

Files you may touch: `src/scene/effects/**` (new), `src/scene/Scene.tsx` (mount effects), `src/scene/House.tsx` (only light/darkness changes), `src/scene/layout.ts` (add wire/plug points only), `src/App.tsx` (only `frameloop` -> "always" or add invalidation), `src/data/config.ts` (only add a `VISUALS` block of tunables: colors, intensities, wire width per watt), `coord/results/T08-effects.md`.

Build, commit after each:
1. Room lights: when `light` is powered, each room gets warm light + light boxes emissive; when off, rooms dim to a cool moonlight ambient. Smooth intensity lerp in useFrame (instant if reduced motion).
2. Fan: blade group spins (placeholder: a thin cross of boxes above the fan box), speed eases up/down.
3. TV: screen plane emissive glow, subtle flicker of intensity, toneMapped={false}.
4. AC: cool blue additive haze cone/plane in front of AC + faint blue point light in bedroom.
5. Geyser: heat shimmer - animated additive plane with scrolling noise texture (canvas-generated), warm tint.
6. Fridge/washer/microwave: small status LED + microwave interior glow, washer drum rotation.
7. Energy wires (`EnergyWires.tsx`): from the meter to each powered appliance (one per room for light), drei `QuadraticBezierLine` worldUnits, dashed + flowing dashOffset, lineWidth ∝ watts (from config), color glow; unpowered = hidden or faint. Wires arc over walls (control point raised).
8. Power cut: phase 'flicker' -> whole house lights flicker then go dark (ambient near 0, everything off except picks); picked appliances light back up and their wire returns.
Performance: no per-frame allocations, share geometries/materials, all animation stops when reduced motion.
Done = build + tests pass; describe what you saw/verified in the result.
