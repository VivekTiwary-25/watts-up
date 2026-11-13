# HANDOFF - boss session (read this only, then continue)

Repo `D:\projects\vibe_sprint` (branch main) -> https://github.com/VivekTiwary-25/watts-up (public). User's brief = PS-04 "Watt's Up?" (see AGENTS.md + coord/CONTRACT.md). Boss only plans/reviews/merges.

## How the machinery works
- Launch: `& coord\run-worker.ps1 -Worker sol|luna|grok|vachana [-Model opus|sonnet] -Task <TaskFile> -Branch <branch>` (run_in_background). Each worker gets its own local clone at `D:\projects\vs-wt\<branch>` with its own `npm ci`. Logs in `coord/logs/`.
- Codex (sol=gpt-6.1-sol hard, luna=gpt-6-luna medium; NEVER astra) runs sandboxed: cannot write .git. It writes `coord/results/<Task>.commits` ("msg | paths"). Boss: copy plan to %TEMP%, fix it (one commit per distinct file group; same file twice = skipped), delete it from clone, run `coord\commit-plan.ps1 -Clone <clone> -Plan <plan> -Worker "Codex Sol"`.
- Merge: `git fetch -q <clone> <branch>:<branch>; git merge --no-ff <branch> -m "merge: ..."`, then `npm run build`, `npm test`, `git push origin main`.
- Vachana (2nd Claude acct): ONE call at a time, always explicit `--model` (sonnet normal, opus hard/review). Network here intermittently breaks it (403 Cloudflare, SELF_SIGNED_CERT). If it dies, relaunch with a RESUME NOTE in the task file.
- Grok via omp: `xai-oauth/grok-4.7`. Commits itself. Antigravity: account disabled by Google (TOS 403), don't use.
- Boss usage: `coord/usage.json` (status line script `coord/statusline.js`); distrust if >15 min old. 5h >= 90% -> hand heavy work to Vachana.
- Don't edit coord files with PowerShell Get/Set-Content (mangles UTF-8). Use Write/Edit tools.

## State (16:45)
Merged: T01 scaffold, T02 data/bill/powercut/store, T04 UI panels, T03 grey-box scene, T06 UI tests, T07 vendor split + LoadingScreen (NOT mounted yet: it waits for useProgress; mount once GLBs exist or guard for no-assets). 37 tests pass.
Running: T05 Power Cut overlay (Grok, `t05-powercut-ui`; boss must mount `<PowerCutOverlay />` in HUD/App on merge; may contain stubs -> keep main's store/powercut), T08 effects+wires (Vachana opus, resumed), T09 intro (Luna), T10 sounds (Sol).

## Update 17:15
Live: https://watts-up-jade.vercel.app/ (Vercel auto-deploys on push to main; README links it).
Also merged: T09 intro, T10 sounds, T11 README, T08 effects+wires, T12 prettier (`npm run format`), T13 model pipeline. 64 tests.
Integration TODO for boss: mount `<HouseModel />` + `<Environment />` (src/scene) in Scene.tsx after T14 merges; mount `<PowerCutOverlay />` after T05 merges (keep main's store/powercut over Grok's stubs).
Running: T05 Grok, T14 realism (Vachana opus), T15 a11y (Sol), R02 review (Luna, read-only).

## Update 17:45
Merged since: R02 review, T16 (power-cut picks frozen after confirm + retryPicks), T15 a11y/mobile, T14 realism + quality tiers. 69 tests green on main. RULE: push only after `npm test` passes.
Running: T05 Grok (PowerCutOverlay, slow, untracked files in clone), T19 Sol = second take of the same overlay in src/ui/powercut-alt (pick the better one, delete the other, mount it in HUD), T17 Luna (rupee count-up animation + deterministic tests), T18 Vachana sonnet (mount HouseModel/Environment, modelFile, ApplianceCard during cut, frameloop check).
Then: browser-verify the 3 judge checks on https://watts-up-jade.vercel.app/ (claude-in-chrome), screenshots to docs/screenshots, README screenshots + credits from team's sheet.

## Next steps
1. Merge T05/T08/T09/T10 as they finish. Then do the browser check of all 3 judge checks (toggle -> bill; target progress; power cut exactly 3).
2. Vercel: user asked to import repo at vercel.com/new (Vite preset); waiting on their URL. Auto-deploys on push after that.
3. Models: `public/models/` is still empty (team is sourcing). When they land: T11 compress with gltf-transform (meshopt, keep names; see R01 section 8), modelFile from config (glb.ts uses `<id>.glb`), house.glb roof hide (R01 section 4), HDRI + postprocessing realism + PerformanceMonitor (R01 section 7).
4. Free workers next: independent code review (Vachana opus), a11y audit + web-design-guidelines fixes, mobile tap pass, README (tariff, power cut scoring, credits from team's sheet), screenshots/recording.
