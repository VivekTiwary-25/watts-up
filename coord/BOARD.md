# BOARD - Watt's Up? (PS-04)

Updated: 2026-11-13 16:00 - Phase 1 (core flow with placeholders)
Boss usage: read `coord/usage.json` (from status line). Cutoff: 5h >= 90% -> heavy work to Vachana.

| Worker | Model | Task | Status | % left |
|---|---|---|---|---|
| Boss | Claude Opus 5.5 (main acct) | plan / review / merge | active | see usage.json |
| Vachana | Claude 2nd acct (opus; ONE call at a time) | T08 effects + energy wires (resumed after TLS error) | running 16:40 | not reported by CLI |
| Codex Sol | gpt-6.1-sol | T10 sounds + mute | running 16:42 | see `omp usage` |
| Codex Luna | gpt-6-luna | T09 intro shot | running 16:42 | shared w/ Sol |
| Grok | xai-oauth/grok-4.7 | T05 Power Cut overlay | running 16:10 | 7d 81% |
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
- R01 research (Grok) -> coord/results/R01-research.md
- T01 scaffold (Sol) merged 16:05
- T02 data/bill/powercut/store, 27 tests (Sol) merged 16:14
- T04 UI panels (Luna) merged 16:17
- T03 grey-box scene (Vachana) merged 16:28
- T06 UI behaviour tests (Luna) merged 16:35
- T07 vendor split + loading screen (Sol) merged 16:38
