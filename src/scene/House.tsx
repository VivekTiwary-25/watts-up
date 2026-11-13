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

/** Warm, dark wood per room (bathroom: cool stone). Roughness varies a touch per room. */
const FLOORS = {
  living: { color: '#4a3324', roughness: 0.62 },
  kitchen: { color: '#463428', roughness: 0.68 },
  bedroom: { color: '#523827', roughness: 0.6 },
  bathroom: { color: '#363c42', roughness: 0.5 },
} as const

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
        const f = FLOORS[id]
        return (
          <mesh
            key={id}
            name={`floor-${id}`}
            position={[r.center[0], 0.001, r.center[2]]}
            rotation-x={-Math.PI / 2}
            receiveShadow
            onClick={(e) => onFloorClick(id, e)}
          >
            <planeGeometry args={r.size} />
            {/* slight sheen + thin clearcoat: reads as finished wood/stone, not matte clay */}
            <meshPhysicalMaterial
              color={f.color}
              roughness={f.roughness}
              metalness={0}
              sheen={0.35}
              sheenRoughness={0.55}
              sheenColor="#d9b892"
              clearcoat={0.12}
              clearcoatRoughness={0.45}
            />
          </mesh>
        )
      })}

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
