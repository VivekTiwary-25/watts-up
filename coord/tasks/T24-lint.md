# T24 - Lint clean-up (worker: Grok; Codex hit its 5h limit) - branch `t24-lint`

`npm run lint` (oxlint) reports old warnings (`react(immutability)`, `set-state-in-effect`, fast-refresh export in button.tsx). Fix the ones in `src/ui/**` (including src/ui/powercut) and `src/components/ui/button.tsx` without changing behaviour (e.g. derive state instead of setState in effects, move `buttonVariants` export to its own file `src/components/ui/button-variants.ts`).

Files you may touch: `src/ui/**`, `src/components/ui/**`, `coord/results/T24-lint.md`. NOT src/scene or src/store (another worker).
Only commit files you actually changed in content (do not run prettier over the whole repo). Done = `npm run lint` shows no warnings for src/ui and src/components, build + tests pass.
