# T24 Lint

- Moved `buttonVariants` to `src/components/ui/button-variants.ts` and stopped exporting it from `button.tsx`. Class strings are unchanged. Callers already import `Button` only.
- `AnimatedNumber` paints the target immediately when reduced motion is on, instead of copying it with `setState` in an effect. The 0.6s count still updates from `animate`'s `onUpdate`.
- Power-cut error text is derived from `pickError` and still dismisses after `POWER_CUT.messageMs`, restarting when `at` changes.
- Clearing `pickError` now hides that toast immediately. The old effect cancelled its timer on cleanup, so the message could stick.
- Files: `src/components/ui/button.tsx`, `src/components/ui/button-variants.ts`, `src/ui/AnimatedNumber.tsx`, `src/ui/powercut/PowerCutOverlay.tsx`.
- Verify: `npm run lint` has no warnings under `src/ui` or `src/components`. `npm test` (104) and `npm run build` pass. Build still warns about chunk size.
- Left `src/scene` `set-state-in-effect` and `immutability` warnings for the other worker.
- Open issues: none in scope.
