# T25 - Recognisable procedural appliances (worker: Vachana, sonnet) - branch `t25-procedural`

Real GLBs may never arrive. Make the placeholder boxes look like their appliances using simple three primitives (no assets, no new deps), stylised clay look matching the house (soft whites, charcoal, subtle metal), keeping the same anchor sizes, names (`name={id}`), hit targets, outline/hover, power-state emissive and effects hooks.

Files you may touch: `src/scene/placeholders/**` (new: one component per appliance), `src/scene/ApplianceBox.tsx` (render the procedural model instead of a plain box), `src/scene/effects/**` (only to align effect positions with the new shapes, e.g. TV screen plane, microwave window, washer drum, fan blades), `src/data/config.ts` (VISUALS only), `coord/results/T25-procedural.md`.

Shapes: fridge (tall body, two doors split line, handles), Split AC (wall unit with rounded edges and louvre slats), TV (thin panel + stand or wall mount, screen inset), ceiling fan (hub + 3 blades + rod, blades are the spinning group), LED light (round ceiling panel), washing machine (box with round door/drum window + control strip), geyser (wall cylinder with pipes), microwave (box with window + keypad). Share geometries/materials; merge where cheap; keep draw calls low. Ensure GLB, when present, still replaces the placeholder (ApplianceModel fallback path).
Run `npm run format` on touched files only. Done = build + tests pass.
