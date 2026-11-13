# BOARD - Watt's Up? (PS-04)

Updated: 2026-11-13 16:00 - Phase 1 (core flow with placeholders)
Boss usage: read `coord/usage.json` (from status line). Cutoff: 5h >= 90% -> heavy work to Vachana.

| Worker | Model | Task | Status | % left |
|---|---|---|---|---|
| Boss | Claude Opus 5.5 (main acct) | plan / review / merge | active | see usage.json |
| Vachana | Claude 2nd acct (explicit --model; ONE call at a time) | T03 scene (after T01) | reachable again 16:00 | not reported by CLI |
| Codex Sol | gpt-6.1-sol | T01 scaffold (resume), then T02 core logic | running | 5h 65% / 7d 68% (shared w/ Luna) |
| Codex Luna | gpt-6-luna | T04 UI panels (after T01) | queued | shared w/ Sol |
| Grok | xai-oauth/grok-4.7 | R01 tech research | running | 7d 81% |
| Antigravity | gemini-3.8-flash | - | BLOCKED: Google disabled acct (403 TOS_VIOLATION) | n/a |

## Queue
- T02 data + bill + powercut + store (Sol, after T01)
- T03 3D grey-box scene, hover/click/camera (Vachana sonnet, after T01)
- T04 UI panels (Luna, after T01)
- T05 Power Cut overlay UI (Grok, after T01)
- T06 effects: room lights, fan spin, TV glow, AC haze, geyser shimmer, energy wires
- T07 intro shot + fly-in - T08 GLB loader w/ fallback + roof hide - T09 realism/perf - T10 sounds + mobile tap
- Reviews/tests/a11y passes as workers free up

## Done
- (none yet)
