import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Environment, Sky, useGLTF } from '@react-three/drei'
import { useHouse } from '@/store/useHouse'
import { glbExists } from './glb'

const URL = '/models/house.glb'

/** Where the villa sits so the fixed intro camera ([0,1.7,19] -> [0,1.2,0]) frames it. */
const VILLA = { width: 30, x: 0, z: -14, bottom: -0.5 } as const
const GROUND = { radius: 120, color: '#2c3a30' } as const

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
  const object = useMemo(() => scene.clone(true), [scene])
  const [fit, setFit] = useState<{ scale: number; position: [number, number, number] } | null>(null)

  useLayoutEffect(() => {
    object.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = false
        node.receiveShadow = false
      }
    })
    const bounds = new THREE.Box3().setFromObject(object)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = VILLA.width / (size.x || 1)
    setFit({
      scale,
      position: [
        VILLA.x - center.x * scale,
        VILLA.bottom - bounds.min.y * scale,
        VILLA.z - center.z * scale,
      ],
    })
  }, [object])

  return fit ? <primitive object={object} scale={fit.scale} position={fit.position} /> : null
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[VILLA.x, VILLA.bottom - 0.01, VILLA.z]}>
      <circleGeometry args={[GROUND.radius, 48]} />
      <meshStandardMaterial color={GROUND.color} roughness={1} />
    </mesh>
  )
}

/** Villa exterior, sky and sunset light. Mounted only while the intro view is showing. */
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
      <Sky sunPosition={[100, 6, -100]} />
      <Ground />
      <Boundary>
        <Suspense fallback={null}>
          <Environment preset="sunset" />
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
