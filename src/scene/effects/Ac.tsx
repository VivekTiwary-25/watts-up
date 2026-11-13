import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { ROOMS } from '../layout'
import { acFace, acSwing } from '../placeholders/Ac'
import { useDispose } from '../useDispose'
import { MOTION } from './mains'
import { anchorOf, useLevel } from './useLevel'

const ac = anchorOf('ac')
const face = acFace(ac.size)
const V = VISUALS.ac
const ACCENT = '#7fe0ff'
const HAZE_H = 1.7
// open cone: tip at the vent, opening downward into the room
const hazeGeo = new THREE.ConeGeometry(0.85, HAZE_H, 24, 1, true)
hazeGeo.translate(0, -HAZE_H / 2, 0)
hazeGeo.rotateX(Math.PI) // tip at origin, body along +y…
const TILT = Math.PI - Math.asin(0.8) // …then tip the body forward/down into the room
const PLANE = new THREE.PlaneGeometry(1, 1)

/** Additive, untone-mapped glow material: invisible at opacity 0, blooms a little when bright. */
function glowMaterial(color: string, boost: number, map?: THREE.Texture) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(boost),
    map: map ?? null,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
}

/** "24°" drawn once into a small canvas: no font loading, no per-frame work. */
function temperatureTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 48
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 38px ui-monospace, Menlo, Consolas, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('24°', 64, 26)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * AC running cues: cool haze from the outlet (follows the louvre swing), a blue fill light,
 * a thin accent strip along the bottom front edge and a small glowing temperature readout.
 */
export function Ac() {
  const level = useLevel('ac')
  const light = useRef<THREE.PointLight>(null)
  const haze = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)

  const hazeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: V.haze,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  )
  const stripMat = useMemo(() => glowMaterial(ACCENT, 1.6), [])
  const tempTex = useMemo(temperatureTexture, [])
  const tempMat = useMemo(() => glowMaterial(ACCENT, 1.3, tempTex ?? undefined), [tempTex])
  useDispose(hazeMat, stripMat, tempMat, tempTex)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const v = level.v
    const on = v > 0.002
    const breathe = MOTION.reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 1.6)

    hazeMat.opacity = V.hazeOpacity * v * breathe
    hazeMat.visible = on
    if (haze.current) haze.current.rotation.x = TILT - acSwing(t) * v * 0.6
    if (inner.current) {
      const s = MOTION.reduce ? 1 : 1 + 0.06 * Math.sin(t * 1.1 + 1.3)
      inner.current.scale.set(0.5 * s, 0.75, 0.5 * s)
    }

    stripMat.opacity = v
    stripMat.visible = on
    tempMat.opacity = 0.9 * v
    tempMat.visible = on && tempTex !== null

    if (light.current) light.current.intensity = V.lightIntensity * v
  })

  const [x, y, z] = ac.position
  const c = ROOMS.bedroom.center
  const d = face.display
  return (
    <group name="ac-fx">
      <group ref={haze} position={[x, y + face.outletY, z + face.front]} rotation-x={TILT}>
        <mesh geometry={hazeGeo} material={hazeMat} raycast={() => null} />
        {/* denser core so the stream reads as layered air, not a flat cone */}
        <mesh ref={inner} geometry={hazeGeo} material={hazeMat} raycast={() => null} />
      </group>
      <mesh
        geometry={PLANE}
        material={stripMat}
        position={[x, y + face.stripY, z + face.front + 0.002]}
        scale={[ac.size[0] * 0.72, 0.006, 1]}
        raycast={() => null}
      />
      <mesh
        geometry={PLANE}
        material={tempMat}
        position={[x + d.x, y + d.y, z + face.panelFront + 0.0045]}
        scale={[d.w * 0.82, d.h * 0.85, 1]}
        raycast={() => null}
      />
      <pointLight
        ref={light}
        position={[x, 1.7, (z + c[2]) / 2]}
        color={V.light}
        intensity={0}
        distance={5}
        decay={2}
      />
    </group>
  )
}
