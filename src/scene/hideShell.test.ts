import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { hideShell } from './hideShell'

describe('hideShell', () => {
  it('hides the roof while keeping a tabletop and tall wall', () => {
    const root = new THREE.Group()
    const roof = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 8))
    roof.name = 'roof-panel'
    roof.position.y = 4.9
    const table = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1))
    table.name = 'tabletop'
    table.position.y = 2
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 8))
    wall.name = 'wall'
    root.add(roof, table, wall)

    expect(hideShell(root)).toContain('roof-panel')
    expect(roof.visible).toBe(false)
    expect(table.visible).toBe(true)
    expect(wall.visible).toBe(true)
  })
})
