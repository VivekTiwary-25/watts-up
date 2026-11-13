import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { ROOMS } from '../layout'
import { useDispose } from '../useDispose'
import { MOTION } from './mains'
import { anchorOf, useLevel } from './useLevel'

const ac = anchorOf('ac')
const V = VISUALS.ac
const HAZE_H = 1.7
// open cone: tip at the vent, opening downward into the room
const hazeGeo = new THREE.ConeGeometry(0.85, HAZE_H, 24, 1, true)
hazeGeo.translate(0, -HAZE_H / 2, 0)
hazeGeo.rotateX(Math.PI) // tip at origin, body along +y…
const TILT = Math.PI - Math.asin(0.8) // …then tip the body forward/down into the room

/** Cool additive haze cone from the AC vent + faint blue fill light in the bedroom. */
export function Ac() {
  const level = useLevel('ac')
  const light = useRef<THREE.PointLight>(null)
  const mat = useMemo(
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
  useDispose(mat)

  useFrame(({ clock }) => {
    const breathe = MOTION.reduce ? 1 : 0.85 + 0.15 * Math.sin(clock.elapsedTime * 1.6)
    mat.opacity = V.hazeOpacity * level.v * breathe
    mat.visible = level.v > 0.002
    if (light.current) light.current.intensity = V.lightIntensity * level.v
  })

  const [x, y, z] = ac.position
  const c = ROOMS.bedroom.center
  return (
    <group name="ac-fx">
      <group position={[x, y - ac.size[1] / 2, z + ac.size[2] / 2]} rotation-x={TILT}>
        <mesh geometry={hazeGeo} material={mat} raycast={() => null} />
      </group>
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
