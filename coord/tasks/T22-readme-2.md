# T22 - README round 2 (worker: Codex Sol) - branch `t22-readme-2`

Files you may touch: `README.md`, `coord/results/T22-readme-2.md`. Keep existing content and numbers; read code for any new facts.

1. Add "Architecture" section with a mermaid diagram: config (appliances.ts, config.ts) -> pure engines (bill.ts, powercut.ts) -> zustand store (useHouse) -> 3D scene (src/scene: House, appliances, effects, energy wires, CameraRig, PostFX/quality) and HUD (src/ui panels, powercut overlay, sounds).
2. Add "Verified on the live site" checklist (all three judge checks pass on https://watts-up-jade.vercel.app/ - toggle AC: Rs 798 -> Rs 2,858; target ring flips to over-target; power cut blocks a 4th pick with "Inverter can only run 3 appliances", result shows comfort/backup/cost and best combo fan+fridge+lights 10/12, 5h 26m, Rs 2.12/h; Restore brings everything back).
3. Add "How we built it" short section: one boss agent planning/reviewing/merging, worker agents (Claude, Codex, Grok) each on its own branch and clone, every branch merged with --no-ff (see `git log --graph`), tests as the score (count them with `npm test`).
4. Add "Features" bullets for intro shot, dollhouse view, room fly-in, hover glow, energy wires, living-house effects, sounds + mute, reduced motion, adaptive quality.
Done = README renders cleanly (valid mermaid).
