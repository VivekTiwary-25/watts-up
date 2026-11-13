import { BOX, Part, type PlaceholderProps } from './kit'

/** Tall body, freezer door above a fridge door with a split line, vertical handles. */
export function FridgeModel({ size: [w, h, d], mats }: PlaceholderProps) {
  const split = h * 0.2 // height of the door split above centre (freezer on top)
  const handleX = w / 2 - 0.07 // the status LED sits above the freezer handle
  const front = d / 2
  return (
    <group>
      <Part geo={BOX} mat={mats.body} scale={[w, h, d]} />
      <Part geo={BOX} mat={mats.dark} pos={[0, split, front]} scale={[w * 0.98, 0.02, 0.006]} />
      <Part
        geo={BOX}
        mat={mats.metal}
        pos={[handleX, split + 0.12, front + 0.02]}
        scale={[0.03, 0.28, 0.03]}
      />
      <Part
        geo={BOX}
        mat={mats.metal}
        pos={[handleX, split - 0.3, front + 0.02]}
        scale={[0.03, 0.5, 0.03]}
      />
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, -h / 2 + 0.03, front - 0.02]}
        scale={[w * 0.9, 0.06, 0.02]}
      />
    </group>
  )
}
