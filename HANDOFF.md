# HANDOFF - boss session (read this only, then continue)

Repo `D:\projects\vibe_sprint` (main) -> https://github.com/VivekTiwary-25/watts-up (public). Live: https://watts-up-jade.vercel.app/ (Vercel auto-deploys every push to main). Brief = PS-04 "Watt's Up?"; rules in AGENTS.md, API in coord/CONTRACT.md, board in coord/BOARD.md. Boss only plans/reviews/merges; talk to the user in short plain updates.

## Machinery
- Launch (run_in_background): `& coord\run-worker.ps1 -Worker sol|luna|grok|vachana [-Model sonnet|opus] -Task <TaskFileNoExt> -Branch <branch>`. Own clone per worker at `D:\projects\vs-wt\<branch>` + own `npm ci`. Logs `coord/logs/`.
- Codex: sol=gpt-6.1-sol (hard), luna=gpt-6-luna (medium); NEVER astra. Sandbox can't write .git -> it writes `coord/results/<Task>.commits` ("msg | paths"). Boss: copy to %TEMP%, fix plan (one line per distinct file set; config/deps first; drop the .commits path), delete it from clone, `coord\commit-plan.ps1 -Clone <clone> -Plan <plan> -Worker "Codex Sol"`. Codex sometimes runs prettier on everything: commit only the listed files, then `git -C <clone> checkout -- .`.
- Vachana (2nd Claude acct): ONE call at a time, explicit model. Network can kill it (Cloudflare 403 / SELF_SIGNED_CERT): relaunch with a RESUME NOTE in the task. Grok: `xai-oauth/grok-4.7` via omp, commits itself, slow, may add stubs (keep main's files). Antigravity: disabled by Google, don't use.
- Merge: `git fetch -q <clone> <b>:<b>; git merge --no-ff <b> -m "merge: ..."`; resolve conflicts; `npm run build` + `npm test`; push ONLY if green.
- Edit coord/README files with Write/Edit tools, not PowerShell Get/Set-Content (mangles UTF-8).
- Boss usage: `coord/usage.json` from status line (`coord/statusline.js`); it has been stale since 16:05, so ask the user for `/usage` 5h %. Cutoff 90% -> heavy work to Vachana.

## State (18:20)
Merged T01-T18 + R01/R02: scaffold, data/bill/powercut/store, UI panels, grey-box scene + hover/click/fly-in, UI tests, vendor split + LoadingScreen (not mounted), intro, sounds, README, effects + energy wires, prettier, model pipeline (scripts/optimize-models.mjs, HouseModel w/ roof hide, Environment - mounted in T18), review fixes, a11y/mobile, realism (N8AO, bloom, AgX, baked shadows, quality tiers), Power Cut overlay (Grok, in src/ui/powercut, mounted in HUD), count-up total. 87 tests. ~165 commits.
Boss browser test on live site 18:15: ALL 3 judge checks pass (AC toggle 798->2858; target ring over/under; power cut exactly 3, 4th blocked w/ message, result card + best combo, restore OK).
Running: T20 scene polish (Vachana sonnet: fan/light overlap, red flash on blocked pick, green halo on picks), T21 overlay polish (Luna: 3.5s message, progress text, result highlights), T22 README round 2 (Sol). T19 (Sol's alt overlay in vs-wt/t19-powercut-alt) is NOT needed - don't merge.

## Update 18:40
Merged T20 (fan/light separated, red flash blocked pick, green halo), T21 (overlay message 3.5s, progress, highlights), T22 (README features/architecture/verification). Prettier now endOfLine auto. 88 tests, 185 commits. Running: R03 scene review (Vachana opus). Sol + Luna idle, waiting for models.

## Update 19:10
Merged R03 scene review (104 tests, 198 commits). Codex (Sol+Luna) 5h limit 100% until ~21:15 (3 saved resets exist on that account; only the user may use them). Running: T23 follow-ups (Vachana sonnet: pickError.id + mobile overview), T24 lint (Grok). Models still not delivered.

## Next
1. Merge T20/T21/T22 (re-test power cut message on live site after).
2. Models: public/models still empty - ask user/team for status. When they land in public/models/raw: run optimizer (worker task), verify size < 15 MB, browser check, fill README credits from team's sheet.
3. Mount LoadingScreen only once GLBs exist (guard so it never sticks).
4. Final: screenshots to docs/screenshots (intro, dollhouse, AC on, target over, power cut choose, result) + help user record screen video; README screenshot links; final deploy check.
