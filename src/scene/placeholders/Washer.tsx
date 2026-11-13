import { BOX, CYL, Part, TORUS, type PlaceholderProps } from './kit'

const QUARTER_TURN = Math.PI / 2

/**
 * Front-loader: control strip on top, a chrome ring around the door opening. The door glass and
 * spinning drum are an effect centred 0.06 below the middle of the front face.
 */
export function WasherModel({ size: [w, h, d], mats }: PlaceholderProps) {
  const front = d / 2
  const stripH = 0.14
  const stripY = h / 2 - stripH / 2 - 0.02
  return (
    <group>
      <Part geo={BOX} mat={mats.body} scale={[w, h, d]} />
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, stripY, front + 0.002]}
        scale={[w * 0.92, stripH, 0.004]}
      />
      <Part
        geo={CYL}
        mat={mats.metal}
        pos={[-w * 0.2, stripY, front + 0.014]}
        scale={[0.07, 0.02, 0.07]}
        rot={[QUARTER_TURN, 0, 0]}
      />
      <Part
        geo={CYL}
        mat={mats.dark}
        pos={[0, -0.06, front + 0.001]}
        scale={[0.52, 0.002, 0.52]}
        rot={[QUARTER_TURN, 0, 0]}
      />
      <Part
        geo={TORUS}
        mat={mats.metal}
        pos={[0, -0.06, front + 0.003]}
        scale={[0.26, 0.26, 0.26]}
      />
    </group>
  )
}
