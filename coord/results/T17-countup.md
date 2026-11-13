# T17 Countup

- Animated values tween over 0.6 seconds with an ease-out curve and stop when unmounted.
- Reduced-motion users see totals update instantly.
- Existing polite bill announcement still uses the final `bill.total` value.
- Updated behavior tests to wait for final animated values; added deterministic reduced-motion setup.
- Files: `src/ui/AnimatedNumber.tsx`, `src/test/setup.ts`, `src/ui/ui-behavior.test.tsx`.
- Verify: `npm test` and `npm run build` (both pass).
- Build reports the existing large chunk advisory.
- Commits were not created because the sandbox cannot write `.git`; sequence is in `coord/results/T17-countup.commits`.
