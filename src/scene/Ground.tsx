import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { FLOOR } from './layout'

/**
 * Stone terrace the house sits on (a little larger than the 12.6 × 10.6 base slab), top just
 * under the slab top (y = -0.01) so nothing z-fights.
 */
export const TERRACE = {
  width: FLOOR.width + 3.4,
  depth: FLOOR.depth + 3.4,
  top: -0.03,
  height: 0.16,
  color: '#3a3d44',
} as const

/** Night lawn around the terrace. Large enough that its edge is fully fogged. */
const GRASS = { radius: 75, y: TERRACE.top - TERRACE.height + 0.06, color: '#13241a' } as const

/** Faint additive band around the horizon: warm at the ground, cool above, then nothing. */
const HORIZON = { radius: 70, height: 16, opacity: 0.45 } as const

function Terrace() {
  return (
    <mesh
      name="terrace"
      position={[0, TERRACE.top - TERRACE.height / 2, 0]}
      receiveShadow
      raycast={() => null}
    >
      <boxGeometry args={[TERRACE.width, TERRACE.height, TERRACE.depth]} />
      <meshStandardMaterial color={TERRACE.color} roughness={0.92} />
    </mesh>
  )
}

function Grass() {
  return (
    <mesh
      name="grass"
      rotation-x={-Math.PI / 2}
      position={[0, GRASS.y, 0]}
      receiveShadow
      raycast={() => null}
    >
      <circleGeometry args={[GRASS.radius, 48]} />
      <meshStandardMaterial color={GRASS.color} roughness={1} />
    </mesh>
  )
}

function HorizonGlow() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // canvas top = top of the band (v = 1 maps to the cylinder top with flipY)
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height)
      g.addColorStop(0, 'rgba(40, 70, 140, 0)')
      g.addColorStop(0.55, 'rgba(60, 95, 170, 0.35)')
      g.addColorStop(0.85, 'rgba(150, 110, 120, 0.7)')
      g.addColorStop(1, 'rgba(255, 150, 90, 0.9)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh
      name="horizon-glow"
      position={[0, GRASS.y + HORIZON.height / 2, 0]}
      raycast={() => null}
      renderOrder={-1}
    >
      <cylinderGeometry args={[HORIZON.radius, HORIZON.radius, HORIZON.height, 48, 1, true]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={HORIZON.opacity}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/** Terrace + lawn + horizon glow under the clay rooms. Covers everything below y = 0. */
export function Ground() {
  return (
    <group name="ground">
      <Terrace />
      <Grass />
      <HorizonGlow />
    </group>
  )
}
