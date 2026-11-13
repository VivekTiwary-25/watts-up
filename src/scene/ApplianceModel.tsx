import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import { ApplianceBox } from './ApplianceBox'
import { glbExists, modelUrl } from './glb'
import type { Anchor } from './layout'
import { useApplianceInteraction, useHighlighted } from './useApplianceInteraction'

class ModelBoundary extends Component<{ url: string; fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    useGLTF.clear(this.props.url) // drop the cached rejection
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function Model({ anchor, url }: { anchor: Anchor; url: string }) {
  const { scene } = useGLTF(url)
  const handlers = useApplianceInteraction(anchor.id)
  const highlighted = useHighlighted(anchor.id)

  // Clone (cache is shared, e.g. 4 lights) and fit uniformly inside the anchor box, centred on it.
  const { object, scale, offset } = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true
    })
    const box = new THREE.Box3().setFromObject(object)
    const dims = box.getSize(new THREE.Vector3())
    const [sx, sy, sz] = anchor.size
    const scale = Math.min(sx / (dims.x || 1), sy / (dims.y || 1), sz / (dims.z || 1))
    const center = box.getCenter(new THREE.Vector3())
    const offset: [number, number, number] = [-center.x * scale, -center.y * scale, -center.z * scale]
    return { object, scale, offset }
  }, [scene, anchor.size])

  return (
    <Select enabled={highlighted}>
      <group name={anchor.id} position={anchor.position} rotation-y={anchor.rotationY ?? 0} {...handlers}>
        <primitive object={object} position={offset} scale={scale} />
      </group>
    </Select>
  )
}

/** Uses `/models/<id>.glb` when it exists, otherwise (or on load error) the grey box. */
export function ApplianceModel({ anchor }: { anchor: Anchor }) {
  const url = modelUrl(anchor.id)
  const [exists, setExists] = useState(false)

  useEffect(() => {
    let alive = true
    glbExists(url).then((ok) => alive && setExists(ok))
    return () => {
      alive = false
    }
  }, [url])

  const box = <ApplianceBox anchor={anchor} />
  if (!exists) return box
  return (
    <ModelBoundary url={url} fallback={box}>
      <Suspense fallback={box}>
        <Model anchor={anchor} url={url} />
      </Suspense>
    </ModelBoundary>
  )
}
