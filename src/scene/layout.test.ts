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
    expect(new Set(ANCHORS.map((a) => a.id)).size).toBe(7)
    for (const a of ALL_ANCHORS) {
      expect(inside(ROOMS[a.room], a.position[0], a.position[2]), a.id).toBe(true)
      expect(a.position[1] + a.size[1] / 2).toBeLessThanOrEqual(WALL.height)
    }
  })

  it('one light per room', () => {
    expect(LIGHT_ANCHORS.map((a) => a.room).sort()).toEqual([...ROOM_IDS].sort())
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

  it('walls are full height and leave door gaps', () => {
    expect(WALLS.every((w) => w.size[1] === WALL.height)).toBe(true)
    expect(WALLS.length).toBeGreaterThan(7) // 7 wall lines + splits for doors
  })

  it('meter is outside the floor plan', () => {
    expect(Math.abs(METER.position[0])).toBeGreaterThan(FLOOR.width / 2)
  })
})
