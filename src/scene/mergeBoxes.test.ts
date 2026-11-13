import { describe, expect, it } from 'vitest'
import { mergeBoxes } from './mergeBoxes'

describe('mergeBoxes', () => {
  it('bakes every box into one geometry at its position', () => {
    const geo = mergeBoxes([
      { position: [0, 0.5, 0], size: [1, 1, 1] },
      { position: [5, 1, -2], size: [2, 2, 0.2] },
    ])
    expect(geo.getAttribute('position').count).toBe(48) // 24 verts per box
    const box = geo.boundingBox!
    const expectClose = (got: number[], want: number[]) =>
      want.forEach((w, i) => expect(got[i]).toBeCloseTo(w, 5))
    expectClose(box.min.toArray(), [-0.5, 0, -2.1])
    expectClose(box.max.toArray(), [6, 2, 0.5])
  })
})
