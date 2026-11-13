# Watt's Up?

Explore a 3D home, manage appliance use, and see how your choices change the monthly energy bill.

Live demo: **[watts-up-jade.vercel.app](https://watts-up-jade.vercel.app/)** · [Repository](https://github.com/VivekTiwary-25/watts-up)

## What it does

Built for hackathon PS-04, Watt's Up? is an interactive 3D house where you can toggle appliances, adjust their daily hours, track a live bill against a target, and respond to a simulated Power Cut by choosing exactly three appliances for the inverter.

Screenshot placeholders (add the images under `docs/screenshots/`):

- `docs/screenshots/overview.png` — house overview
- `docs/screenshots/bill-target.png` — live bill and target
- `docs/screenshots/power-cut.png` — Power Cut selection

## Judge quick-check

1. Toggle an appliance in the appliance list or 3D house; confirm the bill changes.
2. Adjust the target bill; confirm the progress ring and under/over amount update.
3. Start **Power Cut**, choose three appliances, and try a fourth; the fourth selection is blocked.

## Appliances

| Appliance | Room | Watts | Default hours/day | Comfort |
|---|---|---:|---:|---:|
| Ceiling Fan | Living room | 75 | 10 | 3 |
| Split AC | Bedroom | 1,500 | 6 | 5 |
| Refrigerator | Kitchen | 150 | 24 | 4 |
| Television | Living room | 100 | 4 | 2 |
| LED Lights | All rooms | 40 | 6 | 3 |
| Washing Machine | Bathroom | 500 | 1 | 1 |
| Geyser | Bathroom | 2,000 | 1 | 2 |
| Microwave | Kitchen | 1,200 | 0.5 | 1 |

## How the bill is calculated

Monthly units for each enabled appliance are `watts × hours per day × 30 ÷ 1,000`. Energy charges use progressive slabs:

| Monthly units | Rate per unit |
|---|---:|
| First 100 | ₹4 |
| Next 100 (101–200) | ₹6 |
| Above 200 | ₹8 |

A fixed charge of **₹100** is added to the energy charge. Each appliance's displayed cost is its share of total units multiplied by the energy charge; the fixed charge is not allocated to appliances.

At the default settings, the enabled fan, refrigerator, television, and LED lights use **149.7 units** and the total bill is **₹798.20** (₹698.20 energy charge + ₹100 fixed charge). The bill tests check this example.

The tip identifies the enabled appliance with the largest share of usage, then estimates the bill saving from running it two fewer hours per day. It uses the same slab calculation and rounds the saving to whole rupees. With everything off, the tip says the bill is just the fixed charge.

## Power Cut

- Select exactly **3** unique appliances. A fourth selection is blocked.
- The fictional **VoltVault 1800** inverter has 1,800 Wh capacity and makes 80% usable (1,440 Wh).
- Estimated battery time is `capacity (Wh) × usable fraction ÷ selected load (W)`.
- Comfort is the sum of the selected appliance comfort scores, out of a maximum **12**.
- Estimated running cost is `selected load (W) ÷ 1,000 × ₹8 per unit` per hour.
- The app checks all **56** possible three-appliance sets, keeps those with at least **2 hours** of backup, then chooses the highest comfort score; ties go to longer battery time.
- Best eligible set: **Refrigerator + Ceiling Fan + LED Lights** — 265 W, comfort **10/12**, about **5.43 hours** of backup, and **₹2.12/hour**.

## Configuration

- Appliance names, rooms, wattage, default hours, and comfort scores: `src/data/appliances.ts`
- Tariff, inverter, Power Cut rules, target defaults, and room names: `src/data/config.ts`
- Bill and Power Cut calculations: `src/lib/bill.ts` and `src/lib/powercut.ts`

## Tech stack and development

Vite, React, TypeScript, Three.js, React Three Fiber, Drei, postprocessing, Zustand, Motion, GSAP, Tailwind CSS v4, shadcn/ui, and Vitest.

```text
src/
  data/       appliances and tunable configuration
  lib/        bill and Power Cut calculations
  store/      shared house state
  scene/      interactive 3D house
  ui/         panels and overlays
public/models/  3D models and environment map
docs/screenshots/  project screenshots
```

```sh
npm i
npm run dev
npm test
npm run build
```

## Accessibility and performance

The appliance list and controls use native buttons and keyboard-operable switches. The interface honors `prefers-reduced-motion`. Production builds split Three.js, React Three Fiber/postprocessing, and animation libraries into vendor chunks.

## Credits

Asset attribution is **TBD** for each model and the environment map.

| Model | Site | Link | Author | Licence |
|---|---|---|---|---|
| `fan.glb` | TBD | TBD | TBD | TBD |
| `ac.glb` | TBD | TBD | TBD | TBD |
| `fridge.glb` | TBD | TBD | TBD | TBD |
| `tv.glb` | TBD | TBD | TBD | TBD |
| `light.glb` | TBD | TBD | TBD | TBD |
| `washer.glb` | TBD | TBD | TBD | TBD |
| `geyser.glb` | TBD | TBD | TBD | TBD |
| `microwave.glb` | TBD | TBD | TBD | TBD |
| `house.glb` | TBD | TBD | TBD | TBD |
| HDRI environment map | TBD | TBD | TBD | TBD |

All data is fictional; no external APIs, no login.
