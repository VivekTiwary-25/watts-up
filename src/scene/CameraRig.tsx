import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { useHouse } from '@/store/useHouse'
import { MOTION } from './effects/mains'
import { VILLA_SHOT, villaOrbit } from './IntroVilla'
import { ROOMS, fitShot, overviewShot } from './layout'

/** Owns the camera. Flies to the overview or the focused room whenever `view`/`focusRoom` change. */
export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const view = useHouse((s) => s.view)
  const focusRoom = useHouse((s) => s.focusRoom)
  // rounded so small resizes don't re-fly the camera
  const aspect = useThree((s) => Math.round((s.size.width / (s.size.height || 1)) * 10) / 10)
  const first = useRef(true)
  const introTime = useRef(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (view === 'intro') {
      introTime.current = 0
      void c.setLookAt(...villaOrbit(0, MOTION.reduce), ...VILLA_SHOT.target, false)
      first.current = false
      return
    }
    // room shots pull back on portrait screens so the whole room stays in frame
    const shot =
      view === 'room' && focusRoom ? fitShot(ROOMS[focusRoom], aspect) : overviewShot(aspect)
    const animate = !first.current && !MOTION.reduce
    first.current = false
    c.smoothTime = view === 'overview' ? 1.2 : 0.6
    void c.setLookAt(...shot.cameraPos, ...shot.cameraTarget, animate)
  }, [view, focusRoom, aspect])

  useFrame((_, delta) => {
    const c = ref.current
    // MOTION.reduce is a cached media-query flag: no matchMedia() call per frame
    if (!c || view !== 'intro' || MOTION.reduce) return
    // slow orbit around the villa exterior
    introTime.current += delta
    void c.setLookAt(...villaOrbit(introTime.current), ...VILLA_SHOT.target, false)
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
      maxDistance={view === 'intro' ? 90 : 28}
    />
  )
}
