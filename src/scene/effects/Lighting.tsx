import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { VISUALS } from '@/data/config'
import { LIGHT_ANCHORS, type Anchor, type Vec3 } from '../layout'
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

// RectAreaLight needs its LTC lookup textures registered once before the first render.
RectAreaLightUniformsLib.init()

/** Wall-mounted tube light: a soft cool rect light instead of a warm point light. */
const TUBE = { model: 'tubelight.glb', color: '#f2f7ff', intensity: 4, width: 1.2, height: 0.08 }
const isTube = (a: Anchor) => a.model === TUBE.model

/** Pose of a tube's rect light: just in front of the fixture, facing into the room. */
function tubePose(a: Anchor): { position: Vec3; quaternion: THREE.Quaternion } {
  const r = a.rotationY ?? 0
  // the fixture's local +z points into the room
  const out = new THREE.Vector3(Math.sin(r), 0, Math.cos(r))
  const position = new THREE.Vector3(...a.position).addScaledVector(out, a.size[2] / 2 + 0.02)
  // a light emits along its local -z: aim it into the room and slightly down
  const target = position
    .clone()
    .addScaledVector(out, 2)
    .setY(position.y - 1)
  const m = new THREE.Matrix4().lookAt(position, target, new THREE.Vector3(0, 1, 0))
  return {
    position: position.toArray() as Vec3,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(m),
  }
}

/**
 * One light per room fixture: a warm point light under the chandelier / ceiling lamp, a soft rect
 * light in front of each tube light. The fixtures glow themselves (ApplianceModel). Always
 * mounted (a changing light count would recompile every material); only intensities move.
 */
export function RoomLights() {
  const light = useLevel('light')
  const points = useRef<(THREE.PointLight | null)[]>([])
  const rects = useRef<(THREE.RectAreaLight | null)[]>([])
  const poses = useMemo(() => LIGHT_ANCHORS.map((a) => (isTube(a) ? tubePose(a) : null)), [])

  useFrame(() => {
    const k = light.v
    for (const p of points.current) if (p) p.intensity = L.warmIntensity * k
    for (const r of rects.current) if (r) r.intensity = TUBE.intensity * k
  })

  return (
    <group name="room-lights">
      {LIGHT_ANCHORS.map((a, i) => {
        const pose = poses[i]
        if (pose) {
          return (
            <rectAreaLight
              key={a.room}
              ref={(el) => {
                rects.current[i] = el
              }}
              position={pose.position}
              quaternion={pose.quaternion}
              color={TUBE.color}
              intensity={0}
              width={TUBE.width}
              height={TUBE.height}
            />
          )
        }
        const [x, y, z] = a.position
        return (
          <pointLight
            key={a.room}
            ref={(el) => {
              points.current[i] = el
            }}
            // among the bulbs, in the lower part of the fixture
            position={[x, y - a.size[1] * 0.3, z]}
            color={L.warm}
            intensity={0}
            distance={L.warmDistance}
            decay={2}
          />
        )
      })}
    </group>
  )
}
