# T09 Intro

- Added a low exterior night camera shot with a slow ping-pong lateral drift.
- Camera input is disabled during intro; leaving intro smoothly swoops to overview.
- Added the glass “Watt's Up?” intro card with click and Enter activation.
- HUD panels fade out during intro and return after entry.
- Reduced motion keeps the camera static and removes overlay transitions.
- Files: `src/scene/layout.ts`, `src/scene/CameraRig.tsx`, `src/ui/IntroOverlay.tsx`, `src/ui/HUD.tsx`.
- Verification: `npm test` (37 passed) and `npm run build` passed.
- Open issue: production build reports existing large JavaScript chunk warnings.
