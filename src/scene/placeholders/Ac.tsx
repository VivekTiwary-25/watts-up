import { RoundedBox } from '@react-three/drei'
import { BOX, Part, type PlaceholderProps } from './kit'

/** Wall-mounted split unit: rounded shell, air outlet at the bottom with louvre slats. */
export function AcModel({ size: [w, h, d], mats }: PlaceholderProps) {
  const front = d / 2
  return (
    <group>
      <RoundedBox
        args={[w, h, d]}
        radius={0.07}
        smoothness={3}
        material={mats.body}
        castShadow
        raycast={() => null}
      />
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[0, -h / 2 + 0.05, front - 0.01]}
        scale={[w * 0.9, 0.06, 0.03]}
      />
      {[0.025, 0.05, 0.075].map((y) => (
        <Part
          key={y}
          geo={BOX}
          mat={mats.metal}
          pos={[0, -h / 2 + y - 0.005, front + 0.006]}
          scale={[w * 0.86, 0.008, 0.012]}
          rot={[0.5, 0, 0]}
        />
      ))}
      <Part
        geo={BOX}
        mat={mats.dark}
        pos={[w * 0.36, h * 0.18, front + 0.002]}
        scale={[0.1, 0.045, 0.004]}
      />
    </group>
  )
}
