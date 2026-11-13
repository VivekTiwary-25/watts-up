// Shared, mutable per-frame state for all effects. Written by <MainsDriver/> once per frame,
// read by every effect's useFrame. Plain objects: no React re-renders, no allocations.
import type { HouseState, PowerCutPhase } from '@/store/useHouse'
import { POWER_CUT, VISUALS } from '@/data/config'
import { blackoutLevel, ease, flickerFactor } from './drive'

const mq =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

export const MOTION = { reduce: mq?.matches ?? false }
mq?.addEventListener?.('change', (e) => {
  MOTION.reduce = e.matches
})

export interface Mains {
  phase: PowerCutPhase
  /** performance.now() when `phase` last changed */
  since: number
  /** mains supply 0..1 (stutters during 'flicker') */
  flicker: number
  /** eased house darkness 0..1 */
  blackout: number
}

export const MAINS: Mains = { phase: 'off', since: 0, flicker: 1, blackout: 0 }

/** Ease rate: fast while flickering so the stutter reads, gentle otherwise. */
export const easeRate = (m: Mains = MAINS) => (m.phase === 'flicker' ? 40 : VISUALS.easeRate)

/**
 * Advance mains state one frame (mutates `m`). Power cut: 'flicker' stutters for
 * POWER_CUT.flickerMs then dies; 'choosing'/'result' stay dark (only picks run).
 */
export function stepMains(
  m: Mains,
  s: Pick<HouseState, 'powerCut'>,
  now: number,
  dt: number,
  reduce: boolean,
): Mains {
  if (s.powerCut !== m.phase) {
    m.phase = s.powerCut
    m.since = now
  }
  m.flicker =
    s.powerCut === 'off'
      ? 1
      : s.powerCut === 'flicker'
        ? flickerFactor(now - m.since, POWER_CUT.flickerMs, reduce)
        : 0
  m.blackout = ease(m.blackout, blackoutLevel(s, m.flicker), dt, reduce, easeRate(m))
  return m
}
