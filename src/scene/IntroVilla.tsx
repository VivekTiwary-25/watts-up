import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Environment, Sky, useGLTF } from '@react-three/drei'
import { useHouse } from '@/store/useHouse'
import { glbExists } from './glb'

const URL = '/models/house.glb'

/**
 * The villa is fitted to 30 m across (x) and sits on the origin: bounding box centred in x/z,
 * bottom at y = 0. The building itself runs along z (about -24..9 m); the hillside rises on -x,
 * so the open facade faces +x, which is where the intro camera orbits (see VILLA_SHOT).
 */
const VILLA = { width: 30 } as const
const GROUND = { radius: 160, color: '#3d4a2f' } as const

/** Intro orbit around the villa: target, radius, height, sweep (radians either side of +x). */
export const VILLA_SHOT = {
  target: [0, -1.5, -8] as [number, number, number],
  radius: 40,
  height: 17,
  sweep: 0.55,
  periodS: 48,
} as const

/** Camera position on the intro orbit at time `t` seconds (static mid-sweep when `still`). */
export function villaOrbit(t: number, still = false): [number, number, number] {
  const s = VILLA_SHOT
  const phase = still ? 0.35 : Math.sin((t / s.periodS) * Math.PI * 2) * s.sweep
  return [
    s.target[0] + Math.cos(phase) * s.radius,
    s.height,
    s.target[2] + Math.sin(phase) * s.radius,
  ]
}

/** Swallows load failures (missing GLB, offline HDR) so the rooms scene is never affected. */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function Villa() {
  const { scene } = useGLTF(URL)
  const fitted = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.castShadow = false
      node.receiveShadow = false
      // the rooms' night fog (far = 52 m) would wash the villa out
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) material.fog = false
    })
    const bounds = new THREE.Box3().setFromObject(object)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = VILLA.width / (size.x || 1)
    const position: [number, number, number] = [
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale,
    ]
    return { object, scale, position }
  }, [scene])

  return <primitive object={fitted.object} scale={fitted.scale} position={fitted.position} />
}

function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} raycast={() => null}>
      <circleGeometry args={[GROUND.radius, 64]} />
      <meshStandardMaterial color={GROUND.color} roughness={1} fog={false} />
    </mesh>
  )
}

/** Villa exterior, sunset sky and light. Mounted only while the intro view is showing. */
export function IntroVilla() {
  const intro = useHouse((s) => s.view === 'intro')
  const [exists, setExists] = useState(false)

  useEffect(() => {
    let alive = true
    glbExists(URL).then((ok) => alive && setExists(ok))
    return () => {
      alive = false
    }
  }, [])

  if (!intro) return null
  return (
    <>
      <Sky
        sunPosition={[100, 1.6, -70]}
        turbidity={10}
        rayleigh={3}
        mieCoefficient={0.008}
        mieDirectionalG={0.86}
      />
      <Ground />
      <Boundary>
        <Suspense fallback={null}>
          <Environment preset="sunset" environmentIntensity={0.45} />
        </Suspense>
      </Boundary>
      {exists && (
        <Boundary>
          <Suspense fallback={null}>
            <Villa />
          </Suspense>
        </Boundary>
      )}
    </>
  )
}
