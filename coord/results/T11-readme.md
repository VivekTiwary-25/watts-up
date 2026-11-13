Replaced the Vite starter README with judge-focused Watt's Up? documentation.
Included the live-demo placeholder and repository link.
Documented the appliance table, tariff math, default bill, tip, and Power Cut rules.
Verified numeric values against `src/data/appliances.ts`, `src/data/config.ts`, and the bill/Power Cut tests.
Added screenshot image placeholders under `docs/screenshots/` and retained the folder with `.gitkeep`.
Documented configuration locations, stack, project tree, run commands, accessibility, and vendor chunks.
Added TBD credits rows for all eight appliance models, `house.glb`, and the HDRI.
Files: `README.md`, `docs/screenshots/.gitkeep`, `coord/results/T11-readme.md`, `coord/results/T11-readme.commits`.
Checks: `npm test` passed (37 tests); `npm run build` passed.
Build note: Vite reports the Three.js vendor chunk exceeds 500 kB after minification.
Open issues: live demo URL, screenshots, and model/HDRI attribution are still TBD.
