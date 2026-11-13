import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { POWER_CUT } from '@/data/config'
import { useHouse } from '@/store/useHouse'
import { blackoutLevel, ease, flickerFactor } from './drive'
import { MAINS, MOTION, easeRate } from './mains'

/**
 * Must mount before the other effects (useFrame runs in subscription order).
 * Tracks power-cut phase timing and keeps frames coming: the Canvas is `frameloop="demand"`,
 * so while motion is allowed we invalidate every frame; with reduced motion everything snaps,
 * so one frame per store change is enough.
 */
export function MainsDriver() {
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => useHouse.subscribe(() => invalidate()), [invalidate])

  useFrame((_, dt) => {
    const s = useHouse.getState()
    const now = performance.now()
    if (s.powerCut !== MAINS.phase) {
      MAINS.phase = s.powerCut
      MAINS.since = now
    }
    MAINS.flicker =
      s.powerCut === 'off' ? 1 : s.powerCut === 'flicker' ? flickerFactor(now - MAINS.since, POWER_CUT.flickerMs, MOTION.reduce) : 0
    MAINS.blackout = ease(MAINS.blackout, blackoutLevel(s, MAINS.flicker), dt, MOTION.reduce, easeRate())
    if (!MOTION.reduce) invalidate()
  })

  return null
}
