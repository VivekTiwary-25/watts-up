import { BOX, Part, type PlaceholderProps } from './kit'

/**
 * Box with a window recess (the glowing window plane is an effect, drawn over the recess)
 * and a keypad on the right. The status LED sits above the keypad.
 */
export function MicrowaveModel({ size: [w, h, d], mats }: PlaceholderProps) {
  const front = d / 2
  const keyX = [-0.06, 0, 0.06].map((k) => k * (w / 0.55))
  const keyY = [0.05, -0.02, -0.09].map((k) => k * (h / 0.32))
  return (
    <group>
      <Part geo={BOX} mat={mats.body} scale={[w, h, d]} />
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[-w * 0.12, 0, front + 0.002]}
        scale={[w * 0.64, h * 0.78, 0.004]}
      />
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[w * 0.34, -h * 0.1, front + 0.002]}
        scale={[w * 0.26, h * 0.52, 0.004]}
      />
      {keyY.map((y) =>
        keyX.map((x) => (
          <Part
            key={`${x}-${y}`}
            geo={BOX}
            mat={mats.metal}
            pos={[w * 0.34 + x * 0.6, y - h * 0.05, front + 0.006]}
            scale={[0.02, 0.014, 0.006]}
          />
        )),
      )}
      <Part
        geo={BOX}
        mat={mats.metal}
        pos={[-w / 2 + 0.012, 0, front + 0.01]}
        scale={[0.014, h * 0.7, 0.014]}
      />
    </group>
  )
}
