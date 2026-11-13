import { ContactShadows } from '@react-three/drei'
import { useHouse } from '@/store/useHouse'
import { FLOOR, ROOMS, ROOM_IDS, WALLS } from './layout'

const FLOOR_COLORS = { living: '#3a3f4a', kitchen: '#363c45', bedroom: '#3d3a46', bathroom: '#34404a' } as const

/** Grey-box shell: base slab, per-room floor tiles, walls (no roof). */
export function House() {
  return (
    <group name="house">
      {/* base slab, slightly larger than the plan */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[FLOOR.width + 0.6, 0.1, FLOOR.depth + 0.6]} />
        <meshStandardMaterial color="#1c2029" roughness={0.95} />
      </mesh>

      {ROOM_IDS.map((id) => {
        const r = ROOMS[id]
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
            <meshStandardMaterial color={FLOOR_COLORS[id]} roughness={0.85} />
          </mesh>
        )
      })}

      {WALLS.map((w, i) => (
        // stopPropagation: walls block clicks so you can't pick a floor/appliance through them
        <mesh key={i} position={w.position} castShadow receiveShadow onClick={(e) => e.stopPropagation()}>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color="#5a606b" roughness={0.9} />
        </mesh>
      ))}

      <ContactShadows position={[0, 0.005, 0]} scale={[FLOOR.width + 2, FLOOR.depth + 2]} resolution={512} far={3} blur={2.4} opacity={0.55} />
    </group>
  )
}
