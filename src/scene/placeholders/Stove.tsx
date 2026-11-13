import { BOX, CYL, Part, type PlaceholderProps } from './kit'

/**
 * Freestanding electric stove: oven body, dark glass oven door with a bar handle, a control
 * strip with dials, and four hob plates on top (the glowing hob rings are an effect).
 */
export function StoveModel({ size: [w, h, d], mats }: PlaceholderProps) {
  const front = d / 2
  const dials = [-0.3, -0.15, 0.15, 0.3].map((k) => k * w)
  const plates: [number, number][] = [
    [-w * 0.22, -d * 0.2],
    [w * 0.22, -d * 0.2],
    [-w * 0.22, d * 0.18],
    [w * 0.22, d * 0.18],
  ]
  return (
    <group>
      <Part geo={BOX} mat={mats.body} scale={[w, h, d]} />
      {/* oven door + handle */}
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, -h * 0.12, front + 0.003]}
        scale={[w * 0.86, h * 0.55, 0.006]}
      />
      <Part
        geo={BOX}
        mat={mats.metal}
        pos={[0, h * 0.2, front + 0.025]}
        scale={[w * 0.7, 0.02, 0.02]}
      />
      {/* control strip + dials */}
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, h / 2 - 0.05, front + 0.003]}
        scale={[w * 0.96, 0.08, 0.006]}
      />
      {dials.map((x) => (
        <Part
          key={x}
          geo={CYL}
          mat={mats.metal}
          pos={[x, h / 2 - 0.05, front + 0.015]}
          scale={[0.04, 0.02, 0.04]}
          rot={[Math.PI / 2, 0, 0]}
        />
      ))}
      {/* glass hob top with four plates */}
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, h / 2 + 0.004, 0]}
        scale={[w * 0.96, 0.008, d * 0.92]}
      />
      {plates.map(([x, z]) => (
        <Part
          key={`${x}-${z}`}
          geo={CYL}
          mat={mats.metal}
          pos={[x, h / 2 + 0.009, z]}
          scale={[w * 0.28, 0.004, w * 0.28]}
        />
      ))}
    </group>
  )
}
