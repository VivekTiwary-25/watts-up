import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { useDispose } from '../useDispose'
import { MOTION } from './mains'
import { anchorOf, useLevel } from './useLevel'

const tv = anchorOf('tv')
const T = VISUALS.tv

/**
 * Native bounding box of public/models/tv.glb (x, y, z in the file's own units). ApplianceModel
 * fits the GLB uniformly (min scale) into the anchor box, so the same maths sizes the screen here.
 */
const TV_GLB_DIMS = [13, 7.755, 2.152] as const
const FIT = Math.min(
  tv.size[0] / TV_GLB_DIMS[0],
  tv.size[1] / TV_GLB_DIMS[1],
  tv.size[2] / TV_GLB_DIMS[2],
)
const SCREEN_W = TV_GLB_DIMS[0] * FIT * 0.92
const SCREEN_H = TV_GLB_DIMS[1] * FIT * 0.85
const SCREEN_Z = (TV_GLB_DIMS[2] * FIT) / 2 + 0.004

// soft blue-white the screen drifts between while on
const COLOR_A = new THREE.Color('#cfe4ff')
const COLOR_B = new THREE.Color('#eef4ff')

/** Emissive screen just in front of the TV model; slow colour drift, light flicker and a faint glow. */
export function Tv() {
  const level = useLevel('tv')
  const light = useRef<THREE.PointLight>(null)
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#05070a',
        emissive: T.screen,
        emissiveIntensity: 0,
        roughness: 0.25,
        toneMapped: false,
      }),
    [],
  )
  const geo = useMemo(() => new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), [])
  useDispose(mat, geo)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // two incommensurate sines + a slow drift read as changing scenes, not a strobe
    const f = MOTION.reduce
      ? 0
      : (Math.sin(t * 7.3) * 0.5 + Math.sin(t * 2.1 + 1.3) * 0.5) * T.flicker
    mat.emissiveIntensity = T.intensity * level.v * (1 - T.flicker + f)

    const mix = MOTION.reduce ? 0.5 : Math.sin(t * 0.25) * 0.5 + 0.5
    mat.emissive.lerpColors(COLOR_A, COLOR_B, mix)

    // always mounted (toggling visibility changes the light count and recompiles shaders)
    if (light.current) light.current.intensity = 1.2 * level.v
  })

  return (
    <group position={tv.position} rotation-y={tv.rotationY ?? 0}>
      <mesh geometry={geo} material={mat} position={[0, 0, SCREEN_Z]} />
      <pointLight
        ref={light}
        position={[0, 0, SCREEN_Z + 0.6]}
        color="#bcdcff"
        intensity={0}
        distance={3}
      />
    </group>
  )
}
