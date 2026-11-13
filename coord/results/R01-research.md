# R01 — fiber v9 + drei v10 + postprocessing v3

Pin one `three` (0.170–0.180). fiber 9 needs React 19. postprocessing 3 is WebGL-only — do not import Canvas from fiber v10 (that default is WebGPU). `npm ls three` must be one copy; Vite `resolve.dedupe: ['three']`.

## 1. Hover glow — postprocessing Outline, not `<Outlines>`

`<Outlines>` is an inverted-hull extra mesh: cheap, but a hard shell, not a glow, and it breaks on non-watertight GLB shells. The composer is already paid for. Enable `Select` only on the hovered appliance; `<Select exclude>` on transparent haze. One mask render + a small blur — do not outline the house. Without `autoClear={false}` the outline never draws. Don't touch `camera.layers`; `Select` uses layer 10.

```tsx
<Selection>
  <EffectComposer autoClear={false} multisampling={0}>
    <Outline blur edgeStrength={8} visibleEdgeColor={0x9dffce} hiddenEdgeColor={0x14382a} xRay={false} />
  </EffectComposer>
  <Select enabled={hovered === id}><mesh /></Select>
</Selection>
```

## 2. Camera — `CameraControls.setLookAt`

It owns position and target and spherical-lerps. gsap on `camera.position` + `OrbitControls.target` fights the next drag and double-fires under StrictMode unless `gsap.context().revert()`. drei ≥10.5 is camera-controls v3; the signature is unchanged. `smoothTime` (default 0.25) is the duration. `makeDefault` so nothing else grabs `state.controls`. Don't also mount `OrbitControls`.

```tsx
const ref = useRef<CameraControls>(null)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
<CameraControls ref={ref} makeDefault smoothTime={0.6} />
ref.current?.setLookAt(x, y, z, tx, ty, tz, !reduce) // Promise
```

## 3. GLB + fallback

Vite dev/preview returns `index.html` (`200`, `text/html`) for a missing `public/models/x.glb`. `useGLTF` then throws and **caches the rejection** until `useGLTF.clear(url)`. Probe before mounting the hook. Boundary wraps Suspense, not the other way around. Cached scene is shared — `clone()` before a second appliance uses the same file.

```tsx
export async function glbExists(url: string) {
  const res = await fetch(url, { method: 'HEAD' })
  if (!res.ok) return false
  return !(res.headers.get('content-type') ?? '').includes('text/html')
}
// if (!ok) <BoxPlaceholder />; else
<ErrBoundary fallback={<BoxPlaceholder />}>
  <Suspense fallback={null}><Model url={url} /></Suspense>
</ErrBoundary>
// if (!ok) placeholder; else <ErrBoundary><Suspense><Model url={url} /></Suspense></ErrBoundary>
```

## 4. Hide roof / ceiling

Name first, bbox second. Token match so `tabletop` survives and a node named `top` does not. A wall that reaches the ceiling is tall; only hide a thin slab in the top band. `visible = false` — don't dispose. glTF is Y-up. Once, in `useLayoutEffect`.

```tsx
export function hideShell(root: THREE.Object3D) {
  root.updateWorldMatrix(true, true)
  const house = new THREE.Box3().setFromObject(root)
  const h = house.max.y - house.min.y
  const yCut = house.min.y + h * 0.78
  const b = new THREE.Box3()
  root.traverse((o) => {
    if (/(^|[^a-z])(roof|ceiling|ceil|attic|soffit|top)([^a-z]|$)/i.test(o.name)) { o.visible = false; return }
    if (!(o instanceof THREE.Mesh)) return
    b.setFromObject(o)
    if (b.max.y - b.min.y < h * 0.12 && b.min.y >= yCut) o.visible = false
  })
}
```

## 5. Wires — `QuadraticBezierLine`

Not `TubeGeometry` (rebuilds when watts change) and not `THREE.Line` (linewidth is 1px). drei's line is `Line2`: `worldUnits` makes `lineWidth` world thickness, `dashOffset` is a uniform. 8 wires is nothing. `LineMaterial` colors stay in 0–1, so Bloom `luminanceThreshold={1}` will not catch them — use ~0.65 (§7).

```tsx
const ref = useRef<Line2>(null)
useFrame((_, dt) => {
  const m = ref.current?.material as THREE.LineMaterial | undefined
  if (m && !reduce) m.dashOffset -= dt * 0.5
})
<QuadraticBezierLine ref={ref} start={meter} end={plug} worldUnits dashed dashScale={6}
  lineWidth={0.008 + watts / 12000} color="#b6ffe0" transparent opacity={on ? 0.95 : 0.12} depthWrite={false} />
```

## 6. Cheap motion

- Fan: `useFrame` on the **blade** only, `ref.rotation.y += dt * (on && !reduce ? 14 : 0)`. Not gsap.
- TV screen: `emissive="#cfe" emissiveIntensity={on ? 2.5 : 0} toneMapped={false}`. Not the bezel.
- AC haze: cone/plane, `meshBasicMaterial` `transparent` `opacity={0.12}` `blending={AdditiveBlending}` `depthWrite={false}` `color="#9cf"`. `<Select exclude>`.
- Geyser: one plane, `map.wrapS = map.wrapT = RepeatWrapping`, `map.offset.y += dt * 0.08`. No fullscreen distortion pass.

## 7. Near-photoreal

Pass order = JSX order: AO, bloom, tone map. Renderer `NoToneMapping` or you clamp before bloom and tone-map twice. `N8AO` does not want `enableNormalPass` (that is SSAO, an extra full render). Default `aoRadius={5}` is too big for a room. Prefer `AccumulativeShadows` (bakes, then stops) over live `SoftShadows`: on current three, `SoftShadows` forces `BasicShadowMap` and dispose-walks every material. `AdaptiveDpr` drops only while `performance.regress()` is active — `CameraControls` has no `regress` prop, call it from `onControl`. `PerformanceMonitor` is the sustained-fps path. Keep AgX; ACES is `ToneMappingMode.ACES_FILMIC`. TV still needs `toneMapped={false}`.

```tsx
<Canvas shadows dpr={[1, 1.75]} performance={{ min: 0.5 }}
  gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}>
  <AccumulativeShadows temporal frames={40} alphaTest={0.8} scale={12} position={[0, 0.01, 0]}>
    <RandomizedLight amount={6} radius={4} position={[4, 8, 2]} />
  </AccumulativeShadows>
  <PerformanceMonitor bounds={(hz) => (hz > 90 ? [50, 90] : [40, 58])} flipflops={3}
    onDecline={() => setLow(true)} onFallback={() => setLow(true)} />
```tsx
<Canvas shadows dpr={[1, 1.75]} performance={{ min: 0.5 }} gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}>
  <AccumulativeShadows temporal frames={40} alphaTest={0.8} scale={12} position={[0, 0.01, 0]}>
    <RandomizedLight amount={6} radius={4} position={[4, 8, 2]} />
  </AccumulativeShadows>
  <PerformanceMonitor bounds={(hz) => (hz > 90 ? [50, 90] : [40, 58])} flipflops={3} onDecline={() => setLow(true)} onFallback={() => setLow(true)} />
  <AdaptiveDpr pixelated />
  <EffectComposer multisampling={low ? 0 : 2} autoClear={false}>
    <N8AO aoRadius={0.5} intensity={1} quality={low ? 'performance' : 'medium'} halfRes={low} />
    <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.65} luminanceSmoothing={0.2} />
    <ToneMapping mode={ToneMappingMode.AGX} />
  </EffectComposer>
</Canvas>
```
npx @gltf-transform/cli webp t1.glb t2.glb
npx @gltf-transform/cli meshopt t2.glb out.glb --level medium
```

One-shot that keeps names: `optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify false --join false --flatten false`.

## 9. Gotchas

- fiber 9 inherits React 19 StrictMode. Effects run twice in dev. Kill gsap via `gsap.context`. `useFrame` is unsubscribed on unmount; don't add your own listener.
- v9 dropped auto sRGB on texture props. Built-in materials are fine. A custom shimmer shader must set `map.colorSpace = THREE.SRGBColorSpace` or albedo goes dark. Normal/roughness stay linear.
- Types: `ThreeElements['mesh']`, not `MeshProps`. Augment `declare module '@react-three/fiber'`. Do not install `@types/three`.
- Two `three` copies → black composer and broken `instanceof`. A second `EffectComposer` takes the frame; the first goes black.
- Stay on fiber v9 WebGL. postprocessing does not run on v10's default `WebGPURenderer`.
