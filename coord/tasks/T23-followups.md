# T23 - R03 follow-ups (worker: Vachana, sonnet) - branch `t23-followups`

Files you may touch: `src/store/useHouse.ts`, `src/store/useHouse.test.ts`, `src/scene/**`, `coord/results/T23-followups.md`.

1. Store: `pickError` gains `id: ApplianceId` (the appliance that was refused). PickFeedback flashes `pickError.id` for refused picks from BOTH the 3D scene and the UI overlay; drop `lastScenePick` if no longer needed. Test it.
2. Mobile overview: on portrait (aspect < 1), overview camera should frame the whole house without going into the fog: rotate the overview to look along the house's long axis and/or reduce fog for portrait, and raise the camera. Use the same `fitShot` helper; add a test for aspect 9:19.5.
Run `npm run format`. Done = build + tests pass.
