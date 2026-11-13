// Pure helpers that decide how "on" each effect should be. No three.js, no React: unit-tested.
import type { ApplianceId, HouseState } from '@/store/useHouse'
import { VISUALS } from '@/data/config'
import type { Vec3 } from '../layout'

export type DriveState = Pick<HouseState, 'powerCut' | 'on' | 'picks' | 'savedOn'>

/** Frame-rate independent exponential ease toward `target`. Snaps when `reduce` is true. */
export function ease(current: number, target: number, dt: number, reduce: boolean, rate: number = VISUALS.easeRate): number {
  if (reduce) return target
  const next = current + (target - current) * (1 - Math.exp(-dt * rate))
  return Math.abs(next - target) < 1e-3 ? target : next
}

/** Cheap deterministic hash in [0, 1). */
function hash(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

/**
 * Mains supply during the power-cut 'flicker' phase: stutters on/off, dropouts get more likely,
 * and it is fully dead from `flickerMs` on. Returns 0..1.
 */
export function flickerFactor(elapsedMs: number, flickerMs: number, reduce = false): number {
  if (reduce || elapsedMs >= flickerMs) return 0
  if (elapsedMs <= 0) return 1
  const p = elapsedMs / flickerMs
  const step = Math.floor(elapsedMs / 70) // a new on/off decision every 70 ms
  return hash(step + 1) > p * 0.95 ? 1 - p * 0.4 : 0.04
}

/**
 * Target level (0 or `flicker`) for one appliance. During 'flicker' what was on keeps stuttering;
 * afterwards only the picks run (see `isPowered` in the store).
 */
export function targetLevel(s: DriveState, id: ApplianceId, flicker: number): number {
  if (s.powerCut === 'off') return s.on[id] ? 1 : 0
  if (s.powerCut === 'flicker') return (s.savedOn ?? s.on)[id] ? flicker : 0
  return s.picks.includes(id) ? 1 : 0
}

/** House-wide darkness: 0 = mains on, 1 = blackout (power cut, after the flicker). */
export function blackoutLevel(s: Pick<HouseState, 'powerCut'>, flicker: number): number {
  if (s.powerCut === 'off') return 0
  if (s.powerCut === 'flicker') return 1 - flicker
  return 1
}

/** Wire thickness in world units for a load. */
export function wireWidth(watts: number): number {
  return VISUALS.wire.baseWidth + Math.max(0, watts) * VISUALS.wire.widthPerWatt
}

/** 0..1 how "heavy" a load is, used to tint wires from cool to hot. */
export function wireHeat(watts: number): number {
  return Math.min(1, Math.max(0, watts / VISUALS.wire.highWatts))
}

/** Bezier control point: midway in plan, lifted well above the walls (longer runs arc higher). */
export function wireMid(start: Vec3, end: Vec3): Vec3 {
  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  const dist = Math.hypot(dx, dz)
  const y = Math.max(start[1], end[1]) + VISUALS.wire.lift + dist * VISUALS.wire.liftPerUnit
  return [(start[0] + end[0]) / 2, y, (start[2] + end[2]) / 2]
}

/** Point on a quadratic bezier (for tests / sanity checks). */
export function bezierAt(a: Vec3, c: Vec3, b: Vec3, t: number): Vec3 {
  const u = 1 - t
  return [0, 1, 2].map((i) => u * u * a[i] + 2 * u * t * c[i] + t * t * b[i]) as Vec3
}
