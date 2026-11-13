import * as THREE from 'three'
import { useHouse } from '@/store/useHouse'
import { FLOOR, ROOMS, ROOM_IDS, WALLS } from './layout'

/** Warm, dark wood per room (bathroom: cool stone). Roughness varies a touch per room. */
const FLOORS = {
  living: { color: '#4a3324', roughness: 0.62 },
  kitchen: { color: '#463428', roughness: 0.68 },
  bedroom: { color: '#523827', roughness: 0.6 },
  bathroom: { color: '#363c42', roughness: 0.5 },
} as const

const SKIRTING = { height: 0.09, inset: 0.015 } as const

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

/** Grey-box shell: base slab, per-room floor tiles, walls with skirting (no roof). */
export function House() {
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
            onClick={(e) => {
              if (e.delta > 6) return // camera drag
              const s = useHouse.getState()
              s.select(null)
              s.setHovered(null)
              if (s.view === 'overview') {
                e.stopPropagation()
                s.goToRoom(id)
              }
            }}
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

      {WALLS.map((w, i) => (
        // stopPropagation: walls block clicks so you can't pick a floor/appliance through them
        <mesh
          key={i}
          position={w.position}
          material={WALL_MATERIALS[i % WALL_MATERIALS.length]}
          castShadow
          receiveShadow
          onClick={(e) => e.stopPropagation()}
        >
          <boxGeometry args={w.size} />
        </mesh>
      ))}

      {/* skirting: a dark band hugging the foot of every wall segment */}
      {WALLS.map((w, i) => (
        <mesh
          key={`skirt-${i}`}
          position={[w.position[0], SKIRTING.height / 2, w.position[2]]}
          material={SKIRTING_MATERIAL}
          receiveShadow
        >
          <boxGeometry
            args={[w.size[0] + SKIRTING.inset * 2, SKIRTING.height, w.size[2] + SKIRTING.inset * 2]}
          />
        </mesh>
      ))}
    </group>
  )
}
