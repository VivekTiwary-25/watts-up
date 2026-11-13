// Camera shots for the dollhouse overview and the first-person room view.
// Pure maths (no React, no three) so it can be unit tested.
import { FLOOR, WALL, type RoomLayout, type Vec3 } from './layout'

/** Must match App.tsx <Canvas camera={{ fov }}>. */
export const CAMERA_FOV = 45

/** Window event that asks the camera rig to re-apply the current shot. */
export const RESET_VIEW_EVENT = 'wattsup:reset-view'

export function requestResetView() {
  window.dispatchEvent(new CustomEvent(RESET_VIEW_EVENT))
}

/** Orbit limits per view (radians / metres). */
export const OVERHEAD_LIMITS = {
  minPolar: 0.35,
  maxPolar: 1.2,
  minDistance: 8,
  maxDistance: 30,
} as const

export const ROOM_LIMITS = {
  minPolar: 1.0,
  maxPolar: 1.9,
  /** Orbit radius in room view: the camera turns in place around a point this far ahead. */
  lookDistance: 0.01,
} as const

export const EYE_HEIGHT = 1.6
/** How far the eye stands in from the room's front (+z) edge. */
export const EYE_INSET = 0.6
/** Height of the point the eye looks at, over the room centre. */
export const LOOK_HEIGHT = 1.1

export interface Viewport {
  width: number
  height: number
}

/** Free screen rectangle between the HUD panels, as fractions of the viewport (0..1). */
export interface FreeRect {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Where the HUD leaves the 3D house visible. Mirrors HUD.tsx: on `sm`+ the bill panel
 * (max-w-sm) sits on the left and the target/appliance column (w-64 / md:w-72) on the right;
 * below `sm` the bill is on top and the appliance list covers the bottom 35% of the screen.
 */
export function freeRect({ width, height }: Viewport): FreeRect {
  const w = Math.max(width, 1)
  const h = Math.max(height, 1)
  if (width >= 640) {
    const pad = width >= 768 ? 24 : 12
    const rightCol = width >= 768 ? 288 : 256
    const left = Math.min(pad + 384 + 12, w * 0.4)
    const right = w - (pad + rightCol + 12)
    return { left: left / w, right: Math.max(right, left + 1) / w, top: (pad + 56) / h, bottom: 1 }
  }
  return { left: 0.02, right: 0.98, top: 0.3, bottom: 0.65 }
}

export interface OverheadShot {
  cameraPos: Vec3
  cameraTarget: Vec3
  /** Screen-parallel offset (metres) for CameraControls.setFocalOffset. */
  focalOffset: Vec3
  distance: number
}

const HOUSE_TARGET: Vec3 = [0, 0.5, 0]
/** The house may tuck a little under the panel edges: fit to the free rect plus 30% of the rest. */
const PANEL_OVERLAP = 0.3
/** Fit distance caps: beyond ~24 m the scene fog (near 20 m) starts to wash the house out. */
const FIT_MAX = { landscape: 24, portrait: 28 } as const

/**
 * Three-quarter dollhouse angle (40 deg down) on landscape, steeper and from the west on
 * portrait. The distance fits the house into the free rectangle between the HUD panels and
 * the focal offset slides it into the middle of that rectangle.
 */
export function overheadShot(viewport: Viewport, fov: number = CAMERA_FOV): OverheadShot {
  const aspect = viewport.width / Math.max(viewport.height, 1)
  const portrait = aspect < 1
  const azimuth = portrait ? -1.2 : 0.55
  const elevation = portrait ? 1.0 : 0.7

  // projected house extents for this angle (box FLOOR.width x WALL.height x FLOOR.depth)
  const sa = Math.abs(Math.sin(azimuth))
  const ca = Math.abs(Math.cos(azimuth))
  const halfW = 0.5 * (FLOOR.width * ca + FLOOR.depth * sa)
  const along = FLOOR.width * sa + FLOOR.depth * ca
  const halfH = 0.5 * (along * Math.sin(elevation) + WALL.height * Math.cos(elevation))

  const free = freeRect(viewport)
  const freeW = Math.max(free.right - free.left, 0.2)
  const freeH = Math.max(free.bottom - free.top, 0.2)
  const fitW = freeW + (1 - freeW) * PANEL_OVERLAP
  const fitH = freeH + (1 - freeH) * PANEL_OVERLAP
  const tanHalf = Math.tan((fov * Math.PI) / 360)
  const byWidth = halfW / (fitW * tanHalf * aspect)
  const byHeight = halfH / (fitH * tanHalf)
  const distance = Math.min(
    portrait ? FIT_MAX.portrait : FIT_MAX.landscape,
    Math.max(OVERHEAD_LIMITS.minDistance, byWidth, byHeight),
  )

  const [tx, ty, tz] = HOUSE_TARGET
  const cameraPos: Vec3 = [
    tx + distance * Math.cos(elevation) * Math.sin(azimuth),
    ty + distance * Math.sin(elevation),
    tz + distance * Math.cos(elevation) * Math.cos(azimuth),
  ]

  // move the camera opposite to where the house should appear on screen
  const visibleH = 2 * distance * tanHalf
  const visibleW = visibleH * aspect
  const cx = (free.left + free.right) / 2
  const cy = (free.top + free.bottom) / 2
  const focalOffset: Vec3 = [-(cx - 0.5) * visibleW, (cy - 0.5) * visibleH, 0]

  return { cameraPos, cameraTarget: HOUSE_TARGET, focalOffset, distance }
}

export interface EyeShot {
  /** Where the camera stands (eye height, just inside the room's front edge). */
  eye: Vec3
  /** The point it looks at (room centre). */
  lookAt: Vec3
  /** CameraControls target: a hair in front of the eye so orbiting = turning the head. */
  cameraTarget: Vec3
}

/** First-person shot standing inside the room, looking at its centre. */
export function roomEyeShot(room: Pick<RoomLayout, 'center' | 'size'>): EyeShot {
  const [cx, , cz] = room.center
  const depth = room.size[1]
  const inset = Math.min(EYE_INSET, depth / 3)
  const eye: Vec3 = [cx, EYE_HEIGHT, cz + depth / 2 - inset]
  const lookAt: Vec3 = [cx, LOOK_HEIGHT, cz]
  const dx = lookAt[0] - eye[0]
  const dy = lookAt[1] - eye[1]
  const dz = lookAt[2] - eye[2]
  const len = Math.hypot(dx, dy, dz) || 1
  const k = ROOM_LIMITS.lookDistance / len
  return { eye, lookAt, cameraTarget: [eye[0] + dx * k, eye[1] + dy * k, eye[2] + dz * k] }
}

/** Polar angle (from +y) of the camera around its target, as CameraControls measures it. */
export function polarOf(pos: Vec3, target: Vec3): number {
  const dx = pos[0] - target[0]
  const dy = pos[1] - target[1]
  const dz = pos[2] - target[2]
  const r = Math.hypot(dx, dy, dz) || 1
  return Math.acos(Math.max(-1, Math.min(1, dy / r)))
}
