import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { APPLIANCES } from '../data/appliances'
import { DEFAULT_TARGET_BILL, HOURS, TARGET_RANGE } from '../data/config'
import { isPowered, useBill, useHouse } from './useHouse'

beforeEach(() => useHouse.setState(useHouse.getInitialState(), true))
afterEach(cleanup)

describe('house store', () => {
  it('initializes from the appliance catalog and config', () => {
    const state = useHouse.getState()
    for (const appliance of APPLIANCES) {
      expect(state.on[appliance.id]).toBe(appliance.isOnByDefault)
      expect(state.hours[appliance.id]).toBe(appliance.defaultHoursPerDay)
    }
    expect(state.targetBill).toBe(DEFAULT_TARGET_BILL)
    expect(state.view).toBe('intro')
  })

  it('toggles and explicitly sets appliances without changing other switches', () => {
    const before = useHouse.getState().on
    useHouse.getState().toggle('fan')
    expect(useHouse.getState().on).toEqual({ ...before, fan: false })
    expect(before.fan).toBe(true)
    useHouse.getState().setOn('ac', true)
    expect(useHouse.getState().on.ac).toBe(true)
  })

  it('sets daily hours and targets with finite bounds', () => {
    const { setHours, setTarget } = useHouse.getState()
    setHours('ac', 3.5)
    expect(useHouse.getState().hours.ac).toBe(3.5)
    setHours('ac', HOURS.min - 1)
    expect(useHouse.getState().hours.ac).toBe(HOURS.min)
    setHours('ac', HOURS.max + 1)
    setHours('ac', NaN)
    expect(useHouse.getState().hours.ac).toBe(HOURS.max)
    setTarget(1750)
    expect(useHouse.getState().targetBill).toBe(1750)
    setTarget(0)
    expect(useHouse.getState().targetBill).toBe(TARGET_RANGE.min)
    setTarget(10000)
    setTarget(Infinity)
    expect(useHouse.getState().targetBill).toBe(TARGET_RANGE.max)
  })

  it('updates navigation, focus, selection, hover and mute', () => {
    const actions = useHouse.getState()
    actions.setView('overview')
    expect(useHouse.getState().view).toBe('overview')
    actions.goToRoom('bedroom')
    expect(useHouse.getState()).toMatchObject({ view: 'room', focusRoom: 'bedroom' })
    actions.backToOverview()
    expect(useHouse.getState()).toMatchObject({ view: 'overview', focusRoom: null })
    actions.setHovered('ac')
    actions.select('ac')
    actions.toggleMute()
    expect(useHouse.getState()).toMatchObject({ hovered: 'ac', selected: 'ac', muted: true })
    actions.setHovered(null)
    actions.select(null)
    actions.toggleMute()
    expect(useHouse.getState()).toMatchObject({ hovered: null, selected: null, muted: false })
  })

  it('saves switches once, blocks the fourth pick, confirms three and restores exactly', () => {
    const actions = useHouse.getState()
    actions.toggle('ac')
    actions.toggle('fan')
    const saved = { ...useHouse.getState().on }
    actions.startPowerCut()
    expect(useHouse.getState()).toMatchObject({ savedOn: saved, powerCut: 'flicker', picks: [] })
    expect(useHouse.getState().savedOn).not.toBe(useHouse.getState().on)
    actions.setPowerCutPhase('choosing')
    actions.pick('fan')
    actions.pick('light')
    expect(actions.confirmPicks()).toBe(false)
    expect(useHouse.getState().powerCut).toBe('choosing')
    actions.pick('fridge')
    actions.pick('ac')
    expect(useHouse.getState().picks).toEqual(['fan', 'light', 'fridge'])
    expect(useHouse.getState().pickError).toEqual({
      id: 'ac', // the refused appliance
      message: 'Inverter can only run 3 appliances',
      at: expect.any(Number),
    })
    actions.pick('light')
    expect(useHouse.getState().pickError).toBeNull()
    actions.pick('light')
    expect(actions.confirmPicks()).toBe(true)
    expect(useHouse.getState().powerCut).toBe('result')
    actions.setOn('tv', false)
    actions.startPowerCut()
    expect(useHouse.getState().savedOn).toEqual(saved)
    actions.restorePower()
    expect(useHouse.getState()).toMatchObject({
      on: saved,
      savedOn: null,
      powerCut: 'off',
      picks: [],
      pickError: null,
    })
  })

  it('freezes confirmed picks until retry returns to choosing', () => {
    const actions = useHouse.getState()
    actions.startPowerCut()
    actions.setPowerCutPhase('choosing')
    actions.pick('fan')
    actions.pick('light')
    actions.pick('fridge')
    expect(actions.confirmPicks()).toBe(true)
    actions.pick('fan')
    expect(useHouse.getState().picks).toEqual(['fan', 'light', 'fridge'])
    expect(actions.confirmPicks()).toBe(false)
    actions.retryPicks()
    expect(useHouse.getState().powerCut).toBe('choosing')
    expect(useHouse.getState().picks).toEqual(['fan', 'light', 'fridge'])
    actions.pick('fan')
    expect(useHouse.getState().picks).toEqual(['light', 'fridge'])
    expect(isPowered(useHouse.getState(), 'fan')).toBe(false)
  })

  it('memoizes the bill by switches and hours', () => {
    const { result, rerender } = renderHook(useBill)
    const initial = result.current
    expect(initial.total).toBeCloseTo(850.04)
    act(() => useHouse.getState().setTarget(2000))
    rerender()
    expect(result.current).toBe(initial)
    act(() => useHouse.getState().toggle('ac'))
    expect(result.current.total).toBeGreaterThan(initial.total)
    const withAc = result.current
    act(() => useHouse.getState().setHours('ac', 1))
    expect(result.current.total).toBeLessThan(withAc.total)
  })
})
