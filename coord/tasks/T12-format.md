# T12 - Prettier + readability pass (worker: Codex Sol) - branch `t12-format`

Many files were written as minified one-liners. Make them readable WITHOUT changing behaviour.

Files you may touch: `package.json` (add devDependency `prettier` and scripts `"format": "prettier --write src"`, `"format:check": "prettier --check src"`), `package-lock.json`, `.prettierrc.json` (new: singleQuote true, semi false, printWidth 100, trailingComma all), `.prettierignore` (new: dist, node_modules, coord, src/components/ui), and these source files ONLY: `src/ui/*.tsx` (NOT src/ui/powercut/**, NOT HUD.tsx), `src/lib/*.ts`, `src/store/*.ts`, `src/data/*.ts`, `src/test/*.ts`, `src/App.tsx`, `src/main.tsx`, `coord/results/T12-format.md`.
Do NOT touch `src/scene/**` (another worker is editing it).

Steps: add prettier + config (commit plan line), then format each folder as a separate commit line (`style(ui): format ui components with prettier`, `style(lib): ...`, `style(store): ...`, `style(data): ...`). Also split any very long one-line component bodies into readable JSX (prettier does that). Done = `npm test` + `npm run build` pass, `npm run format:check` passes for the touched files.
