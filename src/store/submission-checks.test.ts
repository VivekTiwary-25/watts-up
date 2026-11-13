import { beforeEach, describe, expect, it } from 'vitest'
import { APPLIANCES, type ApplianceId } from '../data/appliances'
import { DEFAULT_TARGET_BILL, TARGET_RANGE } from '../data/config'
import { computeBill, energyCharge } from '../lib/bill'
import { isValidSelection } from '../lib/powercut'
import { useHouse } from './useHouse'

const ALL_IDS = APPLIANCES.map((a) => a.id)

function currentTotal(): number {
  const { on, hours } = useHouse.getState()
  return computeBill(on, hours).total
}

beforeEach(() => useHouse.setState(useHouse.getInitialState(), true))

describe('DOC-03 test 1: invalid input', () => {
  it('ignores non-finite targets and clamps out-of-range ones', () => {
    const { setTarget } = useHouse.getState()
    setTarget(NaN)
    setTarget(Infinity)
    expect(useHouse.getState().targetBill).toBe(DEFAULT_TARGET_BILL)
    setTarget(0)
    expect(useHouse.getState().targetBill).toBe(TARGET_RANGE.min)
    setTarget(-500)
    expect(useHouse.getState().targetBill).toBe(TARGET_RANGE.min)
    setTarget(1_000_000)
    expect(useHouse.getState().targetBill).toBe(TARGET_RANGE.max)
  })
})

describe('DOC-03 test 2: happy path', () => {
  it('turning the AC on moves the bill from 850.04 to 2926.72', () => {
    expect(currentTotal()).toBeCloseTo(850.04, 2)
    useHouse.getState().toggle('ac')
    expect(currentTotal()).toBeCloseTo(2926.72, 2)
  })
})

describe('DOC-03 test 3: twist', () => {
  function enterChoosing() {
    useHouse.getState().startPowerCut()
    useHouse.getState().setPowerCutPhase('choosing')
  }

  it('blocks a 4th pick with the inverter message', () => {
    enterChoosing()
    const { pick } = useHouse.getState()
    pick('fridge')
    pick('router')
    pick('light')
    pick('fan')
    const state = useHouse.getState()
    expect(state.picks).toEqual(['fridge', 'router', 'light'])
    expect(state.pickError?.message).toBe('Inverter can only run 3 appliances')
  })

  it('only confirms with exactly 3 picks', () => {
    enterChoosing()
    const { pick } = useHouse.getState()
    pick('fridge')
    pick('router')
    expect(useHouse.getState().confirmPicks()).toBe(false)
    expect(useHouse.getState().powerCut).toBe('choosing')
    pick('light')
    expect(isValidSelection(useHouse.getState().picks)).toBe(true)
    expect(useHouse.getState().confirmPicks()).toBe(true)
    expect(useHouse.getState().powerCut).toBe('result')
  })

  it('never ends up with 4 picks, so a 4-pick confirm is impossible', () => {
    enterChoosing()
    const ids: ApplianceId[] = ['fridge', 'router', 'light', 'fan', 'tv']
    ids.forEach((id) => useHouse.getState().pick(id))
    expect(useHouse.getState().picks).toHaveLength(3)
    expect(isValidSelection(['fridge', 'router', 'light', 'fan'])).toBe(false)
  })
})

describe('DOC-03 test 4: reset', () => {
  it('restorePower returns the pre-cut switches', () => {
    const { toggle, startPowerCut, setPowerCutPhase, pick, confirmPicks, restorePower } =
      useHouse.getState()
    toggle('ac')
    const before = { ...useHouse.getState().on }
    startPowerCut()
    setPowerCutPhase('choosing')
    pick('fridge')
    pick('router')
    pick('light')
    confirmPicks()
    restorePower()
    const state = useHouse.getState()
    expect(state.on).toEqual(before)
    expect(state.powerCut).toBe('off')
    expect(state.picks).toEqual([])
  })

  it('a reload (fresh initial state) returns to the defaults', () => {
    useHouse.getState().toggle('ac')
    useHouse.getState().setTarget(300)
    useHouse.setState(useHouse.getInitialState(), true)
    expect(useHouse.getState().on.ac).toBe(false)
    expect(useHouse.getState().targetBill).toBe(DEFAULT_TARGET_BILL)
    expect(currentTotal()).toBeCloseTo(850.04, 2)
  })
})

describe('DOC-03 test 5: boundary', () => {
  it('has exact slab edges at 100 and 200 units', () => {
    expect(energyCharge(100)).toBe(400)
    expect(energyCharge(200)).toBe(1000)
    expect(energyCharge(201)).toBe(1008)
  })

  it('AC alone for 5 h/day is 225 units and exactly Rs 1,300', () => {
    const { setOn, setHours } = useHouse.getState()
    ALL_IDS.forEach((id) => setOn(id, id === 'ac'))
    setHours('ac', 5)
    expect(currentTotal()).toBe(1300)
    useHouse.getState().setTarget(1300)
    expect(useHouse.getState().targetBill).toBe(currentTotal())
  })
})
