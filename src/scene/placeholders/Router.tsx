import { BOX, CYL, Part, type PlaceholderProps } from './kit'

/** Flat router body with two antennas at the back (the blinking LEDs are an effect). */
export function RouterModel({ size: [w, h, d], mats }: PlaceholderProps) {
  const bodyH = h * 0.3
  const bodyY = -h / 2 + bodyH / 2
  return (
    <group>
      <Part geo={BOX} mat={mats.body} pos={[0, bodyY, 0]} scale={[w, bodyH, d]} />
      {[-0.35, 0.35].map((k) => (
        <Part
          key={k}
          geo={CYL}
          mat={mats.dark}
          pos={[k * w, bodyY + bodyH / 2 + (h - bodyH) / 2, -d / 2 + 0.01]}
          scale={[0.012, h - bodyH, 0.012]}
        />
      ))}
    </group>
  )
}
