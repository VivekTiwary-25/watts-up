import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { LIGHT_ANCHORS } from '../layout'
import { MAINS } from './mains'
import { lerp, useLevel } from './useLevel'

const A = VISUALS.ambient
const L = VISUALS.lights
const SKY = A.hemiSky.map((c) => new THREE.Color(c))
const SUN = A.sun.map((c) => new THREE.Color(c))

/** Blend a [lightsOn, lightsOff, powerCut] triple by light level and blackout. */
function mix3(
  v: readonly [number, number, number] | readonly number[],
  light: number,
  black: number,
) {
  return lerp(lerp(v[1], v[0], light), v[2], black)
}
function mixColor3(out: THREE.Color, v: THREE.Color[], light: number, black: number) {
  return out.copy(v[1]).lerp(v[0], light).lerp(v[2], black)
}

/**
 * Global lights: warm daylight-ish fill while the lights are on, cool moonlight when they are
 * off, near-black during a power cut. Replaces the static hemi/ambient/sun from the grey box.
 */
export function SceneLights() {
  const light = useLevel('light')
  const hemi = useRef<THREE.HemisphereLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    const b = MAINS.blackout
    if (hemi.current) {
      hemi.current.intensity = mix3(A.hemiIntensity, light.v, b)
      mixColor3(hemi.current.color, SKY, light.v, b)
    }
    if (amb.current) amb.current.intensity = mix3(A.ambientIntensity, light.v, b)
    if (sun.current) {
      sun.current.intensity = mix3(A.sunIntensity, light.v, b)
      mixColor3(sun.current.color, SUN, light.v, b)
    }
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={[A.hemiSky[0], '#1a1d24', A.hemiIntensity[0]]} />
      <ambientLight ref={amb} intensity={A.ambientIntensity[0]} />
      <directionalLight
        ref={sun}
        position={[6, 12, 7]}
        intensity={A.sunIntensity[0]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0005}
      />
    </>
  )
}

const panelGeo = new THREE.PlaneGeometry(0.46, 0.46)

/**
 * One warm point light + glowing ceiling panel per room. Always mounted (a changing light count
 * would recompile every material); only intensities move.
 */
export function RoomLights() {
  const light = useLevel('light')
  const refs = useRef<(THREE.PointLight | null)[]>([])
  const panelMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#000000', toneMapped: false }),
    [],
  )
  const panelOn = useMemo(() => new THREE.Color(L.panel).multiplyScalar(L.panelIntensity), [])

  useFrame(() => {
    const k = light.v
    for (const p of refs.current) if (p) p.intensity = L.warmIntensity * k
    panelMat.color.setRGB(0.08, 0.09, 0.11).lerp(panelOn, k)
  })

  return (
    <group name="room-lights">
      {LIGHT_ANCHORS.map((a, i) => {
        const [x, y, z] = a.position
        const under = y - a.size[1] / 2 - 0.004
        return (
          <group key={a.room}>
            <pointLight
              ref={(el) => {
                refs.current[i] = el
              }}
              position={[x, y - 0.25, z]}
              color={L.warm}
              intensity={0}
              distance={L.warmDistance}
              decay={2}
            />
            <mesh
              geometry={panelGeo}
              material={panelMat}
              position={[x, under, z]}
              rotation-x={Math.PI / 2}
            />
          </group>
        )
      })}
    </group>
  )
}
