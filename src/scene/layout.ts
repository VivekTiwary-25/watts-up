// Single source of truth for every position in the 3D house.
// Floor plan is 12 (x) × 10 (z), centred on the origin. +z faces the default camera.
//
//   z=-5 ┌──────────────┬────────┐
//        │   bedroom    │bathroom│
//   z= 0 ├───────────┬──┴────────┤
//        │  living   │  kitchen  │
//   z=+5 └───────────┴───────────┘
//      x=-6        x=1  x=2     x=6
import type { ApplianceId, RoomId } from '@/store/useHouse'

export type Room = Exclude<RoomId, 'all'>
export type Vec3 = [number, number, number]

export const FLOOR = { width: 12, depth: 10 } as const
export const WALL = { height: 2.6, thickness: 0.15, door: 1.1 } as const

export interface RoomLayout {
  id: Room
  center: Vec3 // floor centre (y = 0)
  size: [number, number] // [x, z]
  cameraPos: Vec3
  cameraTarget: Vec3
}

function room(
  id: Room,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  camDir: [number, number],
): RoomLayout {
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const span = Math.max(x1 - x0, z1 - z0)
  return {
    id,
    center: [cx, 0, cz],
    size: [x1 - x0, z1 - z0],
    cameraPos: [cx + camDir[0] * span * 0.55, span * 1.05, cz + camDir[1] * span * 0.75],
    cameraTarget: [cx, 0.9, cz],
  }
}

export const ROOMS: Record<Room, RoomLayout> = {
  living: room('living', -6, 1, 0, 5, [-0.2, 1]),
  kitchen: room('kitchen', 1, 6, 0, 5, [0.3, 1]),
  bedroom: room('bedroom', -6, 2, -5, 0, [-0.3, 1]),
  bathroom: room('bathroom', 2, 6, -5, 0, [0.3, 1]),
}
export const ROOM_IDS = Object.keys(ROOMS) as Room[]

export const OVERVIEW = { cameraPos: [0, 13, 12] as Vec3, cameraTarget: [0, 0, 0.3] as Vec3 }

/** Shots are composed for landscape; narrower viewports pull the camera back along its view line. */
export const SHOT_FIT = { refAspect: 1.5, maxPullBack: 2.6 } as const

export interface Shot {
  cameraPos: Vec3
  cameraTarget: Vec3
}

/** Same shot, camera moved back so a narrow (portrait) viewport still shows the room's width. */
export function fitShot(shot: Shot, aspect: number): Shot {
  const k = Math.min(SHOT_FIT.maxPullBack, Math.max(1, SHOT_FIT.refAspect / (aspect || 1)))
  const [px, py, pz] = shot.cameraPos
  const [tx, ty, tz] = shot.cameraTarget
  return {
    cameraPos: [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k],
    cameraTarget: shot.cameraTarget,
  }
}

export const INTRO_CAMERA = {
  start: { cameraPos: [0, 1.7, 19] as Vec3, cameraTarget: [0, 1.2, 0] as Vec3 },
  end: { cameraPos: [1.2, 1.7, 19] as Vec3, cameraTarget: [0, 1.2, 0] as Vec3 },
} as const

export interface Anchor {
  id: ApplianceId
  room: Room
  position: Vec3 // centre of the placeholder box
  size: Vec3
  rotationY?: number
}

/** Appliances that appear once. `light` is in LIGHT_ANCHORS (one per room). */
export const ANCHORS: Anchor[] = [
  // On the living↔bedroom wall, screen facing +z: every camera looks at it from the front.
  // (Against the front wall it faced away and the wall hid it from overview and room view.)
  { id: 'tv', room: 'living', position: [-3.5, 0.85, 0.15], size: [1.4, 0.8, 0.12] },
  { id: 'fan', room: 'living', position: [-2.5, 2.35, 2.5], size: [1.2, 0.12, 1.2] },
  {
    id: 'fridge',
    room: 'kitchen',
    position: [5.45, 0.9, 0.7],
    size: [0.8, 1.8, 0.75],
    rotationY: -Math.PI / 2,
  },
  {
    id: 'microwave',
    room: 'kitchen',
    position: [5.5, 1.1, 3.2],
    size: [0.55, 0.32, 0.4],
    rotationY: -Math.PI / 2,
  },
  { id: 'ac', room: 'bedroom', position: [-2, 2.15, -4.75], size: [1.0, 0.3, 0.25] },
  {
    id: 'washer',
    room: 'bathroom',
    // far enough from the kitchen↔bathroom wall that the overview camera sees over it
    position: [5.4, 0.45, -3.0],
    size: [0.7, 0.9, 0.65],
    rotationY: -Math.PI / 2,
  },
  { id: 'geyser', room: 'bathroom', position: [4, 1.9, -4.7], size: [0.45, 0.7, 0.4] },
]

/** Plan-view [x, z] offset from the room centre, so a light never sits on another ceiling item. */
const LIGHT_OFFSET: Partial<Record<Room, [number, number]>> = {
  living: [2.2, -1.2], // the ceiling fan owns the middle of the living room
}

export const LIGHT_ANCHORS: Anchor[] = ROOM_IDS.map((r) => {
  const [dx, dz] = LIGHT_OFFSET[r] ?? [0, 0]
  return {
    id: 'light',
    room: r,
    position: [ROOMS[r].center[0] + dx, WALL.height - 0.06, ROOMS[r].center[2] + dz],
    size: [0.5, 0.06, 0.5],
  }
})

export const ALL_ANCHORS: Anchor[] = [...ANCHORS, ...LIGHT_ANCHORS]

/** Electricity meter, on the outside of the east (kitchen) wall. */
export const METER: { position: Vec3; size: Vec3 } = {
  position: [6.2, 1.5, 4],
  size: [0.12, 0.5, 0.35],
}

// ---- energy wires --------------------------------------------------------
/** Top of the meter, where the riser leaves it. */
export const METER_TOP: Vec3 = [
  METER.position[0],
  METER.position[1] + METER.size[1] / 2,
  METER.position[2],
]
/** Riser top, just above the walls: every wire fans out from here. */
export const WIRE_ORIGIN: Vec3 = [METER.position[0] + 0.05, WALL.height + 0.25, METER.position[2]]

export interface Plug {
  key: string
  id: ApplianceId
  room: Room
  position: Vec3
}

/** Where each wire lands: the top centre of its appliance (one per room for `light`). */
export const PLUGS: Plug[] = ALL_ANCHORS.map((a) => ({
  key: a.id === 'light' ? `light-${a.room}` : a.id,
  id: a.id,
  room: a.room,
  position: [a.position[0], a.position[1] + a.size[1] / 2, a.position[2]],
}))

// ---- walls ---------------------------------------------------------------
export interface WallSegment {
  position: Vec3
  size: Vec3
}

/** A straight wall along `axis` at `fixed`, from `a` to `b`, with door gaps centred at `doors`. */
function wall(
  axis: 'x' | 'z',
  fixed: number,
  a: number,
  b: number,
  doors: number[] = [],
): WallSegment[] {
  const cuts = [...doors].sort((p, q) => p - q)
  const out: WallSegment[] = []
  let start = a
  for (const d of [...cuts, Infinity]) {
    const end = d === Infinity ? b : d - WALL.door / 2
    const len = end - start
    if (len > 0.01) {
      const mid = (start + end) / 2
      out.push({
        position: axis === 'x' ? [mid, WALL.height / 2, fixed] : [fixed, WALL.height / 2, mid],
        size:
          axis === 'x' ? [len, WALL.height, WALL.thickness] : [WALL.thickness, WALL.height, len],
      })
    }
    if (d !== Infinity) start = d + WALL.door / 2
  }
  return out
}

const hx = FLOOR.width / 2
const hz = FLOOR.depth / 2
const t = WALL.thickness / 2

export const WALLS: WallSegment[] = [
  ...wall('x', -hz, -hx - t, hx + t), // back
  ...wall('x', hz, -hx - t, hx + t, [-4.5]), // front, front door into living
  ...wall('z', -hx, -hz, hz), // west
  ...wall('z', hx, -hz, hz), // east
  ...wall('x', 0, -hx, hx, [-1, 4]), // middle: living↔bedroom, kitchen↔bathroom
  ...wall('z', 1, 0, hz, [2.5]), // living↔kitchen
  ...wall('z', 2, -hz, 0), // bedroom | bathroom (entered from kitchen)
]
