# T04 — UI panels (worker: Codex Luna) · branch `t04-ui-panels`

Use skills: `frontend-design`, `make-interfaces-feel-better`. Code against `coord/CONTRACT.md` (Store, Bill). T02 builds store/bill in parallel: if `src/store/useHouse.ts` / `src/lib/bill.ts` don't exist, create TEMPORARY stubs that match the contract exactly (simple correct implementation is fine) and say so in your result; boss keeps T02's versions at merge.

Files you may touch: `src/ui/**` (new), `src/App.tsx` (only to mount the overlay `<HUD />` above the canvas), stubs above, `coord/results/T04-ui-panels.md`.

Build (dark navy/charcoal, `.glass` panels, `.clay` buttons from index.css, shadcn components in `src/components/ui`, `motion` for enter/exit, respect reduced motion):
1. `src/ui/AnimatedNumber.tsx` — counts up/down smoothly to new value (motion `animate` / spring), formats ₹ en-IN.
2. `src/ui/BillPanel.tsx` — big animated ₹ total, total units (kWh/month), one bar per ON appliance showing % share (animated width, sorted), tip line. Fixed charge shown small.
3. `src/ui/TargetPanel.tsx` — slider (TARGET_RANGE), SVG progress ring = total/target; under target = calm green/teal "₹X under target", over = amber/red "₹X over target" with gentle pulse; aria-live polite.
4. `src/ui/ApplianceCard.tsx` — glass card for `selected ?? hovered` appliance: name, room, watts, hours/day slider (0–24 step 0.5), monthly cost, % of bill, BIG clay on/off switch, description; spring entrance; Esc / close button deselects. Docked bottom-right on desktop, bottom sheet on mobile.
5. `src/ui/TopBar.tsx` — title "Watt's Up?", "Back to overview" (visible when view==='room'), "Power cut" trigger button (calls startPowerCut), mute toggle.
6. `src/ui/HUD.tsx` — layout: bill panel top-left, target top-right (stack on mobile), card, top bar. `pointer-events-none` wrapper with `pointer-events-auto` panels so the 3D stays clickable.
7. `src/ui/ApplianceList.tsx` — compact accessible fallback list of all 8 toggles (keyboard users + judges), collapsible.
Commit after each numbered step (feat(ui): ...). Done = build + tests pass; toggling in the list changes the bill instantly.
