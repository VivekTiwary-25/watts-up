import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { glbExists } from './glb'
import { hideShell } from './hideShell'

const URL = '/models/house.glb'

class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    useGLTF.clear(URL)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function LoadedHouse() {
  const { scene } = useGLTF(URL)
  const object = useMemo(() => scene.clone(true), [scene])
  const [fit, setFit] = useState<{ scale: number; position: [number, number, number] } | null>(null)

  useLayoutEffect(() => {
    hideShell(object)
    object.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true
        node.receiveShadow = true
      }
    })
    const bounds = new THREE.Box3().setFromObject(object)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = Math.min(12 / (size.x || 1), 10 / (size.z || 1))
    setFit({ scale, position: [-center.x * scale, -bounds.min.y * scale, -center.z * scale] })
  }, [object])

  return fit ? <primitive object={object} scale={fit.scale} position={fit.position} /> : null
}

export function HouseModel() {
  const [exists, setExists] = useState(false)
  useEffect(() => {
    let alive = true
    glbExists(URL).then((ok) => alive && setExists(ok))
    return () => {
      alive = false
    }
  }, [])
  if (!exists) return null
  return (
    <ModelBoundary>
      <Suspense fallback={null}>
        <LoadedHouse />
      </Suspense>
    </ModelBoundary>
  )
}
