import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VISUALS } from '@/data/config'
import { MOTION } from './mains'
import { anchorOf, useLevel } from './useLevel'

const geyser = anchorOf('geyser')
const G = VISUALS.geyser

/** Tileable value noise, stretched vertically so it reads as rising heat streaks. Built once. */
function makeNoiseTexture(): THREE.Texture {
  const w = 64
  const h = 128
  const data = new Uint8Array(w * h * 4)
  const cells = 8
  const grid = Array.from({ length: cells * cells }, (_, i) => {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
    return s - Math.floor(s)
  })
  const at = (gx: number, gy: number) =>
    grid[((gy + cells) % cells) * cells + ((gx + cells) % cells)]
  const smooth = (t: number) => t * t * (3 - 2 * t)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = (x / w) * cells
      const fy = (y / h) * cells
      const ix = Math.floor(fx)
      const iy = Math.floor(fy)
      const tx = smooth(fx - ix)
      const ty = smooth(fy - iy)
      const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx
      const bot = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx
      const v = Math.pow(top + (bot - top) * ty, 2.2) * 255
      const o = (y * w + x) * 4
      data[o] = data[o + 1] = data[o + 2] = v
      data[o + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, w, h)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

/** Static soft mask: fades the plane's edges and top so the shimmer has no hard border. */
function makeMaskTexture(): THREE.Texture {
  const w = 32
  const h = 64
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1) // 0 bottom … 1 top
    const vert = Math.sin(Math.min(1, v * 1.15) * Math.PI) // fade in from bottom, out at top
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1)
      const a = Math.max(0, vert * Math.sin(u * Math.PI)) * 255
      const o = (y * w + x) * 4
      data[o] = data[o + 1] = data[o + 2] = a
      data[o + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, w, h)
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

const shimmerGeo = new THREE.PlaneGeometry(0.7, 1.1)

/** Warm heat shimmer rising off the geyser: additive plane with scrolling noise. */
export function Geyser() {
  const level = useLevel('geyser')
  const mat = useMemo(() => {
    const map = makeNoiseTexture()
    map.repeat.set(1, 0.6)
    return new THREE.MeshBasicMaterial({
      color: G.tint,
      map,
      alphaMap: makeMaskTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  }, [])

  useFrame(({ clock }, dt) => {
    mat.opacity = G.opacity * level.v
    mat.visible = level.v > 0.002
    if (MOTION.reduce || !mat.visible || !mat.map) return
    mat.map.offset.y -= Math.min(dt, 0.1) * G.scroll * 4
    mat.map.offset.x = Math.sin(clock.elapsedTime * 0.9) * 0.04
  })

  const [x, y, z] = geyser.position
  return (
    <mesh
      geometry={shimmerGeo}
      material={mat}
      position={[x, y + 0.3, z + geyser.size[2] / 2 + 0.06]}
      raycast={() => null}
    />
  )
}
