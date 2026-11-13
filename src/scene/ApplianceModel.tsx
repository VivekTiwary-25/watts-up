import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import { VISUALS } from '@/data/config'
import type { ApplianceId } from '@/store/useHouse'
import { ApplianceBox } from './ApplianceBox'
import { MAINS, MOTION } from './effects/mains'
import { useLevel } from './effects/useLevel'
import { glbExists, modelUrl } from './glb'
import type { Anchor, Vec3 } from './layout'
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

type FitAxis = 'x' | 'y' | 'xz'

/**
 * Real-world size per model file: the model's bounding box along `axis` is scaled to `metres`
 * ('xz' = the larger of x and z). Files not listed fit uniformly inside the anchor box.
 * `yaw` turns a model whose own front is not +z so that it faces the anchor's +z.
 */
const FIT_BY_FILE: Record<string, { axis: FitAxis; metres: number; yaw?: number }> = {
  'fan.glb': { axis: 'x', metres: 1.4 },
  'light.glb': { axis: 'x', metres: 0.45 },
  'chandelier.glb': { axis: 'x', metres: 0.8 },
  'tubelight.glb': { axis: 'x', metres: 1.2 },
  'stove.glb': { axis: 'y', metres: 0.9 },
  'washer.glb': { axis: 'y', metres: 0.85 },
  'tv.glb': { axis: 'x', metres: 1.2 },
  // the door panel sits on the file's -x face
  'fridge.glb': { axis: 'y', metres: 1.8, yaw: Math.PI / 2 },
  'microwave.glb': { axis: 'x', metres: 0.5 },
  'geyser.glb': { axis: 'y', metres: 0.6 },
  // antennas on the file's -x side, indicator block on +x (its front)
  'router.glb': { axis: 'xz', metres: 0.25, yaw: -Math.PI / 2 },
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

// ---- emissive glow ---------------------------------------------------------
type Emissive = THREE.MeshStandardMaterial

/** A set of cloned materials whose emissiveIntensity follows the appliance's running level. */
interface Glow {
  mats: Emissive[]
  intensity: (level: number) => number
}

/** Light fixtures: glow colour and the materials that glow (plus any authored as emissive). */
const FIXTURE_GLOW: Record<string, { color: string; match: RegExp }> = {
  'chandelier.glb': { color: '#ffc98a', match: /lamp/i },
  'light.glb': { color: '#ffe2b0', match: /globe|glass/i },
  'tubelight.glb': { color: '#f2f7ff', match: /tube|bulb/i },
}
const FIXTURE_FALLBACK = '#ffe2b0'
const LIGHT_GLOW_MAX = 2.5

const isEmissive = (m: THREE.Material): m is Emissive => 'emissive' in m

/**
 * Clone (once per model instance) the emissive-capable materials that `pick` selects, swap the
 * clones onto the meshes and return them. Materials are shared through the GLTF cache and inside
 * a model (the geyser lights share one palette material), so the originals are never touched.
 */
function cloneMaterials(
  root: THREE.Object3D,
  pick: (mesh: THREE.Mesh, mat: Emissive) => boolean,
  color: string,
): Emissive[] {
  const clones = new Map<THREE.Material, Emissive>()
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const swap = (mat: THREE.Material) => {
      if (!isEmissive(mat) || !pick(mesh, mat)) return mat
      let c = clones.get(mat)
      if (!c) {
        c = mat.clone()
        c.emissive.set(color)
        c.emissiveMap = null // glow evenly, whatever the authored emissive texture
        c.emissiveIntensity = 0
        clones.set(mat, c)
      }
      return c
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material)
  })
  return [...clones.values()]
}

/** geyser.glb indicator lamps (GLTFLoader turns spaces into '_' and drops '.'). */
const GEYSER = {
  red: { name: /RED[\s_]*LIGHT[\s_]*G(EY|YE)SER/i, color: '#ff3020', max: 3 },
  blue: { name: /BLUE[\s_]*LIGHT[\s_]*G(EY|YE)SER/i, color: '#3a7bff', standby: 0.4 },
}

const meshName = (mesh: THREE.Mesh) => `${mesh.name} ${mesh.parent?.name ?? ''}`

function geyserGlows(root: THREE.Object3D): Glow[] {
  const { red, blue } = GEYSER
  const reds = cloneMaterials(root, (mesh) => red.name.test(meshName(mesh)), red.color)
  const blues = cloneMaterials(root, (mesh) => blue.name.test(meshName(mesh)), blue.color)
  return [
    { mats: reds, intensity: (k) => red.max * k }, // heating
    { mats: blues, intensity: () => blue.standby * (1 - MAINS.blackout) }, // mains present
  ]
}

function glowsFor(anchor: Anchor, file: string, root: THREE.Object3D): Glow[] {
  if (anchor.id === 'geyser') return geyserGlows(root)
  if (anchor.id !== 'light') return []
  const cfg = FIXTURE_GLOW[file]
  const color = cfg?.color ?? FIXTURE_FALLBACK
  let mats = cfg
    ? cloneMaterials(root, (_, m) => cfg.match.test(m.name) || m.emissive.getHex() !== 0, color)
    : []
  if (mats.length === 0) mats = cloneMaterials(root, () => true, color)
  return [{ mats, intensity: (k) => LIGHT_GLOW_MAX * k }]
}

function Model({ anchor, url }: { anchor: Anchor; url: string }) {
  const { scene } = useGLTF(url)
  const handlers = useApplianceInteraction(anchor.id)
  const highlighted = useHighlighted(anchor.id)
  const level = useLevel(anchor.id)
  const spin = SPIN_NODES[anchor.id]

  // Clone (cache is shared, e.g. 2 tube lights), scale to real-world size, centre on the anchor.
  const { object, scale, offset, hitSize, glows, spinNode, yaw } = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return
      o.castShadow = true
      o.raycast = noRaycast // the hit box below is the pointer target, not every triangle
    })
    const file = fileOf(url)
    const glows = glowsFor(anchor, file, object)
    const box = new THREE.Box3().setFromObject(object)
    const dims = box.getSize(new THREE.Vector3())
    const scale = fitScale(file, dims, anchor.size)
    const center = box.getCenter(new THREE.Vector3())
    const offset: Vec3 = [-center.x * scale, -center.y * scale, -center.z * scale]
    const hitSize: Vec3 = [dims.x * scale, dims.y * scale, dims.z * scale]
    const spinNode = spin ? object.getObjectByName(spin.node) : undefined
    const yaw = FIT_BY_FILE[file]?.yaw ?? 0
    return { object, scale, offset, hitSize, glows, spinNode, yaw }
  }, [scene, url, anchor, spin])

  useFrame((_, dt) => {
    if (!spinNode || !spin || MOTION.reduce) return
    spinNode.rotation.y += Math.min(dt, 0.1) * spin.maxSpin * level.v
  })

  // shadow maps are cached: include the model as soon as it lands
  useEffect(markShadowsDirty, [object])

  // the cloned glow materials belong to this instance
  useEffect(
    () => () => {
      for (const g of glows) for (const m of g.mats) m.dispose()
    },
    [glows],
  )

  useFrame(() => {
    for (const g of glows) {
      const k = g.intensity(level.v)
      for (const m of g.mats) m.emissiveIntensity = k
    }
  })

  return (
    <Select enabled={highlighted}>
      <group
        name={anchor.id}
        position={anchor.position}
        rotation-y={anchor.rotationY ?? 0}
        {...handlers}
      >
        <group rotation-y={yaw}>
          <primitive object={object} position={offset} scale={scale} />
          <mesh geometry={HIT_BOX} material={HIT_MATERIAL} scale={hitSize} />
        </group>
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
