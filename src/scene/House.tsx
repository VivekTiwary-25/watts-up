import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useHouse } from '@/store/useHouse'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  FLOOR,
  ROOMS,
  ROOM_IDS,
  WALL,
  WALLS,
  type Room,
  type Vec3,
  type WallSegment,
} from './layout'
import { mergeBoxes } from './mergeBoxes'

type FloorKind = 'wood' | 'tile' | 'carpet'

interface FloorFinish {
  kind: FloorKind
  /** base and accent colours painted into the procedural texture */
  base: string
  accent: string
  roughness: number
  /** metres covered by one texture repeat */
  tile: number
}

/** Warm wood living room, light tile kitchen + bathroom, soft carpet bedroom. */
const FLOORS: Record<Room, FloorFinish> = {
  living: { kind: 'wood', base: '#7a5639', accent: '#5e412b', roughness: 0.7, tile: 1.2 },
  kitchen: { kind: 'tile', base: '#d3cdc2', accent: '#aaa398', roughness: 0.6, tile: 1.2 },
  bedroom: { kind: 'carpet', base: '#6f6a7c', accent: '#7c778a', roughness: 0.98, tile: 1 },
  bathroom: { kind: 'tile', base: '#c8cfd2', accent: '#9ea7ab', roughness: 0.55, tile: 0.8 },
}

const TEX_SIZE = 256

/** Tiny deterministic PRNG so the procedural floors look the same every load. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function paintWood(ctx: CanvasRenderingContext2D, f: FloorFinish) {
  const rand = rng(7)
  const planks = 6
  const h = TEX_SIZE / planks
  for (let i = 0; i < planks; i++) {
    // each plank row gets a slight tone shift and one staggered end joint
    ctx.fillStyle = f.base
    ctx.fillRect(0, i * h, TEX_SIZE, h)
    ctx.fillStyle = `rgba(0, 0, 0, ${0.04 + rand() * 0.1})`
    ctx.fillRect(0, i * h, TEX_SIZE, h)
    ctx.fillStyle = f.accent
    ctx.globalAlpha = 0.18
    for (let g = 0; g < 4; g++) {
      ctx.fillRect(0, i * h + rand() * h, TEX_SIZE, 1)
    }
    ctx.globalAlpha = 0.8
    ctx.fillRect(0, i * h, TEX_SIZE, 1.5)
    ctx.fillRect(Math.floor(rand() * TEX_SIZE), i * h, 1.5, h)
    ctx.globalAlpha = 1
  }
}

function paintTile(ctx: CanvasRenderingContext2D, f: FloorFinish) {
  const rand = rng(11)
  const n = 4
  const s = TEX_SIZE / n
  ctx.fillStyle = f.accent
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      ctx.fillStyle = f.base
      ctx.fillRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3)
      ctx.fillStyle = `rgba(255, 255, 255, ${rand() * 0.06})`
      ctx.fillRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3)
    }
  }
}

function paintCarpet(ctx: CanvasRenderingContext2D, f: FloorFinish) {
  const rand = rng(23)
  ctx.fillStyle = f.base
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE)
  ctx.fillStyle = f.accent
  for (let i = 0; i < 2400; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.35
    ctx.fillRect(rand() * TEX_SIZE, rand() * TEX_SIZE, 1.5, 1.5)
  }
  ctx.globalAlpha = 1
}

const PAINTERS: Record<FloorKind, (ctx: CanvasRenderingContext2D, f: FloorFinish) => void> = {
  wood: paintWood,
  tile: paintTile,
  carpet: paintCarpet,
}

/** Small repeating CanvasTexture for a room floor, or null where canvas 2D is unavailable (tests). */
function floorTexture(id: Room): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = TEX_SIZE
  canvas.height = TEX_SIZE
  let ctx: CanvasRenderingContext2D | null = null
  try {
    ctx = canvas.getContext('2d')
  } catch {
    ctx = null
  }
  if (!ctx) return null
  const f = FLOORS[id]
  PAINTERS[f.kind](ctx, f)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  const [w, d] = ROOMS[id].size
  tex.repeat.set(w / f.tile, d / f.tile)
  return tex
}

/** One soft matte material per room floor, built once. */
const FLOOR_MATERIALS = Object.fromEntries(
  ROOM_IDS.map((id) => {
    const f = FLOORS[id]
    const map = floorTexture(id)
    const material = new THREE.MeshStandardMaterial({
      color: map ? '#ffffff' : f.base,
      map,
      roughness: f.roughness,
      metalness: 0,
    })
    return [id, material]
  }),
) as Record<Room, THREE.MeshStandardMaterial>

/** Living-room rug: soft wool field with a darker border, just above the floor. */
const RUG = {
  center: [-3.0, 2.5] as [number, number],
  size: [2.8, 2.0] as [number, number],
  border: 0.16,
  y: 0.004,
} as const
const RUG_BORDER_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#8a6d5a',
  roughness: 1,
  metalness: 0,
})
const RUG_FIELD_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#d8cbb8',
  roughness: 1,
  metalness: 0,
})

const SKIRTING = { height: 0.09, inset: 0.015 } as const

/** Dollhouse cutaway: the far outer walls stay full height, the rest are cut down to this. */
const CUT_HEIGHT = 0.9
/** Soft rounded cap along each cut wall: a flattened capsule, a touch wider than the wall. */
const CAP = { radius: WALL.thickness / 2 + 0.025, squash: 0.45 } as const

const EPS = 0.01
const HALF_W = FLOOR.width / 2
const HALF_D = FLOOR.depth / 2

/** Back (z = -5), west (x = -6) and east (x = +6) walls keep their full height. */
function isFarWall(w: WallSegment): boolean {
  const [x, , z] = w.position
  if (w.size[0] > w.size[2]) return Math.abs(z + HALF_D) < EPS
  return Math.abs(x + HALF_W) < EPS || Math.abs(x - HALF_W) < EPS
}

/** Same footprint as the layout segment; height derived from where the segment sits. */
const SHELL_WALLS: (WallSegment & { cut: boolean })[] = WALLS.map((w) => {
  if (isFarWall(w)) return { ...w, cut: false }
  return {
    position: [w.position[0], CUT_HEIGHT / 2, w.position[2]] as Vec3,
    size: [w.size[0], CUT_HEIGHT, w.size[2]] as Vec3,
    cut: true,
  }
})

/**
 * Clay-like soft white walls. A few shared variants with slightly different roughness/tint
 * so large surfaces don't read as one flat CG colour, without a material per wall.
 */
const WALL_MATERIALS = [
  { color: '#d4cfc6', roughness: 0.9 },
  { color: '#d0cbc2', roughness: 0.94 },
  { color: '#d7d2c9', roughness: 0.87 },
].map((m) => new THREE.MeshStandardMaterial({ ...m, metalness: 0 }))

const SKIRTING_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#2a221d',
  roughness: 0.55,
  metalness: 0,
})

/**
 * Static walls baked into one geometry per tint variant (3 draw calls instead of one per
 * segment), skirting into one more. Built once, shared for the app's lifetime.
 */
const WALL_GEOMETRIES = WALL_MATERIALS.map((_, v) =>
  mergeBoxes(SHELL_WALLS.filter((_, i) => i % WALL_MATERIALS.length === v)),
)
const SKIRTING_GEOMETRY = mergeBoxes(
  WALLS.map((w) => ({
    position: [w.position[0], SKIRTING.height / 2, w.position[2]] as Vec3,
    size: [w.size[0] + SKIRTING.inset * 2, SKIRTING.height, w.size[2] + SKIRTING.inset * 2] as Vec3,
  })),
)

const CAP_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#ebe6dd',
  roughness: 0.82,
  metalness: 0,
})

/** One flattened capsule per cut wall, all merged into a single draw call. */
function buildCapGeometry(): THREE.BufferGeometry {
  const parts = SHELL_WALLS.filter((w) => w.cut).map((w) => {
    const alongX = w.size[0] > w.size[2]
    const length = Math.max(0.001, (alongX ? w.size[0] : w.size[2]) - CAP.radius * 2)
    const g = new THREE.CapsuleGeometry(CAP.radius, length, 4, 12)
    // capsule axis is +y: lay it along the wall, then flatten it into a soft rounded strip
    if (alongX) g.rotateZ(Math.PI / 2)
    else g.rotateX(Math.PI / 2)
    g.scale(1, CAP.squash, 1)
    g.translate(w.position[0], CUT_HEIGHT, w.position[2])
    return g
  })
  const merged = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  if (!merged) throw new Error('House: could not merge wall caps')
  merged.computeBoundingSphere()
  return merged
}
const CAP_GEOMETRY = buildCapGeometry()

/** Walls never block or receive pointer events: only appliances (and floors) are targets. */
const noRaycast = () => null

/** Grey-box shell: base slab, per-room floor tiles, walls with skirting (no roof). */
/** Click a floor: clears hover/selection; in overview it also flies into that room. */
function onFloorClick(id: Room, e: ThreeEvent<MouseEvent>) {
  if (e.delta > 6) return // camera drag
  const s = useHouse.getState()
  s.select(null)
  s.setHovered(null)
  if (s.view === 'overview') {
    e.stopPropagation()
    s.goToRoom(id)
  }
}

/** Raycastable but never drawn (material.visible = false skips colour + shadow passes). */
const HIDDEN_MATERIAL = new THREE.MeshBasicMaterial({ visible: false })

export function House({ hideShell = false }: { hideShell?: boolean }) {
  if (hideShell) {
    // house.glb replaces the shell, but the floors stay as invisible room click targets
    return (
      <group name="house-hit-floors">
        {ROOM_IDS.map((id) => {
          const r = ROOMS[id]
          return (
            <mesh
              key={id}
              name={`floor-${id}`}
              position={[r.center[0], 0.001, r.center[2]]}
              rotation-x={-Math.PI / 2}
              material={HIDDEN_MATERIAL}
              onClick={(e) => onFloorClick(id, e)}
            >
              <planeGeometry args={r.size} />
            </mesh>
          )
        })}
      </group>
    )
  }
  return (
    <group name="house">
      {/* base slab, slightly larger than the plan */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[FLOOR.width + 0.6, 0.1, FLOOR.depth + 0.6]} />
        <meshStandardMaterial color="#141820" roughness={0.97} />
      </mesh>

      {ROOM_IDS.map((id) => {
        const r = ROOMS[id]
        return (
          <mesh
            key={id}
            name={`floor-${id}`}
            position={[r.center[0], 0.001, r.center[2]]}
            rotation-x={-Math.PI / 2}
            material={FLOOR_MATERIALS[id]}
            receiveShadow
            onClick={(e) => onFloorClick(id, e)}
          >
            <planeGeometry args={r.size} />
          </mesh>
        )
      })}

      {/* living-room rug: border + field; clicks pass through to the floor below */}
      <group name="rug" position={[RUG.center[0], RUG.y, RUG.center[1]]} rotation-x={-Math.PI / 2}>
        <mesh material={RUG_BORDER_MATERIAL} receiveShadow raycast={noRaycast}>
          <planeGeometry args={RUG.size} />
        </mesh>
        <mesh position-z={0.001} material={RUG_FIELD_MATERIAL} receiveShadow raycast={noRaycast}>
          <planeGeometry args={[RUG.size[0] - RUG.border * 2, RUG.size[1] - RUG.border * 2]} />
        </mesh>
      </group>

      {WALL_GEOMETRIES.map((geometry, v) => (
        <mesh
          key={v}
          name={`walls-${v}`}
          geometry={geometry}
          material={WALL_MATERIALS[v]}
          castShadow
          receiveShadow
          raycast={noRaycast}
        />
      ))}

      {/* rounded caps along the top of the cut-down walls */}
      <mesh
        name="wall-caps"
        geometry={CAP_GEOMETRY}
        material={CAP_MATERIAL}
        castShadow
        receiveShadow
        raycast={noRaycast}
      />

      {/* skirting: a dark band hugging the foot of every wall segment */}
      <mesh
        name="skirting"
        geometry={SKIRTING_GEOMETRY}
        material={SKIRTING_MATERIAL}
        receiveShadow
        raycast={noRaycast}
      />
    </group>
  )
}
