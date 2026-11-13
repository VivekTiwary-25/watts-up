import { describe, expect, it } from 'vitest'
import { POWER_CUT } from '@/data/config'
import { stepMains, type Mains } from './mains'

const fresh = (): Mains => ({ phase: 'off', since: 0, flicker: 1, blackout: 0 })

/** Run the driver at 60 fps from `t0` for `ms`, collecting flicker values. */
function run(m: Mains, phase: Mains['phase'], t0: number, ms: number, reduce = false) {
  const seen: number[] = []
  for (let t = t0; t < t0 + ms; t += 1000 / 60) {
    stepMains(m, { powerCut: phase }, t, 1 / 60, reduce)
    seen.push(m.flicker)
  }
  return seen
}

describe('stepMains (power cut sequence)', () => {
  it('stays fully lit with mains on', () => {
    const m = fresh()
    run(m, 'off', 0, 500)
    expect(m.flicker).toBe(1)
    expect(m.blackout).toBe(0)
  })

  it('flickers, then goes dark, and stays dark while choosing', () => {
    const m = fresh()
    run(m, 'off', 0, 100)
    const seen = run(m, 'flicker', 100, POWER_CUT.flickerMs + 600)
    expect(m.since).toBe(100)
    expect(seen.some((v) => v > 0.5)).toBe(true) // still on at times…
    expect(seen.some((v) => v < 0.1)).toBe(true) // …with dropouts
    expect(m.flicker).toBe(0)
    expect(m.blackout).toBeGreaterThan(0.95)
    run(m, 'choosing', 3000, 500)
    expect(m.blackout).toBe(1)
  })

  it('lights come back on restore', () => {
    const m = fresh()
    run(m, 'result', 0, 2000)
    run(m, 'off', 2000, 4000)
    expect(m.flicker).toBe(1)
    expect(m.blackout).toBe(0)
  })

  it('snaps to dark immediately with reduced motion', () => {
    const m = fresh()
    stepMains(m, { powerCut: 'flicker' }, 10, 1 / 60, true)
    expect(m.flicker).toBe(0)
    expect(m.blackout).toBe(1)
  })
})
