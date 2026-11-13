import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  ALL_ANCHORS,
  OVERVIEW,
  ROOMS,
  ROOM_IDS,
  WALLS,
  fitShot,
  overviewShot,
  type Anchor,
  type Vec3,
} from './layout'

// Camera fov must match App.tsx <Canvas camera={{ fov }}>.
const FOV = 45
const ASPECT = 16 / 9
// Scene fog starts at 20 (src/data/config.ts); allow a little haze but keep the house clear.
const QUALITY_FOG_NEAR = 20

const wallBoxes = WALLS.map((w) => {
  const half = new THREE.Vector3(...w.size).multiplyScalar(0.5)
  const c = new THREE.Vector3(...w.position)
  return new THREE.Box3(c.clone().sub(half), c.clone().add(half))
})

/** Front-face centre (local +z) and top centre: what the player needs to see of an appliance. */
function samplePoints(a: Anchor): THREE.Vector3[] {
  const [x, y, z] = a.position
  const r = a.rotationY ?? 0
  const front = new THREE.Vector3(Math.sin(r), 0, Math.cos(r)).multiplyScalar(a.size[2] / 2)
  return [new THREE.Vector3(x, y + a.size[1] / 2, z), new THREE.Vector3(x, y, z).add(front)]
}

/** True when no wall sits between the camera and at least one sample point of the appliance. */
function visibleFrom(cameraPos: Vec3, a: Anchor): boolean {
  const origin = new THREE.Vector3(...cameraPos)
  return samplePoints(a).some((p) => {
    const dir = p.clone().sub(origin)
    const dist = dir.length()
    const ray = new THREE.Ray(origin, dir.normalize())
    const hit = new THREE.Vector3()
    return wallBoxes.every((b) => !ray.intersectBox(b, hit) || hit.distanceTo(origin) > dist - 0.02)
  })
}

function inFrustum(cameraPos: Vec3, target: Vec3, a: Anchor, aspect = ASPECT): boolean {
  const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100)
  cam.position.set(...cameraPos)
  cam.lookAt(...target)
  cam.updateMatrixWorld()
  const ndc = new THREE.Vector3(...a.position).project(cam)
  return Math.abs(ndc.x) < 0.95 && Math.abs(ndc.y) < 0.95 && ndc.z < 1
}

describe('camera framing', () => {
  it.each(ROOM_IDS)('every appliance in the %s is in shot and not hidden by a wall', (room) => {
    const shot = ROOMS[room]
    for (const a of ALL_ANCHORS.filter((x) => x.room === room)) {
      expect(inFrustum(shot.cameraPos, shot.cameraTarget, a), `${a.id} in frame`).toBe(true)
      expect(visibleFrom(shot.cameraPos, a), `${a.id} not behind a wall`).toBe(true)
    }
  })

  it.each([
    ['phone portrait', 9 / 19.5],
    ['tablet portrait', 3 / 4],
  ])('%s: fitted room shots keep every appliance in frame', (_, aspect) => {
    for (const room of ROOM_IDS) {
      const shot = fitShot(ROOMS[room], aspect)
      for (const a of ALL_ANCHORS.filter((x) => x.room === room)) {
        const label = `${room}/${a.id}`
        expect(inFrustum(shot.cameraPos, shot.cameraTarget, a, aspect), label).toBe(true)
        expect(visibleFrom(shot.cameraPos, a), label).toBe(true)
      }
    }
  })

  it('fitShot leaves landscape shots untouched', () => {
    expect(fitShot(ROOMS.living, 16 / 9).cameraPos).toEqual(ROOMS.living.cameraPos)
  })

  it.each([
    ['phone portrait 9:19.5', 9 / 19.5],
    ['tablet portrait', 3 / 4],
  ])('%s: overview frames every appliance and stays out of the fog', (_, aspect) => {
    const shot = overviewShot(aspect)
    const dist = new THREE.Vector3(...shot.cameraPos).distanceTo(
      new THREE.Vector3(...shot.cameraTarget),
    )
    expect(dist).toBeLessThan(QUALITY_FOG_NEAR + 8)
    for (const a of ALL_ANCHORS) {
      const label = `${a.id}/${a.room}`
      expect(inFrustum(shot.cameraPos, shot.cameraTarget, a, aspect), label).toBe(true)
      expect(visibleFrom(shot.cameraPos, a), label).toBe(true)
    }
  })

  it('landscape overview is unchanged', () => {
    expect(overviewShot(16 / 9)).toBe(OVERVIEW)
  })

  it('overview sees every appliance', () => {
    for (const a of ALL_ANCHORS) {
      const label = `${a.id}/${a.room}`
      expect(inFrustum(OVERVIEW.cameraPos, OVERVIEW.cameraTarget, a), label).toBe(true)
      expect(visibleFrom(OVERVIEW.cameraPos, a), label).toBe(true)
    }
  })
})
