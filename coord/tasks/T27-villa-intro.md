# T27 - Villa exterior intro (worker: Vachana fable) - branch `t27-villa-intro` - HARD STOP 18:34

Files you may touch: `src/scene/HouseModel.tsx`, `src/scene/Scene.tsx` (only to mount your component),
new `src/scene/IntroVilla.tsx`, `coord/results/T27-villa-intro.md`. Nothing else.

Goal: while `useHouse((s) => s.view) === 'intro'`, show the villa `/models/house.glb` (Meshopt GLB, drei
useGLTF decodes it) from outside; when the user clicks "Step inside" (view becomes 'overview') the villa
is unmounted/hidden and the existing clay rooms scene is shown exactly as today.
- Put it FAR from the rooms so they never overlap: e.g. group at position [0, 0, -80]? NO - simpler: while
  intro, hide nothing else but render the villa and point the intro camera at it. The intro camera lives in
  `src/scene/layout.ts` (INTRO_CAMERA) which you may NOT edit, so instead place the villa so that it is
  framed by the existing intro camera: camera at [0,1.7,19] looking at [0,1.2,0], drifting x 0..1.2.
  Fit the villa by bounding box to ~30 m wide (x), centre it at x=0, z=-14, bottom at y=-0.5 so it reads
  as a big house behind the clay rooms; hide the clay rooms during intro is NOT required.
  Actually simplest acceptable result: villa visible behind/around during intro only, looks intentional.
- Add drei `<Sky sunPosition={[100, 6, -100]} />` + `<Environment preset="sunset" />` ONLY during intro
  (inside IntroVilla), plus a large ground plane (circle r=120, dark green-grey) under the villa.
- Keep performance sane: villa meshes castShadow=false, receiveShadow=false.
- Must not break: `npm test`, `npm run build`, and the 3 judge checks (toggle -> bill, target ring, Power Cut).
Commit small steps yourself. If it does not look clean by 18:32, commit nothing more and write the result file
saying "dropped". Finish with coord/results/T27-villa-intro.md, commit, exit.
