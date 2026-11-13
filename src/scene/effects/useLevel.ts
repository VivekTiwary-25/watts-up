import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ApplianceId } from '@/store/useHouse'
import { useHouse } from '@/store/useHouse'
import { ease, targetLevel } from './drive'
import { MAINS, MOTION, easeRate } from './mains'

export interface Level { v: number }

/**
 * Eased 0..1 "how much is this appliance running" for effects. Updated in useFrame (no re-renders).
 * Call it before the component's own useFrame so the value is fresh in the same frame.
 */
export function useLevel(id: ApplianceId): Level {
  const level = useRef<Level>({ v: 0 }).current
  useFrame((_, dt) => {
    level.v = ease(level.v, targetLevel(useHouse.getState(), id, MAINS.flicker), dt, MOTION.reduce, easeRate())
  })
  return level
}

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
