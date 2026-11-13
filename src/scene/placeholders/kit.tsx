import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '../layout'

/** Shared unit geometries: parts are scaled instances, so every placeholder reuses these. */
export const BOX = new THREE.BoxGeometry(1, 1, 1)
/** Cylinder along y, diameter 1, height 1. */
export const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
export const TORUS = new THREE.TorusGeometry(1, 0.1, 8, 40)

/** Materials of one placeholder instance: clay body (carries the power glow), charcoal trim, metal. */
export interface Mats {
  body: THREE.MeshStandardMaterial
  dark: THREE.MeshStandardMaterial
  metal: THREE.MeshStandardMaterial
}

export interface PlaceholderProps {
  size: Vec3
  mats: Mats
}

export interface Look {
  powered: boolean
  emissive: string
  emissiveIntensity: number
}

/** Per-instance materials, restyled when the power state changes. Disposed on unmount. */
export function usePlaceholderMats({ powered, emissive, emissiveIntensity }: Look): Mats {
  const mats = useMemo<Mats>(
    () => ({
      body: new THREE.MeshStandardMaterial(),
      dark: new THREE.MeshStandardMaterial({ roughness: 0.55 }),
      metal: new THREE.MeshStandardMaterial({ metalness: 0.7 }),
    }),
    [],
  )

  useEffect(() => {
    mats.body.color.set(powered ? '#e6e9ee' : '#8a909b')
    mats.body.roughness = powered ? 0.5 : 0.85
    mats.body.emissive.set(emissive)
    mats.body.emissiveIntensity = emissiveIntensity
    mats.dark.color.set(powered ? '#2a303a' : '#20242b')
    mats.metal.color.set(powered ? '#b4bcc8' : '#6b717c')
    mats.metal.roughness = powered ? 0.35 : 0.7
  }, [mats, powered, emissive, emissiveIntensity])

  useEffect(
    () => () => {
      mats.body.dispose()
      mats.dark.dispose()
      mats.metal.dispose()
    },
    [mats],
  )
  return mats
}

interface PartProps {
  geo: THREE.BufferGeometry
  mat: THREE.Material
  pos?: Vec3
  scale?: Vec3
  rot?: Vec3
}

/** One shadow-casting mesh; the raycast is disabled because the group's hit box takes the pointer. */
export function Part({ geo, mat, pos, scale, rot }: PartProps) {
  return (
    <mesh
      geometry={geo}
      material={mat}
      position={pos}
      scale={scale}
      rotation={rot}
      castShadow
      raycast={() => null}
    />
  )
}
