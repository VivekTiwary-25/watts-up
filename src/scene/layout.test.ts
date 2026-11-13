import { describe, expect, it } from 'vitest'
import {
  ALL_ANCHORS,
  ANCHORS,
  FLOOR,
  LIGHT_ANCHORS,
  METER,
  ROOMS,
  ROOM_IDS,
  WALL,
  WALLS,
} from './layout'

const inside = (r: (typeof ROOMS)[keyof typeof ROOMS], x: number, z: number) =>
  Math.abs(x - r.center[0]) <= r.size[0] / 2 && Math.abs(z - r.center[2]) <= r.size[1] / 2

describe('layout', () => {
  it('rooms tile the 12×10 floor', () => {
    const area = ROOM_IDS.reduce((a, id) => a + ROOMS[id].size[0] * ROOMS[id].size[1], 0)
    expect(area).toBeCloseTo(FLOOR.width * FLOOR.depth)
  })

  it('every non-light appliance appears once, inside its room and under the wall height', () => {
    expect(new Set(ANCHORS.map((a) => a.id)).size).toBe(9)
    for (const a of ALL_ANCHORS) {
      expect(inside(ROOMS[a.room], a.position[0], a.position[2]), a.id).toBe(true)
      expect(a.position[1] + a.size[1] / 2).toBeLessThanOrEqual(WALL.height)
    }
  })

  it('one light per room', () => {
    expect(LIGHT_ANCHORS.map((a) => a.room).sort()).toEqual([...ROOM_IDS].sort())
  })

  it('tube lights hang high on the inside of the east wall', () => {
    const tubes = LIGHT_ANCHORS.filter((a) => a.model === 'tubelight.glb')
    expect(tubes.map((a) => a.room).sort()).toEqual(['bathroom', 'kitchen'])
    const face = FLOOR.width / 2 - WALL.thickness / 2
    for (const a of tubes) {
      expect(a.position[0] + a.size[2] / 2, a.room).toBeLessThanOrEqual(face)
      expect(face - a.position[0], a.room).toBeLessThan(0.15)
      expect(a.position[1], a.room).toBeGreaterThan(2)
    }
  })

  it('no two clickable anchors overlap in plan view', () => {
    const rect = (a: (typeof ALL_ANCHORS)[number]) => {
      const turned = Math.abs(Math.sin(a.rotationY ?? 0)) > 0.5
      const [w, d] = turned ? [a.size[2], a.size[0]] : [a.size[0], a.size[2]]
      return {
        x0: a.position[0] - w / 2,
        x1: a.position[0] + w / 2,
        z0: a.position[2] - d / 2,
        z1: a.position[2] + d / 2,
      }
    }
    for (let i = 0; i < ALL_ANCHORS.length; i++) {
      for (let j = i + 1; j < ALL_ANCHORS.length; j++) {
        const a = rect(ALL_ANCHORS[i])
        const b = rect(ALL_ANCHORS[j])
        const overlap = a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1
        expect(overlap, `${ALL_ANCHORS[i].id} vs ${ALL_ANCHORS[j].id}`).toBe(false)
      }
    }
  })

  it('no appliance pokes into a wall', () => {
    const world = (a: (typeof ALL_ANCHORS)[number]) => {
      const turned = Math.abs(Math.sin(a.rotationY ?? 0)) > 0.5
      const [w, d] = turned ? [a.size[2], a.size[0]] : [a.size[0], a.size[2]]
      return {
        min: [a.position[0] - w / 2, a.position[1] - a.size[1] / 2, a.position[2] - d / 2],
        max: [a.position[0] + w / 2, a.position[1] + a.size[1] / 2, a.position[2] + d / 2],
      }
    }
    for (const a of ALL_ANCHORS) {
      const b = world(a)
      for (const wall of WALLS) {
        const overlap = [0, 1, 2].every(
          (k) =>
            b.min[k] < wall.position[k] + wall.size[k] / 2 - 1e-6 &&
            wall.position[k] - wall.size[k] / 2 + 1e-6 < b.max[k],
        )
        expect(overlap, `${a.id}/${a.room} vs wall at ${wall.position}`).toBe(false)
      }
    }
  })

  it('walls are at most full height and leave door gaps', () => {
    expect(WALLS.every((w) => w.size[1] <= WALL.height)).toBe(true)
    // the far outer walls stay full height: wall-mounted appliances hang on them
    const far = WALLS.filter(
      (w) =>
        Math.abs(w.position[2] + FLOOR.depth / 2) < 1e-6 ||
        Math.abs(Math.abs(w.position[0]) - FLOOR.width / 2) < 1e-6,
    )
    expect(far.length).toBeGreaterThanOrEqual(3)
    expect(far.every((w) => w.size[1] === WALL.height)).toBe(true)
    expect(WALLS.length).toBeGreaterThan(7) // 7 wall lines + splits for doors
  })

  it('meter is outside the floor plan', () => {
    expect(Math.abs(METER.position[0])).toBeGreaterThan(FLOOR.width / 2)
  })
})
