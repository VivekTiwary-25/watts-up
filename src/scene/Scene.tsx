import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { AccumulativeShadows, RandomizedLight, Stars, useProgress } from '@react-three/drei'
import { Selection } from '@react-three/postprocessing'
import { QUALITY } from '@/data/config'
import { ApplianceModel } from './ApplianceModel'
import { CameraRig } from './CameraRig'
import { Environment } from './Environment'
import { glbExists } from './glb'
import { House } from './House'
import { HouseModel } from './HouseModel'
import { Effects } from './effects/Effects'
import { MAINS } from './effects/mains'
import { lerp } from './effects/useLevel'
import { ALL_ANCHORS, FLOOR, METER } from './layout'
import { PostFX } from './PostFX'
import { Quality } from './Quality'
import { requestLiveShadows } from './useQuality'

function Meter() {
  return (
    <mesh name="meter" position={METER.position}>
      <boxGeometry args={METER.size} />
      <meshStandardMaterial color="#2a2f38" emissive="#3bd6a0" emissiveIntensity={0.25} roughness={0.6} />
    </mesh>
  )
}

/** Deep-navy vertical gradient as the scene background (one tiny canvas texture, no draw call). */
function NightSky() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height)
      g.addColorStop(0, QUALITY.sky.top)
      g.addColorStop(0.55, QUALITY.sky.mid)
      g.addColorStop(1, QUALITY.sky.horizon)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  const S = QUALITY.stars
  return (
    <>
      <primitive attach="background" object={texture} />
      <fog attach="fog" args={[QUALITY.fog.color, QUALITY.fog.near, QUALITY.fog.far]} />
      <Stars radius={S.radius} depth={S.depth} count={S.count} factor={S.factor} saturation={0} fade speed={0} />
    </>
  )
}

/** Cool moonlit rim from the meter (east) side. Dims, but never vanishes, in a power cut. */
function RimLight() {
  const ref = useRef<THREE.DirectionalLight>(null)
  const R = QUALITY.rim

  useFrame(() => {
    if (ref.current) ref.current.intensity = R.intensity * lerp(1, R.blackoutKeep, MAINS.blackout)
  })

  return <directionalLight ref={ref} position={[11, 5, -7]} color={R.color} intensity={R.intensity} />
}

/**
 * Soft baked floor shadows: AccumulativeShadows renders ~40 jittered shadow frames once, then
 * costs one textured quad per frame. Re-bakes when more assets finish loading (models land).
 */
function GroundShadows() {
  // one bake while loading, one more once everything has loaded (not one per file)
  const bakeKey = useProgress((s) => (s.active ? -1 : s.loaded))
  const G = QUALITY.groundShadow
  return <GroundShadowBake key={bakeKey} frames={G.frames} opacity={G.opacity} scale={G.scale} />
}

function GroundShadowBake({ frames, opacity, scale }: { frames: number; opacity: number; scale: number }) {
  // the bake needs live shadow maps; <ShadowCache/> freezes them otherwise
  useEffect(() => requestLiveShadows(frames + 10), [frames])

  return (
    <AccumulativeShadows
      temporal
      frames={frames}
      alphaTest={0.75}
      opacity={opacity}
      scale={scale}
      color="#04060c"
      resolution={1024}
      position={[0, 0.012, 0]}
    >
      <RandomizedLight
        amount={8}
        radius={5}
        ambient={0.55}
        intensity={1.2}
        mapSize={1024}
        size={Math.max(FLOOR.width, FLOOR.depth) + 4}
        position={[3, 9, 5]}
        bias={0.001}
      />
    </AccumulativeShadows>
  )
}

/** Everything inside the Canvas. */
export function Scene() {
  // hide the grey-box shell once house.glb is confirmed present (HouseModel renders it)
  const [houseLoaded, setHouseLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    glbExists('/models/house.glb').then((ok) => alive && setHouseLoaded(ok))
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <NightSky />
      <Environment />
      {/* lights, appliance motion, energy wires, power-cut flicker */}
      <Effects />
      <RimLight />

      <Selection>
        <House hideShell={houseLoaded} />
        <HouseModel />
        <Meter />
        {ALL_ANCHORS.map((a) => (
          <ApplianceModel key={`${a.id}-${a.room}`} anchor={a} />
        ))}
        <GroundShadows />
        {/* the single EffectComposer: AO, bloom, tone map, outline, vignette */}
        <PostFX />
      </Selection>

      <CameraRig />
      {/* after CameraRig so `controls` exists for camera-move DPR regress */}
      <Quality />
    </>
  )
}
