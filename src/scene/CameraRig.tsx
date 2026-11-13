import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { useHouse } from '@/store/useHouse'
import { INTRO_CAMERA, OVERVIEW, ROOMS } from './layout'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Owns the camera. Flies to the overview or the focused room whenever `view`/`focusRoom` change. */
export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const view = useHouse((s) => s.view)
  const focusRoom = useHouse((s) => s.focusRoom)
  const first = useRef(true)
  const introTime = useRef(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (view === 'intro') {
      introTime.current = 0
      void c.setLookAt(...INTRO_CAMERA.start.cameraPos, ...INTRO_CAMERA.start.cameraTarget, false)
      first.current = false
      return
    }
    const shot = view === 'room' && focusRoom ? ROOMS[focusRoom] : OVERVIEW
    const animate = !first.current && !prefersReducedMotion()
    first.current = false
    c.smoothTime = view === 'overview' ? 1.2 : 0.6
    void c.setLookAt(...shot.cameraPos, ...shot.cameraTarget, animate)
  }, [view, focusRoom])

  useFrame((_, delta) => {
    const c = ref.current
    if (!c || view !== 'intro' || prefersReducedMotion()) return
    introTime.current += delta
    const phase = (introTime.current % 40) / 20
    const t = phase <= 1 ? phase : 2 - phase
    const mix = (a: number, b: number) => a + (b - a) * t
    void c.setLookAt(
      mix(INTRO_CAMERA.start.cameraPos[0], INTRO_CAMERA.end.cameraPos[0]),
      INTRO_CAMERA.start.cameraPos[1],
      INTRO_CAMERA.start.cameraPos[2],
      ...INTRO_CAMERA.start.cameraTarget,
      false,
    )
  })

  // Esc → back to overview (UI back button lives in T04).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useHouse.getState().view === 'room')
        useHouse.getState().backToOverview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={view !== 'intro'}
      smoothTime={view === 'overview' ? 1.2 : 0.6}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minDistance={3}
      maxDistance={28}
    />
  )
}
