import { describe, expect, it } from 'vitest'
import { ROOMS, ROOM_IDS } from './layout'
import {
  EYE_HEIGHT,
  OVERHEAD_LIMITS,
  ROOM_LIMITS,
  freeRect,
  overheadShot,
  polarOf,
  roomEyeShot,
} from './cameraShots'

const DESKTOP = { width: 1440, height: 900 }
const PHONE = { width: 390, height: 844 }

describe('overheadShot', () => {
  it('looks down at a three-quarter angle within the orbit limits', () => {
    for (const vp of [DESKTOP, PHONE, { width: 1024, height: 768 }]) {
      const shot = overheadShot(vp)
      const polar = polarOf(shot.cameraPos, shot.cameraTarget)
      expect(polar).toBeGreaterThanOrEqual(OVERHEAD_LIMITS.minPolar)
      expect(polar).toBeLessThanOrEqual(OVERHEAD_LIMITS.maxPolar)
      expect(shot.distance).toBeGreaterThanOrEqual(OVERHEAD_LIMITS.minDistance)
      expect(shot.distance).toBeLessThanOrEqual(OVERHEAD_LIMITS.maxDistance)
    }
  })

  it('is about 35-40 degrees down on landscape and steeper on portrait', () => {
    const land = overheadShot(DESKTOP)
    const down = Math.PI / 2 - polarOf(land.cameraPos, land.cameraTarget)
    expect((down * 180) / Math.PI).toBeGreaterThan(34)
    expect((down * 180) / Math.PI).toBeLessThan(41)
    const port = overheadShot(PHONE)
    expect(polarOf(port.cameraPos, port.cameraTarget)).toBeLessThan(
      polarOf(land.cameraPos, land.cameraTarget),
    )
  })

  it('shifts the house right on desktop (bill panel is wider than the right column)', () => {
    const free = freeRect(DESKTOP)
    expect((free.left + free.right) / 2).toBeGreaterThan(0.5)
    // camera moves left so the house appears right of centre
    expect(overheadShot(DESKTOP).focalOffset[0]).toBeLessThan(0)
  })
})

describe('roomEyeShot', () => {
  it.each(ROOM_IDS)('stands inside %s at eye height and looks at the centre', (id) => {
    const room = ROOMS[id]
    const shot = roomEyeShot(room)
    const [cx, , cz] = room.center
    const [sx, sz] = room.size
    expect(shot.eye[1]).toBe(EYE_HEIGHT)
    expect(Math.abs(shot.eye[0] - cx)).toBeLessThan(sx / 2)
    expect(Math.abs(shot.eye[2] - cz)).toBeLessThan(sz / 2)
    const d = Math.hypot(
      shot.cameraTarget[0] - shot.eye[0],
      shot.cameraTarget[1] - shot.eye[1],
      shot.cameraTarget[2] - shot.eye[2],
    )
    expect(d).toBeCloseTo(ROOM_LIMITS.lookDistance, 5)
    const polar = polarOf(shot.eye, shot.cameraTarget)
    expect(polar).toBeGreaterThanOrEqual(ROOM_LIMITS.minPolar)
    expect(polar).toBeLessThanOrEqual(ROOM_LIMITS.maxPolar)
  })
})
