import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { MOTION } from './mains'
import { anchorOf, useLevel } from './useLevel'

const fan = anchorOf('fan')
const BLADE_LEN = 0.5
// blade extends along +x from the hub; three of them are placed 120° apart
const bladeGeo = new THREE.BoxGeometry(BLADE_LEN, 0.02, 0.15)
bladeGeo.translate(0.1 + BLADE_LEN / 2, 0, 0)
const bladeMat = new THREE.MeshStandardMaterial({
  color: '#c9ced8',
  roughness: 0.5,
  metalness: 0.2,
})

/** Ceiling-fan blades (3, under the motor housing of the placeholder) sitting on the fan box; spin eases with power. */
export function Fan() {
  const level = useLevel('fan')
  const blades = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (!blades.current || MOTION.reduce) return
    blades.current.rotation.y += Math.min(dt, 0.1) * VISUALS.fan.maxSpin * level.v
  })

  const [x, y, z] = fan.position
  return (
    <group ref={blades} position={[x, y - fan.size[1] / 2 + 0.02, z]}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          geometry={bladeGeo}
          material={bladeMat}
          rotation-y={(i * Math.PI * 2) / 3}
          rotation-z={0.08}
          castShadow
        />
      ))}
    </group>
  )
}
