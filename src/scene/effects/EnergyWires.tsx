import { useMemo, useRef, type ComponentRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { APPLIANCES, APPLIANCE_BY_ID } from '@/data/appliances'
import { VISUALS } from '@/data/config'
import { useHouse } from '@/store/useHouse'
import { PLUGS, type Plug, type Vec3 } from '../layout'
import {
  WIRING,
  assignLanes,
  ease,
  feedRoute,
  plugRoute,
  targetLevel,
  wireHeat,
  wireWidth,
} from './drive'
import { MAINS, MOTION, easeRate } from './mains'
import { lerp, useLevel, type Level } from './useLevel'

const W = VISUALS.wire
const LOW = new THREE.Color(W.low)
const HIGH = new THREE.Color(W.high)
/** Floor wires read as a hint when idle: near-invisible off, soft (not neon) when on. */
const OFF_OPACITY = 0.03
const ON_OPACITY = 0.8

type LineRef = ComponentRef<typeof Line>

// Routes are computed once from PLUGS (anchors live in layout.ts), never per appliance by hand.
const LANES = assignLanes(PLUGS)
const ROUTES = new Map<string, Vec3[]>(
  PLUGS.map((p) => [p.key, plugRoute(p.position, LANES.get(p.key) ?? WIRING.busZ)]),
)
const FEED = feedRoute()

/** Per-frame material update shared by the feed and every wire. No allocations. */
function drive(
  line: Pick<LineRef, 'material'> | null,
  base: THREE.Color,
  level: number,
  dt: number,
) {
  const m = line?.material
  if (!m) return
  m.opacity = lerp(OFF_OPACITY, ON_OPACITY, level)
  m.color.copy(base).multiplyScalar(0.3 + 0.7 * level)
  if (!MOTION.reduce) m.dashOffset -= Math.min(dt, 0.1) * W.flow * level
}

const lineProps = {
  worldUnits: true,
  transparent: true,
  opacity: OFF_OPACITY,
  depthWrite: false,
  toneMapped: false,
  raycast: () => null,
  dashed: true,
  dashScale: W.dashScale,
  dashSize: W.dashSize,
  gapSize: W.gapSize,
} as const

/** One floor wire, feed → bus lane → plug: width by watts, dashes flow while powered. */
function Wire({ plug }: { plug: Plug }) {
  const level = useLevel(plug.id)
  const ref = useRef<LineRef>(null)
  const watts = APPLIANCE_BY_ID[plug.id].watts
  const base = useMemo(() => LOW.clone().lerp(HIGH, wireHeat(watts)), [watts])
  const points = ROUTES.get(plug.key) ?? FEED

  useFrame((_, dt) => drive(ref.current, base, level.v, dt))

  return (
    <Line
      ref={ref}
      name={`wire-${plug.key}`}
      points={points}
      lineWidth={wireWidth(watts)}
      color={base}
      {...lineProps}
    />
  )
}

/** Meter → floor → through the east wall to the bus: lit while anything draws power. */
function Feed() {
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
      name="wire-feed"
      points={FEED}
      lineWidth={WIRING.width.max}
      color={base}
      {...lineProps}
    />
  )
}

/** Energy flow from the meter to every powered appliance (one wire per room for lights). */
export function EnergyWires() {
  return (
    <group name="energy-wires">
      <Feed />
      {PLUGS.map((p) => (
        <Wire key={p.key} plug={p} />
      ))}
    </group>
  )
}
