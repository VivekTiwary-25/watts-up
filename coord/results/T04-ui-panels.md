Implemented the T04 panels and mounted the HUD above the canvas.
Added animated bill, target control, selected appliance card, top bar, and collapsible toggle list.
The appliance list toggles update the bill through Zustand state.
Panels use glass styling, keyboard labels, reduced-motion-aware entrances, and responsive placement.
Files: `src/ui/**`, `src/App.tsx`.
Added temporary T02 contract stubs because appliance/config/store/bill modules were absent.
T02 must replace `src/data/appliances.ts`, `src/data/config.ts`, `src/store/useHouse.ts`, and `src/lib/bill.ts` at merge.
Verification: `npm run build` and `npm test` pass.
Known issue: build reports the generated JavaScript chunk exceeds 500 kB.
No commit run; proposed conventional commits are listed in `coord/results/T04-ui-panels.commits`.
