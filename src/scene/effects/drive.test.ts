import { describe, expect, it } from 'vitest'
import { APPLIANCES, type ApplianceId } from '@/data/appliances'
import { POWER_CUT } from '@/data/config'
import { FLOOR, PLUGS } from '../layout'
import {
  assignLanes,
  blackoutLevel,
  ease,
  feedRoute,
  flickerFactor,
  plugRoute,
  targetLevel,
  wireHeat,
  wireWidth,
  WIRING,
  type DriveState,
} from './drive'

const allOff = Object.fromEntries(APPLIANCES.map((a) => [a.id, false])) as Record<
  ApplianceId,
  boolean
>
const base: DriveState = {
  powerCut: 'off',
  on: { ...allOff, fan: true, light: true },
  picks: [],
  savedOn: null,
}

describe('ease', () => {
  it('moves toward target without overshoot', () => {
    const v = ease(0, 1, 0.016, false)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(1)
  })
  it('snaps under reduced motion', () => expect(ease(0, 1, 0.016, true)).toBe(1))
  it('settles exactly', () => expect(ease(0.9995, 1, 0.016, false)).toBe(1))
})

describe('flickerFactor', () => {
  it('is full at start, dead after flickerMs, dead when reduced', () => {
    expect(flickerFactor(0, POWER_CUT.flickerMs)).toBe(1)
    expect(flickerFactor(POWER_CUT.flickerMs, POWER_CUT.flickerMs)).toBe(0)
    expect(flickerFactor(100, POWER_CUT.flickerMs, true)).toBe(0)
  })
  it('actually flickers (has both dropouts and on frames)', () => {
    const vals = Array.from({ length: 20 }, (_, i) =>
      flickerFactor(i * 70 + 1, POWER_CUT.flickerMs),
    )
    expect(vals.some((v) => v < 0.1)).toBe(true)
    expect(vals.some((v) => v > 0.5)).toBe(true)
  })
})

describe('targetLevel / blackoutLevel', () => {
  it('follows `on` with mains', () => {
    expect(targetLevel(base, 'fan', 1)).toBe(1)
    expect(targetLevel(base, 'ac', 1)).toBe(0)
    expect(blackoutLevel(base, 1)).toBe(0)
  })
  it('stutters what was on during flicker', () => {
    const s: DriveState = { ...base, powerCut: 'flicker', savedOn: base.on, on: base.on }
    expect(targetLevel(s, 'fan', 0.3)).toBe(0.3)
    expect(targetLevel(s, 'ac', 0.3)).toBe(0)
    expect(blackoutLevel(s, 0)).toBe(1)
  })
  it('runs only the picks after the flicker', () => {
    const s: DriveState = { ...base, powerCut: 'choosing', picks: ['fridge', 'fan', 'tv'] }
    expect(targetLevel(s, 'fridge', 0)).toBe(1)
    expect(targetLevel(s, 'light', 0)).toBe(0)
    expect(blackoutLevel(s, 0)).toBe(1)
  })
})

describe('wires', () => {
  it('width grows with watts and stays thin', () => {
    expect(wireWidth(1500)).toBeGreaterThan(wireWidth(40))
    expect(wireWidth(0)).toBe(WIRING.width.min)
    expect(wireWidth(99999)).toBe(WIRING.width.max)
  })
  it('heat is clamped 0..1', () => {
    expect(wireHeat(5000)).toBe(1)
    expect(wireHeat(-1)).toBe(0)
  })
  it('has one plug per appliance plus one light per room', () => {
    expect(PLUGS.filter((p) => p.id === 'light')).toHaveLength(4)
    expect(new Set(PLUGS.map((p) => p.key)).size).toBe(PLUGS.length)
  })

  const lanes = assignLanes(PLUGS)
  const routes = PLUGS.map((p) => plugRoute(p.position, lanes.get(p.key)!))

  it('gives every plug its own lane', () => {
    expect(lanes.size).toBe(PLUGS.length)
    expect(new Set(lanes.values()).size).toBe(PLUGS.length)
  })
  it('routes are axis-aligned and stay inside the footprint', () => {
    for (const r of [...routes, feedRoute().slice(2)]) {
      for (const [x, , z] of r) {
        expect(Math.abs(x)).toBeLessThan(FLOOR.width / 2 - 0.1)
        expect(Math.abs(z)).toBeLessThan(FLOOR.depth / 2 - 0.1)
      }
      for (let i = 1; i < r.length; i++) {
        const changed = [0, 1, 2].filter((k) => Math.abs(r[i][k] - r[i - 1][k]) > 1e-6)
        expect(changed).toHaveLength(1)
      }
    }
  })
  it('runs along the floor and only rises at the end, to the plug', () => {
    PLUGS.forEach((p, i) => {
      const r = routes[i]
      r.slice(0, -1).forEach((pt) => expect(pt[1]).toBe(WIRING.y))
      const end = r[r.length - 1]
      expect(end[1]).toBeCloseTo(Math.max(WIRING.y, p.position[1]))
      expect(Math.hypot(end[0] - p.position[0], end[2] - p.position[2])).toBeLessThan(0.2)
    })
  })
  it('starts each wire on the feed line', () => {
    const feed = feedRoute()
    const [, , zEnd] = feed[feed.length - 1]
    const [, , zStart] = feed[2]
    for (const r of routes) {
      expect(r[0][0]).toBe(WIRING.feedX)
      expect(r[0][2]).toBeGreaterThanOrEqual(Math.min(zStart, zEnd))
      expect(r[0][2]).toBeLessThanOrEqual(Math.max(zStart, zEnd))
    }
  })
})
