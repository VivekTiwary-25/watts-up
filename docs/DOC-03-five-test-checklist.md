# DOC-03 Five-test checklist

Manual tests, each also proved in code by `src/store/submission-checks.test.ts` (run `npm test`). Start every test from a fresh page load.

| # | Test | Steps | Expected result | Result |
|---|---|---|---|---|
| 1 | INVALID input | The target bill is a slider (`src/ui/TargetPanel.tsx`, range 200-5,000, step 50), so 0, negative or empty values cannot be typed. Drag the slider fully left, then fully right. | Slider stops at Rs 200 and Rs 5,000. Nothing breaks. If a bad value reached the store anyway, `setTarget` clamps 0 and negatives to Rs 200, caps large values at Rs 5,000, and ignores NaN / Infinity (target unchanged). | PASS (verified by unit test on `setTarget`; boss to confirm slider in browser) |
| 2 | HAPPY path | Load the page, enter the house, turn on the Split AC. | Bill goes from Rs 850 to Rs 2,927 (2926.72 exactly). Target panel changes from "Rs 650 under target" to over target. | PASS (verified by unit test: 850.04 -> 2926.72) |
| 3 | TWIST | Press Power Cut. Pick fridge, router, lights. Try a 4th. Then deselect one and try Confirm. | 4th pick is blocked with "Inverter can only run 3 appliances" and the picks stay at 3. Confirm is enabled only with exactly 3 picks (not 2, never 4). | PASS (verified by unit test on `pick` / `confirmPicks`) |
| 4 | RESET | Turn the AC on. Run Power Cut, confirm 3 picks, press Restore power. Then reload the page. | Restore power brings back the switches exactly as before the cut (AC still on). A reload returns everything to the defaults (AC off, Rs 850, target Rs 1,500). | PASS (verified by unit test on `restorePower` and fresh initial state) |
| 5 | BOUNDARY | Turn off every appliance except the Split AC and set its hours to 5. Set the target slider to Rs 1,300. | AC alone is 225 units, bill exactly Rs 1,300. With bill equal to target the panel shows "Rs 0 under target" (the code treats bill <= target as under) and the ring is full. Slab edges: 100 units = Rs 400 energy, 200 units = Rs 1,000. | PASS (verified by unit test: total 1300, `energyCharge(100)` = 400, `energyCharge(200)` = 1000) |

Note: no whole-hour setting of the current appliances lands on exactly 100 or 200 units, which is why test 5 uses bill == target instead.
