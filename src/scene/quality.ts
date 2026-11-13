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
