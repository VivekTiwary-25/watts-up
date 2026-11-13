# DOC-05 Data and privacy

## What the app keeps

All state lives in memory in one zustand store (`src/store/useHouse.ts`) and disappears when the page is closed or reloaded.

| Field | Meaning |
|---|---|
| `on` | Which appliances are switched on |
| `hours` | Daily hours per appliance |
| `targetBill` | Target monthly bill |
| `view`, `focusRoom` | Current camera view and focused room |
| `hovered`, `selected` | Appliance under the pointer / open card |
| `powerCut` | Power Cut phase: off, flicker, choosing, result |
| `picks` | The appliances chosen for the inverter |
| `savedOn` | Copy of `on` taken when the Power Cut starts |
| `pickError` | Last blocked-pick message |
| `muted` | Sound mute flag |

## Storage

- No `localStorage`, `sessionStorage` or cookies. A search of `src/` finds none.
- Nothing is saved between visits.

## Network

- The page loads its own static files (code, `.glb` models, one `.hdr`). The only extra request is a `HEAD` check for a model file in `src/scene/glb.ts`, to the same site.
- No analytics, no APIs, no login, no database.
- The app sends nothing about you anywhere.

## Data is fictional

Appliance wattages, hours, tariff slabs, the inverter and comfort scores are sample values. They are not your real usage or any real utility's rates.

## Secrets

- No keys or tokens are used. A case-insensitive search of `src/` for `api key`, `secret`, `token`, `password` and `VITE_` finds nothing.
- `.env*` is listed in `.gitignore`, and no `.env` file is tracked by git.
