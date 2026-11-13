import { CYL, Part, type PlaceholderProps } from './kit'

/** Ceiling is 0.25 above the anchor centre (the blade plane). */
const TO_CEILING = 0.25

/**
 * Static part of the ceiling fan: canopy, down-rod and motor housing. The blades are the
 * spinning group in effects/Fan.tsx.
 */
export function FanModel({ size: [, h], mats }: PlaceholderProps) {
  const rod = TO_CEILING - h / 2
  return (
    <group>
      <Part geo={CYL} mat={mats.body} scale={[0.22, h, 0.22]} />
      <Part geo={CYL} mat={mats.metal} pos={[0, h / 2 + rod / 2, 0]} scale={[0.03, rod, 0.03]} />
      <Part geo={CYL} mat={mats.dark} pos={[0, TO_CEILING - 0.015, 0]} scale={[0.14, 0.03, 0.14]} />
      <Part geo={CYL} mat={mats.dark} pos={[0, -h / 2 - 0.01, 0]} scale={[0.1, 0.02, 0.1]} />
    </group>
  )
}
