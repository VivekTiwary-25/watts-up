import { Select } from '@react-three/postprocessing'
import { isPowered, useHouse } from '@/store/useHouse'
import type { Anchor } from './layout'
import { useApplianceInteraction, useHighlighted } from './useApplianceInteraction'

/** Emissive tint when running. Lights are warm, the rest cool. */
const ON_TINT: Record<Anchor['id'], string> = {
  fan: '#5fd4ff', ac: '#7fe0ff', fridge: '#8cf5d2', tv: '#9fd8ff',
  light: '#ffd27a', washer: '#7fc8ff', geyser: '#ff9a6a', microwave: '#ffc070',
}

/** Grey placeholder box for an appliance; full hover/click behaviour. */
export function ApplianceBox({ anchor }: { anchor: Anchor }) {
  const { id, position, size, rotationY = 0 } = anchor
  const powered = useHouse((s) => isPowered(s, id))
  const highlighted = useHighlighted(id)
  const handlers = useApplianceInteraction(id)

  return (
    <Select enabled={highlighted}>
      <mesh name={id} position={position} rotation-y={rotationY} castShadow {...handlers}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={powered ? '#c9d0da' : '#6b717c'}
          roughness={powered ? 0.45 : 0.85}
          emissive={powered ? ON_TINT[id] : '#000000'}
          emissiveIntensity={powered ? 0.55 : 0}
        />
      </mesh>
    </Select>
  )
}
