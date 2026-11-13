# Watt's Up? — agent rules (read this, don't explore)

Hackathon PS-04: interactive 3D house; toggle appliances, live energy bill, target bill, Power Cut (keep exactly 3).

## Stack
Vite + React + TypeScript, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing,
zustand, motion, gsap + @gsap/react, tailwindcss v4, shadcn/ui, vitest. Path alias `@/` = `src/`.

## Folders
- `src/data/appliances.ts` — THE appliance list (only place appliance values live)
- `src/data/config.ts` — tariff, inverter, power-cut rules, rooms, defaults (all tunables)
- `src/lib/bill.ts`, `src/lib/powercut.ts` — pure functions + `*.test.ts` next to them
- `src/store/useHouse.ts` — zustand store (the only global state)
- `src/scene/` — 3D (R3F) components
- `src/ui/` — 2D panels/cards/overlays; `src/components/ui/` = shadcn generated
- `public/models/` — `<id>.glb`, `house.glb`, one `.hdr`
- `coord/` — boss-only task board. Read only your own task file.

## Commands
- `npm run dev` · `npm run build` · `npm test` (vitest run) · `npm run lint`

## Rules
1. Touch ONLY the files listed in your task. Need another file? Write it in your result file instead.
2. No new npm dependencies unless your task says so.
3. Commit after every small working step, conventional messages: `feat(bill): ...`, `fix:`, `test:`, `style:`, `perf:`, `docs:`, `chore:`. Real changes only. Never commit secrets. Do NOT push, do NOT merge.
4. Before you finish: `npm test` and `npm run build` must pass.
5. All maths local, no external APIs/services/login/DB. Mock data only.
6. Respect `prefers-reduced-motion`. Style: dark navy/charcoal, glass panels, clay buttons, restrained glow.
7. Finish by writing `coord/results/<TASK>.md` (5-15 lines: what you did, files, how to verify, open issues), commit it, then exit.
8. Skills in `.claude/skills/` / `.agents/skills/`: use the ones your task names.
