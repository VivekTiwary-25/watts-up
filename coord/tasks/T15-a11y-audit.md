# T15 - Accessibility + web-design-guidelines audit (worker: Codex Sol) - branch `t15-a11y`

Use the `web-design-guidelines` skill's checklist as a reference (read its rules; don't run an interactive workflow). Audit then FIX.

Files you may touch: `src/ui/*.tsx` (NOT src/ui/powercut/**), `src/index.css`, `index.html`, `src/ui/*.test.tsx`, `coord/results/T15-a11y.md`. Do not touch src/scene/** or App.tsx (other workers).

Check and fix:
1. Every control has an accessible name; switches use role=switch + aria-checked; sliders have labels and value text (e.g. "6 hours per day", "Rs 1,500 target").
2. Visible focus rings (`:focus-visible`) on all interactive elements, matching the glow style; logical tab order; Esc closes the appliance card.
3. Color contrast >= 4.5:1 for text on glass panels (check muted text colours); over/under target not conveyed by colour alone (icon/text).
4. aria-live: bill total announces politely (debounced, not every animation frame); target state change announced.
5. `prefers-reduced-motion` respected everywhere in src/ui (AnimatedNumber jumps instantly).
6. Touch targets >= 44px on mobile; no horizontal scroll at 360px width; panels don't cover the house centre on phones (collapse bill panel to a compact pill on < 640px).
7. Numbers use tabular-nums; currency formatted en-IN consistently.
Write findings (fixed / not fixed) in the result. Done = build + tests pass; add tests for 1 and 4 where cheap.
