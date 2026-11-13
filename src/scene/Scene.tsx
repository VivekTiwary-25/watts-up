import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  AccumulativeShadows,
  RandomizedLight,
  RoundedBox,
  Stars,
  useProgress,
} from '@react-three/drei'
import { Selection } from '@react-three/postprocessing'
import { QUALITY } from '@/data/config'
import { useHouse } from '@/store/useHouse'
import { ApplianceModel } from './ApplianceModel'
import { CameraRig } from './CameraRig'
import { Environment } from './Environment'
import { Furniture } from './Furniture'
import { House } from './House'
import { IntroVilla } from './IntroVilla'
import { Effects } from './effects/Effects'
import { WIRING, targetLevel } from './effects/drive'
import { MAINS, MOTION } from './effects/mains'
import { lerp } from './effects/useLevel'
import { APPLIANCES } from '@/data/appliances'
import { Ground, TERRACE } from './Ground'
import { ALL_ANCHORS, FLOOR } from './layout'
import { PickFeedback } from './PickFeedback'
import { PostFX } from './PostFX'
import { RoomHotspots } from './RoomHotspots'
import { RoomLabels } from './RoomLabels'
import { Quality } from './Quality'
import { requestLiveShadows } from './useQuality'

const M = WIRING.meter
const TOTAL_WATTS = APPLIANCES.reduce((sum, a) => sum + a.watts, 0)

/**
 * Electricity meter on the outer east wall: clay housing, a glowing digit window and a disc that
 * spins with the live load. Faces +x (out of the wall); the window dims in a blackout.
 */
function Meter() {
  const digits = useRef<THREE.MeshStandardMaterial>(null)
  const disc = useRef<THREE.Mesh>(null)
  const [w, h, d] = M.size
  const face = w / 2 + 0.001

  useFrame((_, dt) => {
    if (digits.current) {
      digits.current.emissiveIntensity = lerp(1.4, 0.12, MAINS.blackout)
    }
    if (disc.current && !MOTION.reduce) {
      const s = useHouse.getState()
      let watts = 0
      for (const a of APPLIANCES) watts += a.watts * targetLevel(s, a.id, MAINS.flicker)
      disc.current.rotation.x += Math.min(dt, 0.1) * (0.4 + 6 * (watts / TOTAL_WATTS))
    }
  })

  return (
    <group name="meter" position={M.position}>
      {/* back plate on the wall */}
      <mesh position={[-w / 2 + 0.01, 0, 0]}>
        <boxGeometry args={[0.02, h + 0.08, d + 0.08]} />
        <meshStandardMaterial color="#2b3038" roughness={0.9} />
      </mesh>
      <RoundedBox args={[w - 0.02, h, d]} radius={0.04} smoothness={3} position={[0.01, 0, 0]}>
        <meshStandardMaterial color="#c9c4ba" roughness={0.75} />
      </RoundedBox>
      {/* digit window */}
      <mesh position={[face, h * 0.22, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[d * 0.62, 0.07]} />
        <meshStandardMaterial
          ref={digits}
          color="#06140f"
          emissive="#3bd6a0"
          emissiveIntensity={1.4}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
      {/* dial ring + spinning disc */}
      <mesh position={[face, -h * 0.12, 0]} rotation-z={-Math.PI / 2}>
        <cylinderGeometry args={[0.07, 0.07, 0.012, 24]} />
        <meshStandardMaterial color="#1c2129" roughness={0.6} />
      </mesh>
      <mesh ref={disc} position={[face + 0.008, -h * 0.12, 0]}>
        <boxGeometry args={[0.004, 0.11, 0.018]} />
        <meshStandardMaterial color="#ffb36b" emissive="#ff8a3d" emissiveIntensity={0.6} />
      </mesh>
      {/* status LED, visible from above */}
      <mesh position={[0.02, h / 2 + 0.004, d * 0.3]}>
        <sphereGeometry args={[0.014, 10, 8]} />
        <meshBasicMaterial color="#4dff9a" toneMapped={false} />
      </mesh>
    </group>
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
      <Stars
        radius={S.radius}
        depth={S.depth}
        count={S.count}
        factor={S.factor}
        saturation={0}
        fade
        speed={0}
      />
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

  return (
    <directionalLight ref={ref} position={[11, 5, -7]} color={R.color} intensity={R.intensity} />
  )
}

/**
 * Soft baked floor shadows: AccumulativeShadows renders ~40 jittered shadow frames once, then
 * costs one textured quad per frame. Re-bakes when more assets finish loading (models land).
 */
function GroundShadows() {
  // one bake while loading, one more once everything has loaded (not one per file)
  const bakeKey = useProgress((s) => (s.active ? -1 : s.loaded))
  const G = QUALITY.groundShadow
  // keep the baked-shadow quad on the terrace (a larger quad showed as a tinted patch)
  const scale = Math.min(G.scale, TERRACE.depth)
  return <GroundShadowBake key={bakeKey} frames={G.frames} opacity={G.opacity} scale={scale} />
}

function GroundShadowBake({
  frames,
  opacity,
  scale,
}: {
  frames: number
  opacity: number
  scale: number
}) {
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
  const intro = useHouse((s) => s.view === 'intro')
  const villa = useHouse((s) => s.villa)
  // the clay rooms + their effects only show in the "Rooms" view, not over the villa
  const rooms = !intro && !villa

  return (
    <>
      <NightSky />
      <Environment />
      {/* lights, appliance motion, energy wires, power-cut flicker (rooms only) */}
      <group visible={rooms}>
        <Effects />
      </group>
      <RimLight />
      {/* villa exterior + sky: intro and the cut-open "Villa" view */}
      <IntroVilla />

      <Selection>
        {/* the clay rooms hide while the intro or the villa view shows the villa */}
        <group visible={rooms}>
          <Ground />
          <House />
          <Furniture />
          <RoomLabels />
          <RoomHotspots />
          <Meter />
          {ALL_ANCHORS.map((a) => (
            <ApplianceModel key={`${a.id}-${a.room}`} anchor={a} />
          ))}
          <PickFeedback />
          <GroundShadows />
        </group>
        {/* the single EffectComposer: AO, bloom, tone map, outline, vignette */}
        <PostFX />
      </Selection>

      <CameraRig />
      {/* after CameraRig so `controls` exists for camera-move DPR regress */}
      <Quality />
    </>
  )
}
