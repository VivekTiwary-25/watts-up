# T27 - Villa exterior intro - result

Status: implemented, NOT visually verified in a browser (ran out of time before the 18:34 stop).

What I did
- New `src/scene/IntroVilla.tsx`: renders only while `view === 'intro'`, returns null otherwise.
  Loads `/models/house.glb`, fits it by bounding box to 30 m wide, centred x=0, z=-14, bottom y=-0.5.
  Adds drei `<Sky sunPosition={[100, 6, -100]} />`, `<Environment preset="sunset" />` and a
  r=120 dark green-grey ground circle. Villa meshes castShadow/receiveShadow = false.
- Villa materials and ground have `fog = false` (scene fog ends at 52 m and would wash them out).
- `src/scene/Scene.tsx`: one import + `<IntroVilla />` mounted after `<RimLight />`.
- `src/scene/HouseModel.tsx`: untouched (still unmounted).

Verify
- `npm test` (116 passed) and `npm run build` pass.
- `npm run dev`: villa + sky behind the clay rooms on the intro; click "Step inside" -> villa, sky and
  sunset environment unmount, rooms scene as before.

Open issues
- Please eyeball the intro before merging: framing, sky brightness through PostFX tone mapping, and
  whether the sunset environment visibly tints the clay rooms during the intro.
- `preset="sunset"` fetches its HDR from drei's CDN (task asked for it); offline it fails silently
  behind an error boundary. Rule 5 purists may want a local HDR instead.
- After leaving the intro, the scene environment should fall back to the existing `./Environment`;
  not confirmed in a browser.
- Only 3 code commits instead of 6-12, due to the time limit.
