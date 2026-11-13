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

/**
 * Portrait overview: high and looking along the house's short axis (from the east), so the
 * 10 m depth spans the narrow screen width at a distance that stays out of the scene fog.
 * Composed for `OVERVIEW_PORTRAIT_ASPECT`.
 */
export const OVERVIEW_PORTRAIT: Shot = { cameraPos: [-9, 19, -0.8], cameraTarget: [0, 0, -0.8] }
export const OVERVIEW_PORTRAIT_ASPECT = 0.6

/** Same shot, camera moved back so a narrow (portrait) viewport still shows the room's width. */
export function fitShot(shot: Shot, aspect: number, refAspect: number = SHOT_FIT.refAspect): Shot {
  const k = Math.min(SHOT_FIT.maxPullBack, Math.max(1, refAspect / (aspect || 1)))
  const [px, py, pz] = shot.cameraPos
  const [tx, ty, tz] = shot.cameraTarget
  return {
    cameraPos: [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k],
    cameraTarget: shot.cameraTarget,
  }
}

/** Overview shot for a viewport: the classic angle on landscape, the portrait shot below aspect 1. */
export function overviewShot(aspect: number): Shot {
  if (aspect >= 1) return OVERVIEW
  return fitShot(OVERVIEW_PORTRAIT, aspect, OVERVIEW_PORTRAIT_ASPECT)
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
  /** Model file in /models overriding Appliance.modelFile (e.g. a different fixture per room). */
  model?: string
}

/**
 * Inside faces of the walls things are mounted on or stand against (centre line ± half thickness).
 * Anchors are placed so their fitted box touches these faces at most, never pokes through.
 */
const EAST_FACE = FLOOR.width / 2 - WALL.thickness / 2 // 5.925
const WEST_FACE = -FLOOR.width / 2 + WALL.thickness / 2 // -5.925
const BACK_FACE = -FLOOR.depth / 2 + WALL.thickness / 2 // -4.925

/** Turns an appliance's front (local +z) to face -x (east wall) or +x (west wall). */
const FACE_WEST = -Math.PI / 2
const FACE_EAST = Math.PI / 2

/**
 * Appliances that appear once (positions from coord/tasks/ROOM-PLAN.md). `light` is in
 * LIGHT_ANCHORS. `size` is the GLB's fitted real-world box in the anchor's own frame
 * (x = width, y = height, z = depth), so effects, wires and halos line up with the model.
 */
export const ANCHORS: Anchor[] = [
  // stands on the living-room media console (top y = 0.5), screen facing +z
  { id: 'tv', room: 'living', position: [-3.0, 0.86, 0.35], size: [1.2, 0.716, 0.199] },
  { id: 'fan', room: 'living', position: [-3.0, 2.35, 2.5], size: [1.4, 0.494, 1.4] },
  {
    id: 'fridge',
    room: 'kitchen',
    // 0.968 deep: centre x kept 0.484 off the east wall face
    position: [5.44, 0.9, 0.66],
    size: [1.137, 1.8, 0.968],
    rotationY: FACE_WEST,
  },
  {
    id: 'stove',
    room: 'kitchen',
    // in the counter gap z 2.0..2.9; top at y = 0.9
    position: [EAST_FACE - 0.455, 0.45, 2.45],
    size: [0.9, 0.9, 0.9],
    rotationY: FACE_WEST,
  },
  {
    id: 'microwave',
    room: 'kitchen',
    // on the counter top (y = 0.9)
    position: [5.65, 0.9 + 0.245 / 2 + 0.005, 3.7],
    size: [0.5, 0.245, 0.347],
    rotationY: FACE_WEST,
  },
  {
    id: 'router',
    room: 'living',
    // on the west-wall shelf (top y = 1.1), facing into the room
    position: [WEST_FACE + 0.181 / 2 + 0.005, 1.1 + 0.185 / 2, 1.2],
    size: [0.25, 0.185, 0.181],
    rotationY: FACE_EAST,
  },
  {
    id: 'ac',
    room: 'bedroom',
    // high on the back wall above the bed
    position: [-3.0, 2.15, BACK_FACE + 0.25 / 2 + 0.005],
    size: [1.0, 0.32, 0.25],
  },
  {
    id: 'washer',
    room: 'bathroom',
    position: [5.45, 0.43, -3.0],
    size: [0.62, 0.85, 0.66],
    rotationY: FACE_WEST,
  },
  {
    id: 'geyser',
    room: 'bathroom',
    // on the back wall
    position: [4.6, 1.9, BACK_FACE + 0.391 / 2 + 0.005],
    size: [0.391, 0.6, 0.391],
  },
]

/** Tube light: 1.2 m along its local x, turned to run along the east (x = 6) wall facing -x. */
const TUBE: Vec3 = [1.2, 0.029, 0.032]
const TUBE_X = 5.885
const TUBE_Y = 2.25

/**
 * One light fixture per room. Living: chandelier (off-centre, the ceiling fan owns the middle).
 * Bedroom: pendant ceiling lamp. Kitchen and bathroom: a tube light high on the east wall.
 */
export const LIGHT_ANCHORS: Anchor[] = [
  {
    id: 'light',
    room: 'living',
    model: 'chandelier.glb',
    position: [-0.6, 2.17, 1.4],
    size: [0.8, 0.855, 0.874], // chandelier.glb at 0.8 m wide
  },
  {
    id: 'light',
    room: 'kitchen',
    model: 'tubelight.glb',
    position: [TUBE_X, TUBE_Y, 4.2],
    size: TUBE,
    rotationY: FACE_WEST,
  },
  {
    id: 'light',
    room: 'bedroom',
    model: 'light.glb',
    position: [-4.6, 2.1, -2.2],
    size: [0.45, 0.992, 0.45], // light.glb at 0.45 m wide
  },
  {
    id: 'light',
    room: 'bathroom',
    model: 'tubelight.glb',
    position: [TUBE_X, TUBE_Y, -1.2],
    size: TUBE,
    rotationY: FACE_WEST,
  },
]

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
