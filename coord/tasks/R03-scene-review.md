# R03 - Opus review + fixes of the 3D scene (worker: Vachana, opus) - branch `r03-scene-review`

Independent review of `src/scene/**` (you wrote much of it; review as if you didn't). Fix HIGH/MED issues directly in `src/scene/**` (+ tests); list anything outside src/scene in the result for the boss. Do not touch src/ui/** (other workers).

Look for: per-frame allocations in useFrame, materials/geometries not shared or not disposed, effects running after unmount, StrictMode double-mount issues, draw-call count (merge static wall meshes if cheap), shadow cost, raycast cost (only appliance meshes should be raycast targets; walls/wires/haze should not block or be raycast), hover flicker when moving between overlapping meshes, touch: first tap select / second toggle works with drags ignored, room fly-in framing for each room (are appliances visible when inside each room?), power-cut darkness readable, frameloop demand + invalidation correctness.
Write `coord/results/R03-scene-review.md`: table severity | file:line | issue | fixed? Then commit fixes in small steps. Run `npm run format`. Done = build + tests pass.
