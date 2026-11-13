import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { MOTION } from './mains'
import { anchorOf, useLevel } from './useLevel'

const tv = anchorOf('tv')
const T = VISUALS.tv

/** Emissive screen on the TV's front face; subtle "programme" flicker while on. */
export function Tv() {
  const level = useLevel('tv')
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#05070a', emissive: T.screen, emissiveIntensity: 0, roughness: 0.25, toneMapped: false }),
    [],
  )
  const geo = useMemo(() => new THREE.PlaneGeometry(tv.size[0] * 0.9, tv.size[1] * 0.82), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // two incommensurate sines + a slow drift read as changing scenes, not a strobe
    const f = MOTION.reduce ? 0 : (Math.sin(t * 7.3) * 0.5 + Math.sin(t * 2.1 + 1.3) * 0.5) * T.flicker
    mat.emissiveIntensity = T.intensity * level.v * (1 - T.flicker + f)
  })

  return (
    <group position={tv.position} rotation-y={tv.rotationY ?? 0}>
      <mesh geometry={geo} material={mat} position={[0, 0, tv.size[2] / 2 + 0.004]} />
    </group>
  )
}
