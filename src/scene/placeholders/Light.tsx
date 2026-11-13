import { CYL, Part, TORUS, type PlaceholderProps } from './kit'

const QUARTER_TURN = Math.PI / 2

/** Round ceiling panel: shallow drum with a metal rim. The glowing disc is drawn by effects/Lighting. */
export function LightModel({ size: [w, h], mats }: PlaceholderProps) {
  const r = w / 2 - 0.01
  return (
    <group>
      <Part geo={CYL} mat={mats.body} scale={[w, h, w]} />
      <Part
        geo={TORUS}
        mat={mats.metal}
        pos={[0, -h / 2 + 0.002, 0]}
        scale={[r, r, 0.5]}
        rot={[QUARTER_TURN, 0, 0]}
      />
    </group>
  )
}
