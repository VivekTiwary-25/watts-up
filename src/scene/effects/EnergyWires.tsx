import { useMemo, useRef, type ComponentRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line, QuadraticBezierLine } from '@react-three/drei'
import { APPLIANCES, APPLIANCE_BY_ID } from '@/data/appliances'
import { VISUALS } from '@/data/config'
import { useHouse } from '@/store/useHouse'
import { METER_TOP, PLUGS, WIRE_ORIGIN, type Plug, type Vec3 } from '../layout'
import { ease, targetLevel, wireHeat, wireMid, wireWidth } from './drive'
import { MAINS, MOTION, easeRate } from './mains'
import { lerp, useLevel, type Level } from './useLevel'

const W = VISUALS.wire
const LOW = new THREE.Color(W.low)
const HIGH = new THREE.Color(W.high)

type LineRef = ComponentRef<typeof Line>
type CurveRef = ComponentRef<typeof QuadraticBezierLine>

/** Per-frame material update shared by the riser and every wire. No allocations. */
function drive(
  line: Pick<LineRef, 'material'> | null,
  base: THREE.Color,
  level: number,
  dt: number,
) {
  const m = line?.material
  if (!m) return
  m.opacity = lerp(W.offOpacity, W.onOpacity, level)
  m.color.copy(base).multiplyScalar(0.3 + 0.7 * level)
  if (!MOTION.reduce) m.dashOffset -= Math.min(dt, 0.1) * W.flow * level
}

const dashProps = {
  dashed: true,
  dashScale: W.dashScale,
  dashSize: W.dashSize,
  gapSize: W.gapSize,
} as const

/** One wire, meter → plug: arcs over the walls, width ∝ watts, dashes flow while powered. */
function Wire({ plug }: { plug: Plug }) {
  const level = useLevel(plug.id)
  const ref = useRef<CurveRef>(null)
  const watts = APPLIANCE_BY_ID[plug.id].watts
  const base = useMemo(() => LOW.clone().lerp(HIGH, wireHeat(watts)), [watts])
  const mid = useMemo<Vec3>(() => wireMid(WIRE_ORIGIN, plug.position), [plug.position])

  useFrame((_, dt) => drive(ref.current, base, level.v, dt))

  return (
    <QuadraticBezierLine
      ref={ref}
      name={`wire-${plug.key}`}
      start={WIRE_ORIGIN}
      end={plug.position}
      mid={mid}
      worldUnits
      lineWidth={wireWidth(watts)}
      color={base}
      transparent
      opacity={W.offOpacity}
      depthWrite={false}
      toneMapped={false}
      raycast={() => null}
      {...dashProps}
    />
  )
}

const RISER: Vec3[] = [METER_TOP, WIRE_ORIGIN]
const TOTAL_WATTS = APPLIANCES.reduce((sum, a) => sum + a.watts, 0)

/** Short riser from the meter up to the fan-out point: lit while anything draws power. */
function Riser() {
  const ref = useRef<LineRef>(null)
  const [level] = useMemo<[Level]>(() => [{ v: 0 }], [])
  const base = useMemo(() => LOW.clone().lerp(HIGH, 0.5), [])

  useFrame((_, dt) => {
    const s = useHouse.getState()
    let target = 0
    for (const a of APPLIANCES) target = Math.max(target, targetLevel(s, a.id, MAINS.flicker))
    level.v = ease(level.v, target, dt, MOTION.reduce, easeRate())
    drive(ref.current, base, level.v, dt)
  })

  return (
    <Line
      ref={ref}
      name="wire-riser"
      points={RISER}
      worldUnits
      lineWidth={wireWidth(TOTAL_WATTS * 0.5)}
      color={base}
      transparent
      opacity={W.offOpacity}
      depthWrite={false}
      toneMapped={false}
      raycast={() => null}
      {...dashProps}
    />
  )
}

/** Energy flow from the meter to every powered appliance (one wire per room for lights). */
export function EnergyWires() {
  return (
    <group name="energy-wires">
      <Riser />
      {PLUGS.map((p) => (
        <Wire key={p.key} plug={p} />
      ))}
    </group>
  )
}
