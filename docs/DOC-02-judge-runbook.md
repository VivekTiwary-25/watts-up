# DOC-02 Judge runbook (60 seconds)

Open https://watts-up-jade.vercel.app/ (or `npm run dev`). Use a fresh load so the defaults apply.

## Starting state

Bill **Rs 850** (158.34 units). Target **Rs 1,500**, "Rs 650 under target". On: fan, fridge, TV, LED lights, router. Off: AC, washer, geyser, stove, microwave.

## Script

| # | Time | Action | Expected output |
|---|---|---|---|
| 1 | 0:00 | Wait for loading, press the button on the intro screen to enter the house. | Dollhouse overview of the rooms with the bill panel and target panel. |
| 2 | 0:10 | Click **Villa** in the top bar, then **Rooms** to come back. | The camera flies back to the villa's front view and slowly sways; Rooms returns to the interactive dollhouse. |
| 3 | 0:20 | Click an appliance (in the list or in 3D). | Its card opens with a switch and an hours control. |
| 4 | 0:25 | Turn the Split AC on. | Bill rises from Rs 850 to **Rs 2,927**. The target panel flips to over target. |
| 5 | 0:35 | Turn the AC off again, drag the target slider. | Bill returns to Rs 850. The ring and "under target" text follow the slider. |
| 6 | 0:40 | **Twist:** press **Power Cut**. | Screen flickers, then you are asked to pick appliances for the inverter. |
| 7 | 0:45 | Pick fridge, router, lights, then try a 4th. | 4th is blocked: "Inverter can only run 3 appliances". Confirm only works at exactly 3. |
| 8 | 0:52 | Confirm. | Result card: comfort 11/13, 7h 8m backup, Rs 1.62/h. The best of all 120 combinations is also fridge + router + lights. |
| 9 | 0:58 | Press **Restore power**. | Switches return to their pre-cut state. |

The twist appears at steps 6-8.

## What is simulated

- Appliances' power draw and hours are sample values, not measurements.
- The tariff (slabs Rs 4 / 6 / 8 plus Rs 100 fixed) is fictional.
- The inverter, its capacity and the comfort scores are fictional.
- The power cut itself (flicker, blackout) is a visual effect; nothing real is switched.
- There is no login, no backend and nothing is saved.
