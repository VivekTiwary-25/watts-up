# T14 - Realism + adaptive performance (worker: Vachana, opus) - branch `t14-realism`

Skills: `threejs`. Follow `coord/results/R01-research.md` section 7 closely (pass order, NoToneMapping on renderer, N8AO small radius, AccumulativeShadows, PerformanceMonitor + AdaptiveDpr, Bloom threshold ~0.65 so emissives/wires glow). The hover outline already uses `<Selection>/<EffectComposer>` in Scene - there must be ONE EffectComposer total: merge into it.

Files you may touch: `src/App.tsx` (Canvas gl/dpr/shadows props, mount `<LoadingScreen />` only if you guard it so it never sticks when no assets load), `src/scene/Scene.tsx`, `src/scene/PostFX.tsx` (new), `src/scene/Quality.tsx` (new: PerformanceMonitor -> zustand-free local context or small `useQuality` store in `src/scene/quality.ts`), `src/scene/House.tsx` (materials only: subtle roughness variation, floor with slight sheen, warm wood-ish floor colour, skirting), `src/data/config.ts` (only add a `QUALITY` block), `coord/results/T14-realism.md`.

1. PostFX: N8AO -> Bloom (mipmapBlur) -> ToneMapping AgX -> optional Vignette, plus the existing Outline; all inside the single composer. Low quality: AO half-res/off, bloom cheaper, multisampling 0.
2. Shadows: soft shadows that don't re-render every frame (AccumulativeShadows or baked contact shadows); during power cut darkness still reads right.
3. Quality: PerformanceMonitor onDecline -> drop DPR to 1 and AO off; onIncline -> restore; AdaptiveDpr on camera movement.
4. Night sky backdrop: deep navy gradient background + subtle fog so the house floats nicely; stars optional (drei Stars, low count).
5. Materials pass on the grey-box so it already looks premium before real models land (clay-like soft white walls, dark floor, rim light from the meter side).
Done = build + tests pass; result notes the frame-time impact you expect and what the low tier disables.
