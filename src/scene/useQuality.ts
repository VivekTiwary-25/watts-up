import { create } from 'zustand'

export type QualityTier = 'high' | 'low'

interface QualityState {
  tier: QualityTier
  /** PerformanceMonitor gave up flip-flopping: stay low for the session. */
  locked: boolean
  setTier(tier: QualityTier): void
  lockLow(): void
}

/** Render-quality tier, written by <Quality/> and read by PostFX / shadows. Scene-only state. */
export const useQuality = create<QualityState>((set, get) => ({
  tier: 'high',
  locked: false,
  setTier: (tier) => {
    if (get().locked || get().tier === tier) return
    set({ tier })
  },
  lockLow: () => set({ tier: 'low', locked: true }),
}))

/**
 * Shadow maps are cached (renderer.shadowMap.autoUpdate = false, see <ShadowCache/>).
 * Anything that needs live shadow maps for a while (e.g. AccumulativeShadows while it
 * bakes) asks for N frames of live updates here.
 */
export const SHADOWS = { liveFrames: 0, dirty: true }

export function requestLiveShadows(frames: number) {
  SHADOWS.liveFrames = Math.max(SHADOWS.liveFrames, frames)
}

export function markShadowsDirty() {
  SHADOWS.dirty = true
}
