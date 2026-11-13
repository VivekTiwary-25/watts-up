import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Vec3 } from './layout'

export interface BoxSpec {
  position: Vec3
  size: Vec3
}

/** Bake many static axis-aligned boxes into one geometry: one draw call instead of one per box. */
export function mergeBoxes(boxes: BoxSpec[]): THREE.BufferGeometry {
  const parts = boxes.map((b) => new THREE.BoxGeometry(...b.size).translate(...b.position))
  const merged = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  if (!merged) throw new Error('mergeBoxes: incompatible geometries')
  merged.computeBoundingBox()
  merged.computeBoundingSphere()
  return merged
}
