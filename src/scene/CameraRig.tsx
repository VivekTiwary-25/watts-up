import { useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useHouse } from '@/store/useHouse'
import { MOTION } from './effects/mains'
import { VILLA_CUT_SHOT, VILLA_SHOT, villaOrbit } from './IntroVilla'
import { ROOMS } from './layout'
import {
  OVERHEAD_LIMITS,
  RESET_VIEW_EVENT,
  ROOM_LIMITS,
  overheadShot,
  roomEyeShot,
} from './cameraShots'

const { ACTION } = CameraControlsImpl

/** Mouse/touch mapping per view. No truck (pan) anywhere, so the house can't leave the screen. */
function applyInput(c: CameraControls, firstPerson: boolean) {
  c.mouseButtons.left = ACTION.ROTATE
  c.mouseButtons.right = ACTION.ROTATE
  c.mouseButtons.middle = firstPerson ? ACTION.NONE : ACTION.DOLLY
  c.mouseButtons.wheel = firstPerson ? ACTION.NONE : ACTION.DOLLY
  c.touches.one = ACTION.TOUCH_ROTATE
  c.touches.two = firstPerson ? ACTION.NONE : ACTION.TOUCH_DOLLY
  c.touches.three = ACTION.NONE
  // first person: dragging turns the head (camera-controls' first-person recipe)
  c.azimuthRotateSpeed = firstPerson ? -0.35 : 1
  c.polarRotateSpeed = firstPerson ? -0.35 : 1
}

/** Owns the camera. Flies to the overview or into the focused room whenever `view`/`focusRoom` change. */
export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const view = useHouse((s) => s.view)
  const focusRoom = useHouse((s) => s.focusRoom)
  const villa = useHouse((s) => s.villa)
  // "Villa" view: orbitable look into the cut-open villa (the intro has its own orbit)
  const villaView = villa && view !== 'intro'
  const roomView = view === 'room' && focusRoom !== null && !villaView
  // bucketed so small resizes don't re-fly the camera
  const width = useThree((s) => Math.round(s.size.width / 40) * 40)
  const height = useThree((s) => Math.round(s.size.height / 40) * 40)
  const first = useRef(true)
  const introTime = useRef(0)

  /** Fly to the shot for the current view. */
  const applyShot = useCallback(
    (animate: boolean) => {
      const c = ref.current
      if (!c) return
      if (view === 'intro') {
        introTime.current = 0
        void c.setFocalOffset(0, 0, 0, false)
        void c.setLookAt(...villaOrbit(0, MOTION.reduce), ...VILLA_SHOT.target, false)
        return
      }
      if (villaView) {
        c.smoothTime = 1.2
        void c.setFocalOffset(0, 0, 0, animate)
        void c.setLookAt(...VILLA_CUT_SHOT.cameraPos, ...VILLA_CUT_SHOT.cameraTarget, animate)
        return
      }
      if (roomView && focusRoom) {
        const shot = roomEyeShot(ROOMS[focusRoom])
        c.smoothTime = 0.8
        void c.setFocalOffset(0, 0, 0, animate)
        void c.setLookAt(...shot.eye, ...shot.cameraTarget, animate)
        return
      }
      const shot = overheadShot({ width, height })
      c.smoothTime = 1.2
      void c.setFocalOffset(...shot.focalOffset, animate)
      void c.setLookAt(...shot.cameraPos, ...shot.cameraTarget, animate)
    },
    [view, villaView, roomView, focusRoom, width, height],
  )

  // overview re-fits on resize; the room view keeps where the player turned their head
  const fitKey = view === 'overview' && !villaView ? `${width}x${height}` : ''
  const applyRef = useRef(applyShot)
  useEffect(() => {
    applyRef.current = applyShot
  }, [applyShot])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    applyInput(c, roomView)
    const animate = !first.current && !MOTION.reduce && view !== 'intro'
    first.current = false
    applyRef.current(animate)
  }, [view, focusRoom, villaView, roomView, fitKey])

  // "Reset view" button in the HUD
  useEffect(() => {
    const onReset = () => applyRef.current(!MOTION.reduce)
    window.addEventListener(RESET_VIEW_EVENT, onReset)
    return () => window.removeEventListener(RESET_VIEW_EVENT, onReset)
  }, [])

  useFrame((_, delta) => {
    const c = ref.current
    // MOTION.reduce is a cached media-query flag: no matchMedia() call per frame
    if (!c || view !== 'intro' || MOTION.reduce) return
    // slow orbit around the villa exterior
    introTime.current += delta
    void c.setLookAt(...villaOrbit(introTime.current), ...VILLA_SHOT.target, false)
  })

  // Esc → back to overview
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useHouse.getState().view === 'room')
        useHouse.getState().backToOverview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const wide = view === 'intro' || villaView
  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={view !== 'intro'}
      truckSpeed={0}
      smoothTime={roomView ? 0.8 : 1.2}
      minPolarAngle={roomView ? ROOM_LIMITS.minPolar : wide ? 0.15 : OVERHEAD_LIMITS.minPolar}
      maxPolarAngle={
        roomView ? ROOM_LIMITS.maxPolar : wide ? Math.PI / 2 - 0.08 : OVERHEAD_LIMITS.maxPolar
      }
      minDistance={roomView ? ROOM_LIMITS.lookDistance / 2 : wide ? 3 : OVERHEAD_LIMITS.minDistance}
      maxDistance={
        roomView ? ROOM_LIMITS.lookDistance * 2 : wide ? 90 : OVERHEAD_LIMITS.maxDistance
      }
    />
  )
}
