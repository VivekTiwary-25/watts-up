import { cleanup, renderHook } from '@testing-library/react'
import type { ThreeEvent } from '@react-three/fiber'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useHouse } from '@/store/useHouse'
import { useApplianceInteraction } from './useApplianceInteraction'

beforeEach(() => {
  useHouse.setState(useHouse.getInitialState(), true)
})
afterEach(cleanup)

type Handlers = ReturnType<typeof useApplianceInteraction>

/** Fake R3F event: only the fields the handlers read. */
function ev<T>(fields: { pointerType?: string; delta?: number }) {
  return {
    stopPropagation() {},
    delta: 0,
    pointerType: 'mouse',
    ...fields,
  } as unknown as ThreeEvent<T>
}

function tap(h: Handlers, pointerType: string, delta = 0) {
  h.onPointerDown(ev<PointerEvent>({ pointerType }))
  h.onClick(ev<MouseEvent>({ delta }))
}

describe('useApplianceInteraction', () => {
  it('mouse click toggles and selects', () => {
    const { result } = renderHook(() => useApplianceInteraction('ac'))
    tap(result.current, 'mouse')
    expect(useHouse.getState().on.ac).toBe(true)
    expect(useHouse.getState().selected).toBe('ac')
  })

  it('touch: first tap only selects, second tap toggles', () => {
    const { result } = renderHook(() => useApplianceInteraction('ac'))
    tap(result.current, 'touch')
    expect(useHouse.getState().selected).toBe('ac')
    expect(useHouse.getState().on.ac).toBe(false)
    tap(result.current, 'touch')
    expect(useHouse.getState().on.ac).toBe(true)
  })

  it('ignores clicks that were camera drags', () => {
    const { result } = renderHook(() => useApplianceInteraction('ac'))
    tap(result.current, 'mouse', 40)
    tap(result.current, 'touch', 40)
    expect(useHouse.getState().on.ac).toBe(false)
    expect(useHouse.getState().selected).toBeNull()
  })

  it('touch hover never sticks on pointer over', () => {
    const { result } = renderHook(() => useApplianceInteraction('ac'))
    result.current.onPointerOver(ev<PointerEvent>({ pointerType: 'touch' }))
    expect(useHouse.getState().hovered).toBeNull()
  })

  it('pointer out does not clear another appliance hover', () => {
    const fan = renderHook(() => useApplianceInteraction('fan')).result.current
    const ac = renderHook(() => useApplianceInteraction('ac')).result.current
    fan.onPointerOver(ev<PointerEvent>({}))
    ac.onPointerOver(ev<PointerEvent>({}))
    fan.onPointerOut(ev<PointerEvent>({}))
    expect(useHouse.getState().hovered).toBe('ac')
  })

  it('during a power cut a click picks and records the 3D pick', () => {
    useHouse.getState().startPowerCut()
    useHouse.getState().setPowerCutPhase('choosing')
    const { result } = renderHook(() => useApplianceInteraction('fridge'))
    tap(result.current, 'mouse')
    expect(useHouse.getState().picks).toEqual(['fridge'])
  })
})
