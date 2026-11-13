# T13 model pipeline

- Added a Node optimizer for raw GLBs using gltf-transform CLI 4; HDR files are copied and large files warned.
- Added house shell visibility filtering and a synthetic THREE scene test.
- Added an optional probed house model loader with shadow setup, centered 12x10 fitting, and safe load fallback.
- Added HDR environment loading with an entirely local Lightformer fallback.
- Documented expected filenames, raw asset location, optimization command, size budget, and credits.
- Files: `scripts/optimize-models.mjs`, `src/scene/HouseModel.tsx`, `src/scene/hideShell.ts`, `src/scene/hideShell.test.ts`, `src/scene/Environment.tsx`, `docs/MODELS.md`.
- Verify with `npm test` and `npm run build`; both passed (48 tests).
- Boss integration remains: mount `HouseModel` alongside/over the grey-box house and mount `Environment` in the Canvas.
- No real assets were present, so the optimizer was not run against model files.
