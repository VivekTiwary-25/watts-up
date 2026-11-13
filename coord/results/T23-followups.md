# T23 follow-ups — result

- Store: `pickError` is now `{ id, message, at }` (id = the refused appliance). `PickFeedback` flashes `pickError.id` for refused picks from the 3D scene and the UI overlay; `lastScenePick` is removed. Test added in `useHouse.test.ts`.
- Portrait overview: `overviewShot(aspect)` in `layout.ts` (landscape unchanged). Below aspect 1 it uses `OVERVIEW_PORTRAIT` (camera west, high, looking along the short axis, centred on the appliances) through `fitShot`, which gained an optional `refAspect` arg. Camera distance is about 27 (fog starts at 20), so no fog change was needed.
- `CameraRig.tsx` uses `overviewShot`. Tests in `framing.test.ts`: 9:19.5 and 3:4 frame every appliance, none behind walls, distance under fog near + 8.
- Files: useHouse.ts/.test.ts, scene/{PickFeedback, useApplianceInteraction(.test), CameraRig, layout, framing.test}. Outside the list: `src/ui/powercut/PowerCutOverlay.test.tsx` only got `id` added to fixtures (the build failed type-checking without it).
- Verify: `npm test` (107 pass), `npm run build` OK.
- Open: at distance ~27 the far edge has slight fog haze; raise `fog.near` in config.ts if unwanted (not my file).
