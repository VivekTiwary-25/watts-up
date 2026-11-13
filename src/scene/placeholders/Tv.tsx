import { BOX, Part, type PlaceholderProps } from './kit'

/**
 * Thin charcoal panel on a wall bracket. The lit screen is an effect plane 0.004 in front of the
 * anchor's front face (depth / 2), so the panel's front sits exactly at that depth.
 */
export function TvModel({ size: [w, h, d], mats }: PlaceholderProps) {
  const panelD = d * 0.45
  return (
    <group>
      <Part geo={BOX} mat={mats.dark} pos={[0, 0, d / 2 - panelD / 2]} scale={[w, h, panelD]} />
      <Part
        geo={BOX}
        mat={mats.body}
        pos={[0, 0, -d / 2 + (d - panelD) / 2]}
        scale={[w * 0.45, h * 0.45, d - panelD]}
      />
      <Part
        geo={BOX}
        mat={mats.metal}
        pos={[0, -h / 2 + 0.012, d / 2 + 0.002]}
        scale={[w * 0.12, 0.012, 0.004]}
      />
    </group>
  )
}
