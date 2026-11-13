# T26 - Submission docs (worker: Vachana sonnet) - branch `t26-submission-docs`

Files you may touch: `README.md`, `docs/DOC-01-readme-quickstart.md` ... `docs/DOC-06-handoff-limitations.md`,
`src/store/submission-checks.test.ts` (new), `coord/results/T26-submission-docs.md`.
Do NOT touch anything in `src/` except that one new test file. The boss is rebuilding the 3D scene in parallel.
Commit EACH doc as its own commit (README = 1 commit, each DOC file = 1 commit, the test file = 1 commit).
Keep writing plain and short (each DOC readable in 5-8 minutes max). No marketing fluff, no emoji.

## Facts (verified by the boss - use these, read code for anything else)
- Live URL: https://watts-up-jade.vercel.app/ - Repo: https://github.com/VivekTiwary-25/watts-up
- Run: `npm install`, `npm run dev`, open http://localhost:5173 . No env vars, no keys, no backend.
- Problem (PS-04): people can't see which appliances drive their electricity bill or how to cope with a power cut.
- 10 appliances in `src/data/appliances.ts`: fan, AC (1500 W), fridge, TV, LED lights, washer, geyser,
  electric stove (1500 W), microwave (1200 W), Wi-Fi router (12 W, 24 h/day, comfort 4, on by default).
- Default bill: 158.34 units, Rs 850.04 (shown as Rs 850). Turning on the Split AC -> Rs 2,927.
  Default target Rs 1,500 -> "Rs 650 under target". Target range Rs 200-5,000, step 50 (setTarget clamps;
  non-finite input is ignored). Hours range 0-24 step 0.5.
- Tariff slabs (fictional): 0-100 units Rs 4, 100-200 Rs 6, above 200 Rs 8, + Rs 100 fixed. 30-day month.
- Power Cut: screen flickers, then you pick EXACTLY 3 appliances for the "VoltVault 1800" inverter
  (1800 Wh, 80% usable = 1440 Wh). 4th pick is blocked with "Inverter can only run 3 appliances";
  Confirm only enabled at exactly 3. Result card: comfort score, backup hours, cost per hour, and the best
  combo from checking all 120 combinations: fridge + router + lights, comfort 11/13, 7h 8m, Rs 1.62/h.
  "Restore power" returns all switches to the pre-cut state; "Try again" goes back to choosing.
- Storage: the app uses NO localStorage/sessionStorage/cookies (grep confirms). All state is in a zustand
  store in memory (`src/store/useHouse.ts`); a page reload resets everything to the defaults.
  No network calls besides loading its own static files; no analytics; no APIs.
- 3D (being built now, describe it like this): a 3-level Bali hillside villa with a SECTION-CUT floor view
  (Ground / First / Top buttons slice the house so you look down into a floor), real 3D appliance models,
  sunset sky, energy wires, power-cut blackout. Only the AC is a stylised placeholder model.
- Core logic: bill engine `src/lib/bill.ts`, power cut logic `src/lib/powercut.ts`, appliance config
  `src/data/appliances.ts`, tunables `src/data/config.ts`, store `src/store/useHouse.ts`,
  3D in `src/scene/`, HUD in `src/ui/` (power cut overlay in `src/ui/powercut/`).
- Model credits: copy the table in `public/models/CREDITS.md` exactly (fridge and washer rows say FILL IN -
  leave them as FILL IN for the team).

## 1. README.md - rewrite to contain, IN THIS ORDER
1. "# Watt's Up?" + ONE sentence problem statement.
2. Features: 3-5 bullets that work (bill updates live on toggle; target bill + progress ring;
   Power Cut twist with exactly-3 rule and best-combo result; 3D villa with section-cut floors and clickable
   appliances; accessibility: reduced motion + keyboard). Keep it to 5.
3. Run steps (above) + live URL.
4. Two screenshots: `![Main flow](docs/screenshot-main.png)` (dollhouse view with an appliance card open and
   the bill panel) and `![Power Cut result](docs/screenshot-result.png)`. The team captures these by hand;
   leave the links even though the files don't exist yet.
5. 3-step judge demo path with the built-in sample data: 1) toggle appliances, watch the bill change live,
   2) set a target bill and watch the progress ring, 3) trigger Power Cut, pick exactly 3, confirm, see the
   result card. Give the exact expected numbers from the facts above.
6. Known limitations: AC is a stylised placeholder model; the villa is heavy (~50 MB, best on a laptop with a
   real GPU); tariff/battery/comfort numbers are fictional; nothing is saved between visits.
7. Credits (synced with public/models/CREDITS.md) + libraries line.
8. "Built with AI": Claude Code (Opus boss + Sonnet subagents), OpenAI Codex (Sol and Luna), Grok, and Claude
   chat for converting and compressing the 3D models. "One thing we fixed or changed": the villa's roof
   couldn't be removed (its 130 parts are all named "Material"), so we built a section-cut floor view
   instead; and the 249 MB house was compressed to ~50 MB so it loads in a browser.
Then keep the useful existing sections (bill maths, architecture mermaid, tech stack, how we built it) AFTER
those, updated to the new numbers (Rs 850 default, 10 appliances, 120 combos, router best combo). Drop the old
"Verified on the live site" numbers (they are stale) and the old screenshot placeholders.

## 2. Six docs in docs/
- DOC-01-readme-quickstart.md: purpose, features, no-secret setup, demo data, screenshots (same two links,
  relative `screenshot-main.png`), known limitations. A judge must know what to click within 30 seconds:
  put a "Click this first" box at the top.
- DOC-02-judge-runbook.md: numbered 60-second demo script: starting state, exact actions, expected output,
  where the twist appears. List everything that is simulated.
- DOC-03-five-test-checklist.md: five manual tests (steps + expected result):
  INVALID input (type 0 / negative / empty into the target bill -> read `src/ui/TargetPanel.tsx` to see
  exactly what the UI does and describe THAT); HAPPY path (toggle AC -> Rs 850 to Rs 2,927);
  TWIST (4th pick blocked with the message, Confirm needs exactly 3); RESET (Restore power returns the
  pre-cut switches; page reload returns to defaults); BOUNDARY (slab edge: find an hours setting that lands
  exactly on 100 or 200 units, or set the target exactly equal to the bill - read TargetPanel to see what is
  shown when bill == target). Leave a "Result" column with "PASS (verified <how>)".
- DOC-04-user-quickstart.md: four steps for a first-time user: what the app does, what to do, what to
  expect, how to recover from a mistake (Restore power, Try again, Back to overview, Esc, reload).
- DOC-05-data-privacy.md: fields the app keeps (list the store fields), no localStorage, all data fictional,
  sends nothing anywhere, no secrets in the repo (check: grep for keys/tokens/.env; .env* is gitignored).
- DOC-06-handoff-limitations.md: main files/components and where core logic lives, how demo data resets,
  what's mocked, top three improvements for a real deployment.

## 3. Verify the checklist
Write `src/store/submission-checks.test.ts` (vitest) that proves each of the five DOC-03 tests at the store /
pure-function level (invalid target clamped or ignored, toggle changes total to 2926.72, 4th pick blocked +
confirmPicks false with 2 or 4, restorePower restores, slab boundary value). Reset the store in beforeEach
the way `src/store/useHouse.test.ts` does. `npm test` and `npm run build` must pass. The boss will also click
through them in the browser.

Finish with `coord/results/T26-submission-docs.md` (5-15 lines), commit, exit.
