// Pure helpers that decide how "on" each effect should be. No three.js, no React: unit-tested.
import type { ApplianceId, HouseState } from '@/store/useHouse'
import { VISUALS } from '@/data/config'
import type { Vec3 } from '../layout'

export type DriveState = Pick<HouseState, 'powerCut' | 'on' | 'picks' | 'savedOn'>

/** Frame-rate independent exponential ease toward `target`. Snaps when `reduce` is true. */
export function ease(
  current: number,
  target: number,
  dt: number,
  reduce: boolean,
  rate: number = VISUALS.easeRate,
): number {
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

/**
 * Floor wiring: the meter hangs on the outer east wall; one feed drops to the floor, enters
 * through the wall and runs north along `feedX` to a bus of parallel floor lanes near the middle
 * wall. Each appliance wire leaves the feed on its own lane, runs west, turns along z to its
 * plug and rises vertically to it. Everything after the wall entry stays inside the footprint.
 */
export const WIRING = {
  meter: { position: [6.17, 1.2, 4.6] as Vec3, size: [0.18, 0.5, 0.34] as Vec3 },
  /** Conduit from the meter's bottom, between the wall face and the box back. */
  conduitX: 6.1,
  y: 0.03,
  feedX: 5.8,
  busZ: 0.2,
  laneGap: 0.035,
  /** Half-extents the wires never leave (house footprint, inside the walls). */
  limit: { x: 5.88, z: 4.88 },
  width: { min: 0.008, max: 0.02 },
} as const

/** Wire thickness in world units for a load: thin for small loads, never above `width.max`. */
export function wireWidth(watts: number): number {
  const { min, max } = WIRING.width
  return min + (max - min) * Math.sqrt(wireHeat(watts))
}

/** 0..1 how "heavy" a load is, used to tint wires from cool to hot. */
export function wireHeat(watts: number): number {
  return Math.min(1, Math.max(0, watts / VISUALS.wire.highWatts))
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Drop consecutive duplicate points (zero-length segments). */
function dedupe(points: Vec3[]): Vec3[] {
  return points.filter((p, i) => i === 0 || p.some((v, k) => Math.abs(v - points[i - 1][k]) > 1e-6))
}

/** Meter → floor → through the east wall → north along `feedX` to the first bus lane. */
export function feedRoute(w: typeof WIRING = WIRING): Vec3[] {
  const [, my, mz] = w.meter.position
  const bottom = my - w.meter.size[1] / 2
  return [
    [w.conduitX, bottom, mz],
    [w.conduitX, w.y, mz],
    [w.feedX, w.y, mz],
    [w.feedX, w.y, w.busZ],
  ]
}

/**
 * Bus lane (z) per plug key. Wires heading north of the bus take the lowest lanes, sorted east
 * to west, and wires heading south take the upper lanes, sorted west to east, so no branch
 * crosses another lane on its way to its plug.
 */
export function assignLanes(
  plugs: { key: string; position: Vec3 }[],
  w: typeof WIRING = WIRING,
): Map<string, number> {
  const north = plugs.filter((p) => p.position[2] < w.busZ)
  const south = plugs.filter((p) => p.position[2] >= w.busZ)
  north.sort((a, b) => b.position[0] - a.position[0])
  south.sort((a, b) => a.position[0] - b.position[0])
  const lanes = new Map<string, number>()
  ;[...north, ...south].forEach((p, i) => lanes.set(p.key, w.busZ + i * w.laneGap))
  return lanes
}

/**
 * Manhattan route for one plug: from the feed along its lane, along z to the plug, then a
 * vertical riser up to the plug height. Clamped to the footprint.
 */
export function plugRoute(plug: Vec3, laneZ: number, w: typeof WIRING = WIRING): Vec3[] {
  const px = clamp(plug[0], -w.limit.x, w.limit.x)
  const pz = clamp(plug[2], -w.limit.z, w.limit.z)
  const lane = clamp(laneZ, -w.limit.z, w.limit.z)
  const top = Math.max(w.y, plug[1])
  return dedupe([
    [w.feedX, w.y, lane],
    [px, w.y, lane],
    [px, w.y, pz],
    [px, top, pz],
  ])
}
