import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { QUALITY } from '@/data/config'
import { useHouse } from '@/store/useHouse'
import { MOTION } from './effects/mains'
import { markShadowsDirty, SHADOWS, useQuality } from './useQuality'

/** Sustained fps -> quality tier. Skipped with reduced motion (demand frames would read as "slow"). */
function TierMonitor() {
  const setTier = useQuality((s) => s.setTier)
  const lockLow = useQuality((s) => s.lockLow)
  if (MOTION.reduce) return null
  return (
    <PerformanceMonitor
      bounds={(hz) => (hz > 90 ? [50, 90] : [40, 58])}
      flipflops={QUALITY.flipflops}
      onDecline={() => setTier('low')}
      onIncline={() => setTier('high')}
      onFallback={lockLow}
    />
  )
}

/**
 * DPR = tier cap x performance.current. performance.regress() (called while the user drags
 * the camera) dips `current` to QUALITY.regressMin and R3F restores it ~200 ms after the
 * last call. Same idea as drei <AdaptiveDpr/>, but tier-aware so the two don't fight.
 */
function AdaptiveResolution() {
  const tier = useQuality((s) => s.tier)
  const current = useThree((s) => s.performance.current)
  const setDpr = useThree((s) => s.setDpr)
  const regress = useThree((s) => s.performance.regress)
  const controls = useThree((s) => s.controls) as unknown as {
    addEventListener?: (type: string, fn: () => void) => void
    removeEventListener?: (type: string, fn: () => void) => void
  } | null

  useEffect(() => {
    const device = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    setDpr(Math.max(0.5, Math.min(device, QUALITY.dpr[tier]) * current))
  }, [tier, current, setDpr])

  useEffect(() => {
    if (!controls?.addEventListener) return
    const onControl = () => regress()
    controls.addEventListener('control', onControl)
    return () => controls.removeEventListener?.('control', onControl)
  }, [controls, regress])

  return null
}

/**
 * Shadow maps don't re-render every frame: autoUpdate is off and we refresh on store
 * changes, every QUALITY.shadowRefreshMs (catches late-loading models / spinning blades),
 * or while someone requested live frames (AccumulativeShadows baking).
 */
function ShadowCache() {
  const get = useThree((s) => s.get)
  const last = useRef(0)

  useEffect(() => {
    const shadowMap = get().gl.shadowMap
    const prev = shadowMap.autoUpdate
    shadowMap.autoUpdate = false
    markShadowsDirty()
    const unsub = useHouse.subscribe(markShadowsDirty)
    return () => {
      unsub()
      shadowMap.autoUpdate = prev
    }
  }, [get])

  useFrame((state) => {
    const gl = state.gl
    const now = performance.now()
    if (SHADOWS.liveFrames > 0) {
      SHADOWS.liveFrames--
      gl.shadowMap.autoUpdate = true
      return
    }
    gl.shadowMap.autoUpdate = false
    if (SHADOWS.dirty || now - last.current > QUALITY.shadowRefreshMs) {
      SHADOWS.dirty = false
      last.current = now
      gl.shadowMap.needsUpdate = true
    }
  })

  return null
}

/** Adaptive performance: fps tier monitor, adaptive DPR, cached shadow maps. */
export function Quality() {
  return (
    <>
      <TierMonitor />
      <AdaptiveResolution />
      <ShadowCache />
    </>
  )
}
