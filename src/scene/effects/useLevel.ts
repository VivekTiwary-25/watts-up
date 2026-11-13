import { useState } from 'react'
import type { Anchor } from '../layout'
import { ANCHORS } from '../layout'
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
  const [level] = useState<Level>(() => ({ v: 0 }))
  useFrame((_, dt) => {
    level.v = ease(level.v, targetLevel(useHouse.getState(), id, MAINS.flicker), dt, MOTION.reduce, easeRate())
  })
  return level
}

/** Layout anchor of a single-instance appliance (everything but `light`). */
export function anchorOf(id: Exclude<ApplianceId, 'light'>): Anchor {
  const a = ANCHORS.find((x) => x.id === id)
  if (!a) throw new Error(`no anchor for ${id}`)
  return a
}

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
