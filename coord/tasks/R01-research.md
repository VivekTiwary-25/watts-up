# R01 — Tech research (worker: Grok) · no branch, write one file only

Write `coord/results/R01-research.md` (max ~120 lines, concrete code snippets, no fluff). Do NOT edit other files, do NOT commit.
Answer for: React 19 + Vite + TypeScript + three + @react-three/fiber v9 + @react-three/drei v10 + @react-three/postprocessing v3.

1. Hover outline glow on a mesh: best option (drei `<Outlines>` vs postprocessing `<Selection>/<Select>/<Outline>`), snippet, perf notes.
2. Camera fly-to with gsap animating camera position + OrbitControls/CameraControls target; drei `CameraControls.setLookAt(..., true)` alternative. Recommend one, snippet.
3. GLB loader with fallback: `useGLTF` inside ErrorBoundary + Suspense, plus HEAD-check `public/models/x.glb` existence before loading (Vite dev server returns index.html for missing files → detect via content-type). Snippet.
4. Hiding roof/ceiling meshes in a loaded house.glb by name heuristics (roof, ceiling, top) + by bounding-box height. Snippet.
5. Energy wires: animated glowing tube/line from meter to appliance whose thickness ∝ watts (drei `QuadraticBezierLine` / `MeshLine` / TubeGeometry + dashOffset). Recommend, snippet.
6. Effects: fan spin (useFrame), TV emissive glow, AC blue haze (transparent cone/sprite + additive), geyser heat shimmer (cheap shader or sprite wobble). Cheap approaches only.
7. Postprocessing stack for "near-photoreal": Bloom (selective via emissive + luminanceThreshold), N8AO, ToneMapping ACES/AgX, SoftShadows / AccumulativeShadows; drei `PerformanceMonitor` + `AdaptiveDpr` pattern to drop quality.
8. gltf-transform CLI one-liners to Draco/Meshopt-compress + resize textures to 1k webp, and how to load Meshopt/Draco with useGLTF.
9. Known version gotchas for this exact stack (peer deps, StrictMode double effects, postprocessing + R3F v9).
