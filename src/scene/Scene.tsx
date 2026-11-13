import { EffectComposer, Outline, Selection } from '@react-three/postprocessing'
import { ApplianceModel } from './ApplianceModel'
import { CameraRig } from './CameraRig'
import { House } from './House'
import { Effects } from './effects/Effects'
import { ALL_ANCHORS, METER } from './layout'

function Meter() {
  return (
    <mesh name="meter" position={METER.position}>
      <boxGeometry args={METER.size} />
      <meshStandardMaterial color="#2a2f38" emissive="#3bd6a0" emissiveIntensity={0.25} roughness={0.6} />
    </mesh>
  )
}

/** Everything inside the Canvas. */
export function Scene() {
  return (
    <>
      <color attach="background" args={['#0d1117']} />
      <fog attach="fog" args={['#0d1117', 22, 45]} />
      {/* lights, appliance motion, energy wires, power-cut flicker */}
      <Effects />

      <Selection>
        <House />
        <Meter />
        {ALL_ANCHORS.map((a) => (
          <ApplianceModel key={`${a.id}-${a.room}`} anchor={a} />
        ))}
        <EffectComposer autoClear={false} multisampling={4}>
          <Outline blur edgeStrength={6} visibleEdgeColor={0x7fe8ff} hiddenEdgeColor={0x1b4a5a} xRay={false} />
        </EffectComposer>
      </Selection>

      <CameraRig />
    </>
  )
}
