import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import { VISUALS } from '@/data/config'
import type { ApplianceId } from '@/store/useHouse'
import { ApplianceBox } from './ApplianceBox'
import { MOTION } from './effects/mains'
import { useLevel } from './effects/useLevel'
import { glbExists, modelUrl } from './glb'
import type { Anchor } from './layout'
import { useApplianceInteraction, useHighlighted } from './useApplianceInteraction'
import { markShadowsDirty } from './useQuality'

const noRaycast = () => null

/** GLB nodes that spin around their local Y axis while the appliance runs. */
const SPIN_NODES: Partial<Record<ApplianceId, { node: string; maxSpin: number }>> = {
  fan: { node: 'ceiling_fan_blades', maxSpin: VISUALS.fan.maxSpin },
}

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

function Model({ anchor, url }: { anchor: Anchor; url: string }) {
  const { scene } = useGLTF(url)
  const handlers = useApplianceInteraction(anchor.id)
  const highlighted = useHighlighted(anchor.id)
  const level = useLevel(anchor.id)
  const spin = SPIN_NODES[anchor.id]

  // Clone (cache is shared, e.g. 4 lights) and fit uniformly inside the anchor box, centred on it.
  const { object, scale, offset, spinNode } = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return
      o.castShadow = true
      o.raycast = noRaycast // the hit box below is the pointer target, not every triangle
    })
    const box = new THREE.Box3().setFromObject(object)
    const dims = box.getSize(new THREE.Vector3())
    const [sx, sy, sz] = anchor.size
    const scale = Math.min(sx / (dims.x || 1), sy / (dims.y || 1), sz / (dims.z || 1))
    const center = box.getCenter(new THREE.Vector3())
    const offset: [number, number, number] = [
      -center.x * scale,
      -center.y * scale,
      -center.z * scale,
    ]
    const spinNode = spin ? object.getObjectByName(spin.node) : undefined
    return { object, scale, offset, spinNode }
  }, [scene, anchor.size, spin])

  useFrame((_, dt) => {
    if (!spinNode || !spin || MOTION.reduce) return
    spinNode.rotation.y += Math.min(dt, 0.1) * spin.maxSpin * level.v
  })

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
        <mesh geometry={HIT_BOX} material={HIT_MATERIAL} scale={anchor.size} />
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
