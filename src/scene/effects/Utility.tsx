import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import type { Anchor } from '../layout'
import { MOTION } from './mains'
import { anchorOf, useLevel, type Level } from './useLevel'

const LED = VISUALS.led
const ledGeo = new THREE.SphereGeometry(0.022, 12, 8)
const LED_OFF = new THREE.Color(LED.off)
const LED_ON = new THREE.Color(LED.on).multiplyScalar(LED.glow)

/** Group placed on the appliance's front face (local +z, rotated with the anchor). */
function Front({ anchor, children }: { anchor: Anchor; children: ReactNode }) {
  return (
    <group position={anchor.position} rotation-y={anchor.rotationY ?? 0}>
      <group position={[0, 0, anchor.size[2] / 2 + 0.006]}>{children}</group>
    </group>
  )
}

/** Small status LED: dull red when off, glowing green when running. */
function StatusLed({ level, position }: { level: Level; position: [number, number, number] }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: LED.off, toneMapped: false }), [])
  useFrame(() => {
    mat.color.copy(LED_OFF).lerp(LED_ON, level.v)
  })
  return <mesh geometry={ledGeo} material={mat} position={position} raycast={() => null} />
}

const fridge = anchorOf('fridge')
export function Fridge() {
  const level = useLevel('fridge')
  return (
    <Front anchor={fridge}>
      <StatusLed
        level={level}
        position={[fridge.size[0] / 2 - 0.1, fridge.size[1] / 2 - 0.12, 0]}
      />
    </Front>
  )
}

const mw = anchorOf('microwave')
const windowGeo = new THREE.PlaneGeometry(mw.size[0] * 0.58, mw.size[1] * 0.66)
const MW_GLOW = new THREE.Color(VISUALS.microwave.glow)
const MW_DARK = new THREE.Color('#0b0d10')
export function Microwave() {
  const level = useLevel('microwave')
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: MW_DARK, toneMapped: false }), [])
  useFrame(({ clock }) => {
    const hum = MOTION.reduce ? 1 : 0.92 + 0.08 * Math.sin(clock.elapsedTime * 11)
    mat.color
      .copy(MW_DARK)
      .lerp(MW_GLOW, Math.min(1, level.v * hum))
      .multiplyScalar(1 + (VISUALS.microwave.intensity - 1) * level.v)
  })
  return (
    <Front anchor={mw}>
      <mesh
        geometry={windowGeo}
        material={mat}
        position={[-mw.size[0] * 0.12, 0, 0]}
        raycast={() => null}
      />
      <StatusLed level={level} position={[mw.size[0] / 2 - 0.07, mw.size[1] / 2 - 0.07, 0]} />
    </Front>
  )
}

const washer = anchorOf('washer')
const doorGeo = new THREE.CircleGeometry(0.24, 32)
const paddleGeo = new THREE.BoxGeometry(0.4, 0.05, 0.01)
const doorMat = new THREE.MeshStandardMaterial({
  color: '#1b2430',
  roughness: 0.15,
  metalness: 0.4,
})
const paddleMat = new THREE.MeshStandardMaterial({ color: '#8fa3b8', roughness: 0.5 })
export function Washer() {
  const level = useLevel('washer')
  const drum = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (drum.current && !MOTION.reduce)
      drum.current.rotation.z -= Math.min(dt, 0.1) * VISUALS.washer.maxSpin * level.v
  })
  return (
    <Front anchor={washer}>
      <group position={[0, -0.06, 0]}>
        <mesh geometry={doorGeo} material={doorMat} raycast={() => null} />
        <group ref={drum} position={[0, 0, 0.004]}>
          <mesh geometry={paddleGeo} material={paddleMat} raycast={() => null} />
          <mesh
            geometry={paddleGeo}
            material={paddleMat}
            rotation-z={Math.PI / 2}
            raycast={() => null}
          />
        </group>
      </group>
      <StatusLed
        level={level}
        position={[washer.size[0] / 2 - 0.09, washer.size[1] / 2 - 0.08, 0]}
      />
    </Front>
  )
}
