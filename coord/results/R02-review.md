# R02 Independent Review

| Severity | File:line | Problem | Concrete fix |
|---|---|---|---|
| High | `src/store/useHouse.ts:87-97` | `pick` changes selections in every cut phase, and `confirmPicks` accepts any phase. After confirmation, a click can remove a pick while state remains `result`, so the inverter runs fewer than three appliances. | Accept picks only in `choosing`; let `confirmPicks` proceed only from `choosing` (or require re-confirmation after edits). |
| Med | `src/ui/ApplianceCard.tsx:14-16,67-69` | During a cut, the card's switch and label read `on`, but `toggle` edits `picks`. A click may leave the displayed switch unchanged or opposite the running pick. | Derive the cut-phase control state from `picks` and label it as an inverter pick; alternatively disable the switch while the cut flow owns selection. |
| Low | `src/lib/bill.ts:56-71` | If appliances are on but all have zero hours, `items[0]` exists with zero share and the tip claims it is 0% of the bill and saves ₹0. The amount is right, but the recommendation is noise. | Treat `totalUnits === 0` like the no-usage case and show a zero-usage tip while retaining the fixed-charge total. |
| Low | `src/ui/ApplianceCard.tsx:54-59` | The 24-hour maximum and half-hour step duplicate control tuning in the UI, contrary to the config-driven goal. | Put daily-hours max/step in `src/data/config.ts` and use them in the slider and store clamp. |

No per-frame allocation, recurring subscription leak, or StrictMode duplicate sound/animation issue found in the inspected paths. Power restore snapshots and repeated restore behave correctly; bill updates are memoized from `on`/`hours`; power-cut selection is correctly limited to three before confirmation.

Verification: `npm test` passed (10 files, 64 tests); `npm run build` passed. Build reports the existing large-chunk warning for the Three.js bundle.
