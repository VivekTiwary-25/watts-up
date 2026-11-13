import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useHouse } from '@/store/useHouse'
import { MAINS, MOTION, stepMains } from './mains'

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
    stepMains(MAINS, useHouse.getState(), performance.now(), dt, MOTION.reduce)
    if (!MOTION.reduce) invalidate()
  })

  return null
}
