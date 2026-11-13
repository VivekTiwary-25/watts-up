# T11 - README (worker: Codex Luna) - branch `t11-readme`

Write `README.md` (replace the Vite boilerplate). Source of truth for numbers: `src/data/appliances.ts`, `src/data/config.ts`, `src/lib/bill.ts`, `src/lib/powercut.ts` - read them, do not invent values. Plain, friendly, judge-scannable. Files you may touch: `README.md`, `docs/screenshots/.gitkeep` (new), `coord/results/T11-readme.md`.

Sections:
1. Title + one-line pitch, badges-free. Links: Live demo `<!-- VERCEL_URL -->` placeholder, repo URL https://github.com/VivekTiwary-25/watts-up.
2. What it does (PS-04 "Watt's Up?"): interactive 3D house, toggle appliances, live bill, target bill, Power Cut twist. Screenshot placeholders `docs/screenshots/*.png`.
3. Judge quick-check: 3 numbered steps to verify (toggle -> bill changes; set target -> progress ring; Power Cut -> exactly 3).
4. Appliance table (name, room, watts, hours/day, comfort) generated from the data file.
5. How the bill is calculated: units formula, the fictional slab tariff table + fixed charge, per-appliance cost allocation (proportional), worked example for the default state (149.7 units -> Rs 798.20, verify against tests), how the tip is generated.
6. Power Cut: rules (exactly 3, 4th blocked), inverter capacity/usable fraction, battery time formula, comfort score (out of max 12), cost per hour, best combo search over all 56 sets (filter >= min backup hours, max comfort, tie -> longer battery) and the answer.
7. Config-driven: which file to edit for tariff / inverter / appliances.
8. Tech stack + project structure (short tree) + how to run (`npm i`, `npm run dev`, `npm test`, `npm run build`).
9. Accessibility & performance notes (reduced motion, keyboard appliance list, vendor chunks).
10. Credits: table with columns Model | Site | Link | Author | Licence, one row per file (fan.glb ... house.glb, HDRI) marked `TBD`. Note "All data is fictional; no external APIs, no login."
Done = README renders cleanly; numbers match code.
