import * as THREE from 'three'
import { Select } from '@react-three/postprocessing'
import { PLACEHOLDER_MODELS, usePlaceholderMats } from './placeholders'
import { isPowered, useHouse } from '@/store/useHouse'
import type { Anchor } from './layout'
import { useApplianceInteraction, useHighlighted } from './useApplianceInteraction'

/** Emissive tint when running. Lights are warm, the rest cool. */
const ON_TINT: Record<Anchor['id'], string> = {
  fan: '#5fd4ff',
  ac: '#7fe0ff',
  fridge: '#8cf5d2',
  tv: '#9fd8ff',
  light: '#ffd27a',
  washer: '#7fc8ff',
  geyser: '#ff9a6a',
  stove: '#ffa060',
  microwave: '#ffc070',
  router: '#7dffb0',
}

/**
 * Faint cool glow on unpowered appliances during a power cut: the house is near-black then,
 * and the player still has to find and pick them. Kept well under the "running" glow.
 */
const STANDBY = { color: '#4f7fb0', intensity: 0.22 } as const

const HIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const HIT_MATERIAL = new THREE.MeshBasicMaterial({ visible: false })

/** Procedural stand-in for an appliance (used until/unless a GLB loads); full hover/click behaviour. */
export function ApplianceBox({ anchor }: { anchor: Anchor }) {
  const { id, position, size, rotationY = 0 } = anchor
  const powered = useHouse((s) => isPowered(s, id))
  const inCut = useHouse((s) => s.powerCut !== 'off')
  const highlighted = useHighlighted(id)
  const handlers = useApplianceInteraction(id)

  const emissive = powered ? ON_TINT[id] : inCut ? STANDBY.color : '#000000'
  const emissiveIntensity = powered ? 0.55 : inCut ? STANDBY.intensity : 0

  const mats = usePlaceholderMats({ powered, emissive, emissiveIntensity })
  const Model = PLACEHOLDER_MODELS[id]

  return (
    <Select enabled={highlighted}>
      <group name={id} position={position} rotation-y={rotationY} {...handlers}>
        <Model size={size} mats={mats} />
        {/* invisible pointer target: the full anchor box, so thin parts are easy to hit */}
        <mesh geometry={HIT_BOX} material={HIT_MATERIAL} scale={size} />
      </group>
    </Select>
  )
}
