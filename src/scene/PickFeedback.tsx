import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { useHouse, type ApplianceId } from '@/store/useHouse'
import { MOTION } from './effects/mains'
import { ALL_ANCHORS, type Anchor } from './layout'

const P = VISUALS.pick

// cached media-query flag: no matchMedia() allocation per frame
const prefersReducedMotion = () => MOTION.reduce

const noRaycast = () => null

/** Red overlay on the appliance that was just refused; fades over ~600ms (static if reduced motion). */
function BlockedFlash({ anchor, flashAt }: { anchor: Anchor; flashAt: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const { position, size, rotationY = 0 } = anchor

  useFrame(() => {
    if (!mat.current) return
    const t = (performance.now() - flashAt) / P.blockedMs
    if (t < 0 || t >= 1) {
      mat.current.opacity = 0
    } else if (prefersReducedMotion()) {
      mat.current.opacity = P.blockedOpacity // static tint
    } else {
      // two quick pulses that fade out
      mat.current.opacity = P.blockedOpacity * Math.abs(Math.cos(t * Math.PI * 2)) * (1 - t)
    }
  })

  return (
    <mesh position={position} rotation-y={rotationY} raycast={noRaycast} renderOrder={5}>
      <boxGeometry args={[size[0] * 1.08, size[1] * 1.08, size[2] * 1.08]} />
      <meshBasicMaterial
        ref={mat}
        color={P.blockedColor}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/** Soft green ring on the floor under a picked appliance. */
function PickHalo({ anchor }: { anchor: Anchor }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const [x, , z] = anchor.position
  const radius = Math.max(anchor.size[0], anchor.size[2]) * 0.5 + 0.3

  useFrame(({ clock }) => {
    if (!mat.current) return
    const pulse = prefersReducedMotion() ? 0 : Math.sin(clock.elapsedTime * 3) * P.haloPulse
    mat.current.opacity = P.haloOpacity * (1 + pulse)
  })

  return (
    <mesh position={[x, 0.02, z]} rotation-x={-Math.PI / 2} raycast={noRaycast} renderOrder={4}>
      <ringGeometry args={[radius * 0.7, radius, 48]} />
      <meshBasicMaterial
        ref={mat}
        color={P.haloColor}
        transparent
        opacity={P.haloOpacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/** Blocked-pick red flash + green halos under the picks, for the power-cut game. */
export function PickFeedback() {
  const picks = useHouse((s) => s.picks)
  const powerCut = useHouse((s) => s.powerCut)
  const errorAt = useHouse((s) => s.pickError?.at ?? 0)
  const [flash, setFlash] = useState<{ id: ApplianceId; at: number } | null>(null)

  // pickError.at changed: the clicked appliance is `selected` once the click handler finishes
  useEffect(() => {
    if (!errorAt) return
    const id = useHouse.getState().selected
    if (!id) return
    setFlash({ id, at: performance.now() })
    const timer = window.setTimeout(() => setFlash(null), P.blockedMs + 50)
    return () => window.clearTimeout(timer)
  }, [errorAt])

  const active = powerCut !== 'off'
  return (
    <group name="pick-feedback">
      {active &&
        ALL_ANCHORS.filter((a) => picks.includes(a.id)).map((a) => (
          <PickHalo key={`halo-${a.id}-${a.room}`} anchor={a} />
        ))}
      {flash &&
        ALL_ANCHORS.filter((a) => a.id === flash.id).map((a) => (
          <BlockedFlash key={`flash-${a.id}-${a.room}-${flash.at}`} anchor={a} flashAt={flash.at} />
        ))}
    </group>
  )
}
