# T17 - Counting rupee total (worker: Codex Luna) - branch `t17-countup`

Brief requires: "Bill panel: animated rupee total that counts up/down". Current `src/ui/AnimatedNumber.tsx` renders the value instantly (no animation). A draft that counts with motion's `animate()` is in `coord/tasks/T17-countup.patch` (apply it with `git apply`, or reimplement). With it, 2 tests in `src/ui/ui-behavior.test.tsx` fail because they expect the final number synchronously.

Files you may touch: `src/ui/AnimatedNumber.tsx`, `src/test/setup.ts`, `src/ui/ui-behavior.test.tsx`, `coord/results/T17-countup.md`.

1. AnimatedNumber counts from the previous value to the new value (~0.6s, ease-out), instant under prefers-reduced-motion, no per-frame allocations beyond the formatter, stops on unmount. Keep `tabular-nums` and `formatINR`. Keep the polite aria-live text in BillPanel showing the FINAL value (screen readers must not hear intermediate numbers) - check BillPanel uses the final value for its announcement.
2. Make tests deterministic: e.g. jsdom matchMedia mock reporting reduced motion and make sure motion's `useReducedMotion` picks it up, or use `await findByText` / fake timers. Add one test proving the count reaches the final value.
Done = `npm test` + `npm run build` pass. Run `npm run format`.
