import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { MOTION } from './mains'
import { anchorOf, useLevel } from './useLevel'

const fan = anchorOf('fan')
const bladeGeo = new THREE.BoxGeometry(1.1, 0.025, 0.14)
const hubGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16)
const bladeMat = new THREE.MeshStandardMaterial({
  color: '#c9ced8',
  roughness: 0.5,
  metalness: 0.2,
})

/** Ceiling-fan blades (placeholder cross) sitting on the fan box; spin eases with power. */
export function Fan() {
  const level = useLevel('fan')
  const blades = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (!blades.current || MOTION.reduce) return
    blades.current.rotation.y += Math.min(dt, 0.1) * VISUALS.fan.maxSpin * level.v
  })

  const [x, y, z] = fan.position
  return (
    <group ref={blades} position={[x, y + fan.size[1] / 2 + 0.03, z]}>
      <mesh geometry={hubGeo} material={bladeMat} castShadow />
      <mesh geometry={bladeGeo} material={bladeMat} castShadow />
      <mesh geometry={bladeGeo} material={bladeMat} rotation-y={Math.PI / 2} castShadow />
    </group>
  )
}
