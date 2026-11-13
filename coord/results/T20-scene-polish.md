# T20 scene polish — result
- Living-room ceiling light moved off the fan (`LIGHT_OFFSET` in `src/scene/layout.ts`); other rooms had no collision.
- Added a rotation-aware plan-view overlap test for all clickable anchors (`layout.test.ts`).
- New `src/scene/PickFeedback.tsx` (mounted in `Scene.tsx`): red pulse overlay ~600ms on the clicked appliance when `pickError.at` changes (static red tint under reduced motion); soft green ring on the floor under each picked appliance while a power cut is active.
- Tunables in `VISUALS.pick` (`config.ts`).
- Verify: `npm test` and `npm run build` pass (88 tests). In the browser: start Power Cut, pick 3, click a 4th -> red flash; picks show green rings.
- Open: the flashed appliance is read from `selected` after the click handler; the flash is a box overlay, not true material emissive (works for GLB and boxes alike). Not visually checked in a browser.
