# T01 — Scaffold (worker: Vachana Claude) · branch `t01-scaffold`

Goal: empty runnable app skeleton every other worker builds on. Speed over polish (~15 min).

Files you may touch: everything at repo root EXCEPT `AGENTS.md`, `CLAUDE.md`, `coord/` (only add `coord/results/T01.md`).

Steps (commit after each):
1. `npm create vite@latest . -- --template react-ts` (dir is non-empty: scaffold in a temp dir and copy in if needed). Commit `chore: scaffold vite react-ts`.
2. Install: three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing zustand motion gsap @gsap/react ; dev: @types/three vitest @vitest/coverage-v8 jsdom @testing-library/react tailwindcss @tailwindcss/vite. Commit `chore: add 3d, state, animation deps`.
3. Tailwind v4 via `@tailwindcss/vite`; `@/` alias in vite.config.ts and tsconfig(s). Commit.
4. `npx shadcn@latest init` (defaults, neutral, CSS variables), then add components: button slider switch card tooltip progress. Commit `chore: init shadcn/ui`.
5. Vitest config (`test` block in vite.config.ts, environment jsdom), scripts: `"test": "vitest run"`. Add `src/lib/smoke.test.ts` (1+1). Commit `test: add vitest setup`.
6. Theme: in `src/index.css` dark navy/charcoal tokens (bg #0b1020-ish), font Inter via @fontsource or system stack (no CDN), `.glass` utility (backdrop-blur, white/10 border, inner highlight) and `.clay` utility (soft raised button with inset highlight + shadow, pressed state). `prefers-reduced-motion` global rule. Commit `style: dark glass + clay theme tokens`.
7. `src/App.tsx`: full-screen R3F `<Canvas>` with a grey box + orbit controls, and an overlay div with title "Watt's Up?". Create empty dirs with `.gitkeep`: `src/data src/lib src/store src/scene src/ui public/models`. Commit `feat(app): full-screen canvas shell`.
8. Install agent skills (commit `chore: add agent skills`):
   npx skills add anthropics/skills --skill frontend-design
   npx skills add MengTo/Skills --skill threejs
   npx skills add greensock/gsap-skills --skill gsap-react
   npx skills add jakubkrehel/make-interfaces-feel-better
   npx skills add vercel-labs/agent-skills --skill web-design-guidelines
   (non-interactive flags like `-y`/`--yes` if prompted; if one fails, note it in the result and move on)
9. `.gitignore` covers node_modules, dist, .vercel, *.local. `vercel.json` not needed.

Done = `npm run build` and `npm test` pass, `npm run dev` shows the box. Write `coord/results/T01.md` and commit. Do not push.
