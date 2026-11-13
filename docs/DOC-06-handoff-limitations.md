# DOC-06 Handoff and limitations

## Where things live

| Area | Location |
|---|---|
| Appliance list (watts, hours, comfort, model file) | `src/data/appliances.ts` |
| Tunables: tariff, inverter, power-cut rules, target range, rooms | `src/data/config.ts` |
| Bill engine (units, slabs, per-appliance cost, tip) | `src/lib/bill.ts` |
| Power Cut logic (pick rules, battery hours, comfort, best of 120 combos) | `src/lib/powercut.ts` |
| Global state and actions | `src/store/useHouse.ts` |
| 3D villa, appliances, camera, effects | `src/scene/` |
| HUD: bill, target, appliance list and cards | `src/ui/` |
| Power Cut overlay and result card | `src/ui/powercut/` |
| Models and environment map | `public/models/` (credits in `CREDITS.md`) |

Tests sit next to the code (`*.test.ts`); `src/store/submission-checks.test.ts` backs the five-test checklist in DOC-03.

## How demo data resets

The store's initial state is built from `APPLIANCES` and `config.ts`. Reloading the page recreates it. Inside the app, **Restore power** puts back the switches saved when the Power Cut began. There is no other reset and no persistence.

## What is mocked

- All usage figures, the tariff, the inverter and comfort scores.
- The Power Cut event itself, which is a visual effect triggered by a button.
- The AC model is a stylised placeholder.
- No backend, accounts or real meter data.

## Known limitations

- The villa is about 50 MB and heavy on weak GPUs.
- The villa's roof cannot be removed (130 parts all named "Material"), so floors are shown with a section cut.
- Credits for the fridge and washer models still read FILL IN.

## Top three improvements for a real deployment

1. Replace sample data with real meter readings or a utility's billing export, and the real tariff for the user's region.
2. Make the model lighter (more compression, level-of-detail, lazy loading per floor) so it runs on phones.
3. Let users save their appliances, hours and target (with consent and a privacy policy), and add real inverter specs.
