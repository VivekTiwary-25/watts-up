import { useRef } from 'react'
import type { CSSProperties } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useHouse } from '@/store/useHouse'
import { MOTION } from './effects/mains'
import { ROOMS, ROOM_IDS, type Room, type Vec3 } from './layout'

const LABELS: Record<Room, string> = {
  living: 'Living room',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
}

/** Height the labels float at: just above the cut-down walls, below the full-height ones. */
const LABEL_Y = 1.55
const BOB = { amplitude: 0.05, speed: 0.9 } as const

const PILL: CSSProperties = {
  pointerEvents: 'none',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  padding: '4px 11px',
  borderRadius: 999,
  background: 'rgba(14, 20, 36, 0.58)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  color: 'rgba(236, 240, 248, 0.92)',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.02em',
  lineHeight: 1.2,
}

function Label({ id, phase }: { id: Room; phase: number }) {
  const group = useRef<THREE.Group>(null)
  const r = ROOMS[id]
  const position: Vec3 = [r.center[0], LABEL_Y, r.center[2]]

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const bob = MOTION.reduce ? 0 : Math.sin(clock.elapsedTime * BOB.speed + phase) * BOB.amplitude
    g.position.y = LABEL_Y + bob
  })

  return (
    <group ref={group} position={position}>
      <Html center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
        <div style={PILL} aria-hidden="true">
          {LABELS[id]}
        </div>
      </Html>
    </group>
  )
}

/** Floating glass room names; hidden during the intro and while the villa is shown. */
export function RoomLabels() {
  const view = useHouse((s) => s.view)
  const villa = useHouse((s) => s.villa)
  if (view === 'intro' || villa) return null
  return (
    <group name="room-labels">
      {ROOM_IDS.map((id, i) => (
        <Label key={id} id={id} phase={i * 1.7} />
      ))}
    </group>
  )
}
