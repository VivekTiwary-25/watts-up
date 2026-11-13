# T10 - Subtle sounds with mute (worker: Codex Sol) - branch `t10-sounds`

No audio files, no new deps: synthesize with the Web Audio API. Store already has `muted` + `toggleMute()`.

Files you may touch: `src/lib/sound.ts` (new), `src/lib/sound.test.ts` (new, mock AudioContext), `src/ui/SoundController.tsx` (new), `src/ui/HUD.tsx` (only mount `<SoundController />`), `src/data/config.ts` (only add a `SOUND` block: volumes, enabled flags), `coord/results/T10-sounds.md`.

1. `sound.ts`: lazy AudioContext created on first user gesture; `playClick(on: boolean)` soft clay switch click (short filtered noise + pitch blip, higher for on); `setFanHum(level 0..1)` low quiet filtered hum loop with smooth gain ramps; `playThunder()` low rumble for power cut flicker; `playPowerUp()` gentle rising tone for restore; `setMuted(bool)` ramps master gain. Everything silent if AudioContext unavailable.
2. `SoundController.tsx`: subscribes to the store (zustand `subscribe`) - click on any `on` change or pick, fan hum while fan is powered (use `isPowered`), thunder when powerCut becomes 'flicker', power-up when it returns to 'off'. Respects `muted`. Mute is OFF by default but nothing plays before first user interaction.
3. Tests: muted -> master gain 0; no throw without AudioContext.
Done = build + tests pass.
