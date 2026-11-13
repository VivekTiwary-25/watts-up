// Shared, mutable per-frame state for all effects. Written by <MainsDriver/> once per frame,
// read by every effect's useFrame. Plain objects: no React re-renders, no allocations.
import type { PowerCutPhase } from '@/store/useHouse'
import { VISUALS } from '@/data/config'

const mq =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

export const MOTION = { reduce: mq?.matches ?? false }
mq?.addEventListener?.('change', (e) => {
  MOTION.reduce = e.matches
})

export const MAINS = {
  phase: 'off' as PowerCutPhase,
  /** performance.now() when `phase` last changed */
  since: 0,
  /** mains supply 0..1 (stutters during 'flicker') */
  flicker: 1,
  /** eased house darkness 0..1 */
  blackout: 0,
}

/** Ease rate: fast while flickering so the stutter reads, gentle otherwise. */
export const easeRate = () => (MAINS.phase === 'flicker' ? 40 : VISUALS.easeRate)
