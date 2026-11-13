# T09 - Intro shot + "Step inside" (worker: Codex Luna) - branch `t09-intro`

Implement now; don't run skill workflows. Store has `view: 'intro' | 'overview' | 'room'` (`src/store/useHouse.ts`, currently initial view may be 'overview').

Files you may touch: `src/scene/CameraRig.tsx`, `src/scene/layout.ts` (add `INTRO_CAMERA` start/end pos+target only), `src/store/useHouse.ts` (ONLY change initial `view` to 'intro'; update any test expecting otherwise), `src/ui/IntroOverlay.tsx` (new), `src/ui/HUD.tsx` (hide panels while view==='intro', mount IntroOverlay), `coord/results/T09-intro.md`.

1. layout.ts: INTRO_CAMERA = low exterior night shot from outside the front of the house (eye height ~1.7m, ~14m away), slow drift path (start -> end, small lateral move).
2. CameraRig: when view==='intro', place camera at intro start and drift slowly toward intro end over ~20s, looping ping-pong (useFrame, no gsap needed; reduced motion = static). User camera input disabled during intro. On leaving intro -> fly up into the overview with `setLookAt(..., true)` using a slower smoothTime (~1.2s) for a cinematic swoop.
3. IntroOverlay: centered glass card at bottom third: title "Watt's Up?", one-line pitch "Flip switches in a living house and watch your electricity bill react.", big clay button "Step inside" -> setView('overview'). Fades out with motion. Enter key works. Respect reduced motion.
4. HUD: panels hidden (animate out) while intro.
Done = build + tests pass.
