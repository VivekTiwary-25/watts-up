import { describe, expect, it } from 'vitest'
import { APPLIANCES, type ApplianceId } from '@/data/appliances'
import { POWER_CUT, VISUALS } from '@/data/config'
import { PLUGS, WALL, WIRE_ORIGIN } from '../layout'
import {
  bezierAt,
  blackoutLevel,
  ease,
  flickerFactor,
  targetLevel,
  wireHeat,
  wireMid,
  wireWidth,
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
  it('width grows with watts', () => {
    expect(wireWidth(1500)).toBeGreaterThan(wireWidth(40))
    expect(wireWidth(0)).toBe(VISUALS.wire.baseWidth)
  })
  it('heat is clamped 0..1', () => {
    expect(wireHeat(5000)).toBe(1)
    expect(wireHeat(-1)).toBe(0)
  })
  it('has one plug per appliance plus one light per room', () => {
    expect(PLUGS.filter((p) => p.id === 'light')).toHaveLength(4)
    expect(new Set(PLUGS.map((p) => p.key)).size).toBe(PLUGS.length)
  })
  it('arcs over the walls for most of its length', () => {
    for (const p of PLUGS) {
      const mid = wireMid(WIRE_ORIGIN, p.position)
      for (let t = 0.1; t <= 0.8; t += 0.05) {
        expect(bezierAt(WIRE_ORIGIN, mid, p.position, t)[1]).toBeGreaterThan(WALL.height)
      }
    }
  })
})
