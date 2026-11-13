import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { ROOMS as ROOM_INFO } from '@/data/config'
import { useHouse } from '@/store/useHouse'
import { ROOMS, ROOM_IDS, type Room } from './layout'

const GLOW = '#7dd3fc'

function roomName(id: Room) {
  return ROOM_INFO.find((r) => r.id === id)?.name ?? id
}

function Hotspot({ id }: { id: Room }) {
  const [hovered, setHovered] = useState(false)
  const room = ROOMS[id]
  const radius = Math.min(room.size[0], room.size[1]) * 0.16

  // never leave a pointer cursor behind when the hotspots unmount
  useEffect(() => {
    if (!hovered) return
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    setHovered(false)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    // a drag that started on the disc is an orbit, not a click
    if (e.delta > 6) return
    useHouse.getState().goToRoom(id)
  }

  return (
    <group position={[room.center[0], 0.05, room.center[2]]}>
      {/* soft halo: no pointer events */}
      <mesh rotation-x={-Math.PI / 2} raycast={() => null} renderOrder={2}>
        <circleGeometry args={[radius * 1.6, 48]} />
        <meshBasicMaterial
          color={GLOW}
          transparent
          opacity={hovered ? 0.22 : 0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* the clickable disc */}
      <mesh
        rotation-x={-Math.PI / 2}
        position-y={0.005}
        renderOrder={3}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
      >
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial
          color={GLOW}
          transparent
          opacity={hovered ? 0.55 : 0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <Html center position={[0, 0.35, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}>
        <span
          className={`pointer-events-none rounded-full border border-white/15 bg-slate-950/70 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-slate-100 shadow-sm backdrop-blur-sm transition-colors select-none ${hovered ? 'border-sky-300/60 text-sky-100' : ''}`}
        >
          {roomName(id)}
        </span>
      </Html>
    </group>
  )
}

/** Overview-only floor discs: click one to step into that room. */
export function RoomHotspots() {
  const show = useHouse((s) => s.view === 'overview' && !s.villa && s.powerCut === 'off')
  if (!show) return null
  return (
    <group>
      {ROOM_IDS.map((id) => (
        <Hotspot key={id} id={id} />
      ))}
    </group>
  )
}
