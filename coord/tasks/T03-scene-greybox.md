# T03 — 3D grey-box house + interaction (worker: Vachana Claude) · branch `t03-scene`

Skills: use `threejs` and `gsap-react`. Read `coord/results/R01-research.md` sections 1-3 first (hover outline via postprocessing Selection/Outline, CameraControls.setLookAt, GLB probe + fallback) and follow them; ignore its "don't install @types/three" line. Build the dollhouse scene with placeholders. Code against the store API in `coord/CONTRACT.md` (Store). T02 is building the store in parallel: create a TEMPORARY stub `src/store/useHouse.ts` matching the contract exactly only if it doesn't exist, and note in your result that it must be replaced by T02's version at merge (boss will take T02's file).

Files you may touch: `src/scene/**` (new), `src/App.tsx` (only to mount `<Scene />` in the Canvas area), `src/store/useHouse.ts` (stub only), `coord/results/T03-scene.md`.

Build:
1. `src/scene/layout.ts` — single source of positions: 4 rooms on a ~12×10 floor plan (living, kitchen, bedroom, bathroom), each room {id, center, size, cameraPos, cameraTarget}; appliance anchors {id → room, position, size of placeholder box}; `light` has one anchor per room; `meter` position on an outer wall. Overview camera pos/target.
2. `src/scene/House.tsx` — floor, walls ~2.6m high with door gaps, NO roof. Charcoal/greyish materials, soft directional + ambient light, contact shadows.
3. `src/scene/ApplianceBox.tsx` — placeholder box per appliance, `name={id}`; hover (pointer over/out → setHovered, cursor pointer; on touch, first tap = hover/select, second tap = toggle), click → `toggle(id)` (or `pick(id)` while powerCut !== 'off'), `select(id)`. Hover glow: drei `<Outlines>` (thick, cyan-ish) on hovered/selected. On = emissive tint, off = dull. Use `isPowered` for visual state.
4. `src/scene/ApplianceModel.tsx` — wrapper choosing model vs box: HEAD/GET check `/models/<modelFile>` (treat content-type text/html as missing), if present `useGLTF` inside Suspense + ErrorBoundary that falls back to `ApplianceBox`; scale model to fit its anchor box. Clicking/hover must work on either.
5. `src/scene/CameraRig.tsx` — drei `CameraControls`; on `view`/`focusRoom` change animate `setLookAt(..., true)` to overview or room camera; clamp polar angle so you never go under the floor; reduced-motion → instant.
6. Clicking empty floor of a room in overview → `goToRoom(room)`.
7. `src/scene/Scene.tsx` composes everything. Light helpers: when light is on, each room gets a warm pointLight.
Commit after each numbered step (feat(scene): ...). Done = build passes, you can hover/click boxes, room fly-in works. Write result file.
