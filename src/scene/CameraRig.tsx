import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useHouse } from '@/store/useHouse'
import { OVERVIEW, ROOMS } from './layout'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Owns the camera. Flies to the overview or the focused room whenever `view`/`focusRoom` change. */
export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const view = useHouse((s) => s.view)
  const focusRoom = useHouse((s) => s.focusRoom)
  const first = useRef(true)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const shot = view === 'room' && focusRoom ? ROOMS[focusRoom] : OVERVIEW
    const animate = !first.current && !prefersReducedMotion()
    first.current = false
    void c.setLookAt(...shot.cameraPos, ...shot.cameraTarget, animate)
  }, [view, focusRoom])

  // Esc → back to overview (UI back button lives in T04).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useHouse.getState().view === 'room') useHouse.getState().backToOverview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      smoothTime={0.6}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minDistance={3}
      maxDistance={28}
    />
  )
}
