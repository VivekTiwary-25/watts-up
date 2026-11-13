import { BOX, CYL, Part, type PlaceholderProps } from './kit'

/** Wall-mounted storage cylinder with metal end caps, a bracket and inlet / outlet pipes below. */
export function GeyserModel({ size: [w, h, d], mats }: PlaceholderProps) {
  const dia = Math.min(w, d)
  const tankH = h * 0.8
  const tankY = h / 2 - tankH / 2
  const cap: [number, number, number] = [dia * 0.92, 0.03, dia * 0.92]
  return (
    <group>
      <Part geo={CYL} mat={mats.body} pos={[0, tankY, 0]} scale={[dia, tankH, dia]} />
      <Part geo={CYL} mat={mats.metal} pos={[0, h / 2 - 0.01, 0]} scale={cap} />
      <Part geo={CYL} mat={mats.metal} pos={[0, tankY - tankH / 2, 0]} scale={cap} />
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, tankY + 0.1, -d / 2 + 0.01]}
        scale={[dia * 0.4, 0.08, 0.04]}
      />
      {[-0.1, 0.1].map((x) => (
        <Part
          key={x}
          geo={CYL}
          mat={mats.metal}
          pos={[x, -h / 2 + 0.07, 0]}
          scale={[0.035, 0.14, 0.035]}
        />
      ))}
    </group>
  )
}
