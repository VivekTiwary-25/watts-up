import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Vec3 } from '../layout'
import { MOTION } from '../effects/mains'
import { useLevel } from '../effects/useLevel'
import { BOX, Part, type PlaceholderProps } from './kit'

/** Louvre opening (radians) at full running level, plus the gentle swing amplitude/speed. */
const FLAP_OPEN = 0.55
const FLAP_SWING = 0.14
const FLAP_SPEED = 0.7

/** Swing offset of the louvre at time `t` (0 with reduced motion). Shared with the haze effect. */
export function acSwing(t: number): number {
  return MOTION.reduce ? 0 : FLAP_SWING * Math.sin(t * FLAP_SPEED)
}

/**
 * Key points on the unit's front face, in the anchor's local space (centre of the box, +z = room).
 * The effects layer uses these to sit the glow strip, display and haze exactly on the model.
 */
export function acFace([w, h, d]: Vec3) {
  const shellDepth = d * 0.88
  const shellZ = -d / 2 + shellDepth / 2 // back flush with the wall
  const front = shellZ + shellDepth / 2
  const panelH = h * 0.43
  const panelY = h * 0.117
  const panelFront = front + 0.004
  const seamY = panelY - panelH / 2 - 0.006
  const hingeY = -h / 2 + h * 0.26
  return {
    shellDepth,
    shellZ,
    front,
    panelH,
    panelY,
    panelFront,
    seamY,
    hingeY,
    flapLen: hingeY + h / 2 - h * 0.035,
    outletY: -h / 2 + h * 0.13,
    stripY: (seamY + hingeY) / 2,
    display: { x: w * 0.34, y: panelY - panelH * 0.18, w: 0.085, h: 0.032 },
  }
}

const VANES = [-0.32, -0.16, 0, 0.16, 0.32]

/** Wall-mounted split indoor unit: rounded shell, front panel, outlet with vanes and a swinging louvre. */
export function AcModel({ size, mats }: PlaceholderProps) {
  const [w, h] = size
  const f = acFace(size)
  const level = useLevel('ac')
  const flap = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!flap.current) return
    const swing = acSwing(clock.elapsedTime)
    flap.current.rotation.x = -level.v * (FLAP_OPEN + swing)
  })

  return (
    <group>
      {/* shell */}
      <RoundedBox
        args={[w, h, f.shellDepth]}
        position={[0, 0, f.shellZ]}
        radius={Math.min(0.06, h * 0.2)}
        smoothness={4}
        material={mats.body}
        castShadow
        raycast={() => null}
      />
      {/* front intake panel, proud of the shell by a few mm */}
      <RoundedBox
        args={[w * 0.96, f.panelH, 0.016]}
        position={[0, f.panelY, f.panelFront - 0.008]}
        radius={0.007}
        smoothness={2}
        material={mats.body}
        raycast={() => null}
      />
      {/* darker seam under the panel */}
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, f.seamY, f.front - 0.002]}
        scale={[w * 0.94, 0.004, 0.012]}
      />
      {/* display window */}
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[f.display.x, f.display.y, f.panelFront + 0.001]}
        scale={[f.display.w, f.display.h, 0.004]}
      />
      {/* air outlet recess with vertical vanes */}
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, f.outletY, f.front - 0.028]}
        scale={[w * 0.88, h * 0.2, 0.06]}
      />
      {VANES.map((x) => (
        <Part
          key={x}
          geo={BOX}
          mat={mats.metal}
          pos={[x * w, f.outletY, f.front - 0.016]}
          scale={[0.006, h * 0.17, 0.035]}
        />
      ))}
      {/* louvre flap, hinged at its top edge */}
      <group ref={flap} position={[0, f.hingeY, f.front + 0.006]}>
        <Part
          geo={BOX}
          mat={mats.body}
          pos={[0, -f.flapLen / 2, 0]}
          scale={[w * 0.88, f.flapLen, 0.008]}
        />
      </group>
    </group>
  )
}
