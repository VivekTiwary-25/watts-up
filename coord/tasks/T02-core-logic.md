# T02 — Data, bill engine, power-cut logic, store (worker: Codex Sol) · branch `t02-core-logic`

Implement EXACTLY the API in `coord/CONTRACT.md` sections Types, Config, Bill, Power cut, Store. Tests are the score.

Files you may touch (only these):
- `src/data/appliances.ts`, `src/data/config.ts`
- `src/lib/bill.ts`, `src/lib/bill.test.ts`, `src/lib/powercut.ts`, `src/lib/powercut.test.ts`, `src/lib/format.ts` (₹ formatting: `formatINR(n, decimals=0)` using en-IN grouping)
- `src/store/useHouse.ts`, `src/store/useHouse.test.ts`
- `coord/results/T02-core-logic.md`

Appliance values (fictional), descriptions: one short friendly sentence each.
| id | name | room | watts | hrs/day | on | comfort | model |
| fan | Ceiling Fan | living | 75 | 10 | yes | 3 | fan.glb |
| ac | Split AC | bedroom | 1500 | 6 | no | 5 | ac.glb |
| fridge | Refrigerator | kitchen | 150 | 24 | yes | 4 | fridge.glb |
| tv | Television | living | 100 | 4 | yes | 2 | tv.glb |
| light | LED Lights | all | 40 | 6 | yes | 3 | light.glb |
| washer | Washing Machine | bathroom | 500 | 1 | no | 1 | washer.glb |
| geyser | Geyser | bathroom | 2000 | 1 | no | 2 | geyser.glb |
| microwave | Microwave | kitchen | 1200 | 0.5 | no | 1 | microwave.glb |

Required tests (vitest), at minimum:
- monthlyUnits(1500,6)=270; energyCharge: 50→200, 100→400, 150→700, 250→1400; 0→0.
- default state computeBill → totalUnits 149.7, total 798.2 (toBeCloseTo); shares sum to 1; items sorted by cost desc; off appliances excluded; all off → total 100 and the "Everything is off" tip.
- tip names the top-share appliance with its % and a ₹ saving that equals recomputed difference.
- powercut: 4th pick blocked with reason; toggling a picked one removes it; isValidSelection true only at exactly 3 unique; batteryHours(['fridge','fan','light']) = 1440/265; comfortScore max = 12; allCombos length 56, all unique; bestCombo = fridge+fan+light; costPerHour(['ac','fridge','fan']) = 1.725*8.
- store: toggle flips; startPowerCut saves `on`; pick 4th sets pickError and keeps 3; confirmPicks false with 2, true with 3; restorePower restores exactly the saved `on` and phase 'off'; isPowered behaves per contract.
Commit in small steps (data → config → bill+tests → powercut+tests → store+tests). Done = `npm test` + `npm run build` pass.
