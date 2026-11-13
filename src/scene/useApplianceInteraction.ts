import { useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useHouse, type ApplianceId } from '@/store/useHouse'

/** True while this appliance is hovered or selected (drives the outline). */
export function useHighlighted(id: ApplianceId) {
  return useHouse((s) => s.hovered === id || s.selected === id)
}

/** Pointer handlers shared by placeholder boxes and GLB models. */
export function useApplianceInteraction(id: ApplianceId) {
  const pointerType = useRef<string>('mouse')

  return useMemo(() => {
    const activate = () => {
      const s = useHouse.getState()
      if (s.powerCut !== 'off') s.pick(id)
      else s.toggle(id)
      s.select(id)
    }
    return {
      onPointerOver(e: ThreeEvent<PointerEvent>) {
        e.stopPropagation()
        if (e.pointerType === 'touch') return // touch hover is handled by the first tap
        useHouse.getState().setHovered(id)
        document.body.style.cursor = 'pointer'
      },
      onPointerOut(e: ThreeEvent<PointerEvent>) {
        e.stopPropagation()
        if (useHouse.getState().hovered === id && e.pointerType !== 'touch') useHouse.getState().setHovered(null)
        document.body.style.cursor = ''
      },
      onPointerDown(e: ThreeEvent<PointerEvent>) {
        pointerType.current = e.pointerType
      },
      onClick(e: ThreeEvent<MouseEvent>) {
        e.stopPropagation()
        if (e.delta > 6) return // was a camera drag
        const s = useHouse.getState()
        if (pointerType.current === 'touch' && s.selected !== id) {
          // first tap: hover + select only; second tap toggles
          s.setHovered(id)
          s.select(id)
          return
        }
        activate()
      },
    }
  }, [id])
}
