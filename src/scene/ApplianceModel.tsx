import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import { ApplianceBox } from './ApplianceBox'
import { glbExists, modelUrl } from './glb'
import type { Anchor, Vec3 } from './layout'
import { useApplianceInteraction, useHighlighted } from './useApplianceInteraction'
import { markShadowsDirty } from './useQuality'

const noRaycast = () => null

/**
 * Invisible pointer target sized to the anchor box (scaled unit cube). material.visible = false
 * keeps it out of colour, shadow and outline passes while the mesh stays raycastable.
 */
const HIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const HIT_MATERIAL = new THREE.MeshBasicMaterial({ visible: false })

class ModelBoundary extends Component<
  { url: string; fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
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

type FitAxis = 'x' | 'y' | 'xz'

/**
 * Real-world size per model file: the model's bounding box along `axis` is scaled to `metres`
 * ('xz' = the larger of x and z). Files not listed fit uniformly inside the anchor box.
 */
const FIT_BY_FILE: Record<string, { axis: FitAxis; metres: number }> = {
  'fan.glb': { axis: 'x', metres: 1.4 },
  'light.glb': { axis: 'x', metres: 0.45 },
  'chandelier.glb': { axis: 'x', metres: 0.8 },
  'tubelight.glb': { axis: 'x', metres: 1.2 },
  'stove.glb': { axis: 'y', metres: 0.9 },
  'washer.glb': { axis: 'y', metres: 0.85 },
  'tv.glb': { axis: 'x', metres: 1.2 },
  'fridge.glb': { axis: 'y', metres: 1.8 },
  'microwave.glb': { axis: 'x', metres: 0.5 },
  'geyser.glb': { axis: 'y', metres: 0.6 },
  'router.glb': { axis: 'xz', metres: 0.25 },
}

const fileOf = (url: string) => url.slice(url.lastIndexOf('/') + 1)

function fitScale(file: string, dims: THREE.Vector3, size: Vec3): number {
  const fit = FIT_BY_FILE[file]
  if (fit) {
    const ref = fit.axis === 'xz' ? Math.max(dims.x, dims.z) : dims[fit.axis]
    return fit.metres / (ref || 1)
  }
  const [sx, sy, sz] = size
  return Math.min(sx / (dims.x || 1), sy / (dims.y || 1), sz / (dims.z || 1))
}

function Model({ anchor, url }: { anchor: Anchor; url: string }) {
  const { scene } = useGLTF(url)
  const handlers = useApplianceInteraction(anchor.id)
  const highlighted = useHighlighted(anchor.id)

  // Clone (cache is shared, e.g. 2 tube lights), scale to real-world size, centre on the anchor.
  const { object, scale, offset, hitSize } = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return
      o.castShadow = true
      o.raycast = noRaycast // the hit box below is the pointer target, not every triangle
    })
    const box = new THREE.Box3().setFromObject(object)
    const dims = box.getSize(new THREE.Vector3())
    const scale = fitScale(fileOf(url), dims, anchor.size)
    const center = box.getCenter(new THREE.Vector3())
    const offset: Vec3 = [-center.x * scale, -center.y * scale, -center.z * scale]
    const hitSize: Vec3 = [dims.x * scale, dims.y * scale, dims.z * scale]
    return { object, scale, offset, hitSize }
  }, [scene, url, anchor.size])

  // shadow maps are cached: include the model as soon as it lands
  useEffect(markShadowsDirty, [object])

  return (
    <Select enabled={highlighted}>
      <group
        name={anchor.id}
        position={anchor.position}
        rotation-y={anchor.rotationY ?? 0}
        {...handlers}
      >
        <primitive object={object} position={offset} scale={scale} />
        <mesh geometry={HIT_BOX} material={HIT_MATERIAL} scale={hitSize} />
      </group>
    </Select>
  )
}

/** Uses `/models/<id>.glb` when it exists, otherwise (or on load error) the grey box. */
export function ApplianceModel({ anchor }: { anchor: Anchor }) {
  const url = modelUrl(anchor.id, anchor.model)
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
