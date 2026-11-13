import { EffectComposer, Outline, Selection } from '@react-three/postprocessing'
import { isPowered, useHouse } from '@/store/useHouse'
import { ApplianceModel } from './ApplianceModel'
import { CameraRig } from './CameraRig'
import { House } from './House'
import { ALL_ANCHORS, LIGHT_ANCHORS, METER } from './layout'

/** Warm point light in every room while `light` is powered. */
function RoomLights() {
  const lit = useHouse((s) => isPowered(s, 'light'))
  if (!lit) return null
  return (
    <>
      {LIGHT_ANCHORS.map((a) => (
        <pointLight key={a.room} position={[a.position[0], a.position[1] - 0.25, a.position[2]]} color="#ffc98a" intensity={6} distance={6} decay={2} />
      ))}
    </>
  )
}

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
      <hemisphereLight args={['#b8c4d8', '#1a1d24', 0.55]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[6, 12, 7]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0005}
      />
      <RoomLights />

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
