import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Environment, Sky, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useHouse } from '@/store/useHouse'
import { MOTION } from './effects/mains'
import { glbExists } from './glb'

const URL = '/models/house.glb'

/**
 * The villa is fitted to 30 m across (x) and sits on the origin: bounding box centred in x/z,
 * bottom at y = 0. The building itself runs along z (about -24..9 m); the hillside rises on -x,
 * so the open facade faces +x, which is where the intro camera orbits (see VILLA_SHOT).
 */
const VILLA = { width: 30 } as const
const GROUND = { radius: 160, color: '#3d4a2f' } as const

/** Intro orbit around the villa: target, radius, height, sweep (radians either side of +x). */
export const VILLA_SHOT = {
  target: [0, -1.5, -8] as [number, number, number],
  radius: 40,
  height: 17,
  sweep: 0.55,
  periodS: 48,
} as const

/**
 * Section cut: a horizontal clipping plane keeps everything below `h` (world y). Uncut sits above
 * the roof (~11.7 m); the villa view lowers it to just over the ground floor (y ~1.83 m).
 */
export const VILLA_CUT = { uncut: 12.5, ground: 4.2, ease: 2.5 } as const

/** Villa view camera: looks down into the cut-open ground floor from the open (+x) side. */
export const VILLA_CUT_SHOT = {
  cameraPos: [16, 18, -6] as [number, number, number],
  cameraTarget: [0, 1.8, -8] as [number, number, number],
} as const

/** Keeps points with y <= constant: normal (0,-1,0) gives -y + h >= 0. */
const CUT_PLANE = new THREE.Plane(new THREE.Vector3(0, -1, 0), VILLA_CUT.uncut)
const CUT_PLANES = [CUT_PLANE]

/** The hillside terrain stays whole so the cut villa still sits on its slope. */
const isTerrain = (material: THREE.Material) => material.name.startsWith('Grass')

/** Camera position on the intro orbit at time `t` seconds (static mid-sweep when `still`). */
export function villaOrbit(t: number, still = false): [number, number, number] {
  const s = VILLA_SHOT
  const phase = still ? 0.35 : Math.sin((t / s.periodS) * Math.PI * 2) * s.sweep
  return [
    s.target[0] + Math.cos(phase) * s.radius,
    s.height,
    s.target[2] + Math.sin(phase) * s.radius,
  ]
}

/** Swallows load failures (missing GLB, offline HDR) so the rooms scene is never affected. */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function Villa() {
  const { scene } = useGLTF(URL)
  const fitted = useMemo(() => {
    const object = scene.clone(true)
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.castShadow = false
      node.receiveShadow = false
      // the rooms' night fog (far = 52 m) would wash the villa out
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) {
        material.fog = false
        if (isTerrain(material)) continue
        // section cut: interiors show their back faces once the walls above are clipped away
        material.clippingPlanes = CUT_PLANES
        material.side = THREE.DoubleSide
        material.needsUpdate = true
      }
    })
    const bounds = new THREE.Box3().setFromObject(object)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = VILLA.width / (size.x || 1)
    const position: [number, number, number] = [
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale,
    ]
    return { object, scale, position }
  }, [scene])

  return <primitive object={fitted.object} scale={fitted.scale} position={fitted.position} />
}

function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} raycast={() => null}>
      <circleGeometry args={[GROUND.radius, 64]} />
      <meshStandardMaterial color={GROUND.color} roughness={1} fog={false} />
    </mesh>
  )
}

/**
 * Villa exterior, sunset sky and light. Shows during the intro and in the "Villa" view, where a
 * clipping plane eases down to cut the villa open at the ground floor. The villa stays mounted
 * once loaded and is only hidden in the rooms view.
 */
export function IntroVilla() {
  const intro = useHouse((s) => s.view === 'intro')
  const villa = useHouse((s) => s.villa)
  const show = intro || villa
  const cut = villa && !intro
  const [exists, setExists] = useState(false)
  const get = useThree((s) => s.get)

  // material clipping planes only work with local clipping on the renderer
  useEffect(() => {
    get().gl.localClippingEnabled = true
  }, [get])

  useFrame((_, delta) => {
    const target = cut ? VILLA_CUT.ground : VILLA_CUT.uncut
    const h = CUT_PLANE.constant
    if (h === target) return
    const next = MOTION.reduce ? target : h + (target - h) * (1 - Math.exp(-delta * VILLA_CUT.ease))
    CUT_PLANE.constant = Math.abs(next - target) < 0.005 ? target : next
  })

  useEffect(() => {
    let alive = true
    glbExists(URL).then((ok) => alive && setExists(ok))
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      {show && <SunsetBackdrop />}
      {exists && (
        <group visible={show}>
          <Boundary>
            <Suspense fallback={null}>
              <Villa />
            </Suspense>
          </Boundary>
        </group>
      )}
    </>
  )
}

/** Sunset sky, ground disc and environment light; unmounted in the rooms view. */
function SunsetBackdrop() {
  return (
    <>
      <Sky
        sunPosition={[100, 1.6, -70]}
        turbidity={10}
        rayleigh={3}
        mieCoefficient={0.008}
        mieDirectionalG={0.86}
      />
      <Ground />
      <Boundary>
        <Suspense fallback={null}>
          <Environment preset="sunset" environmentIntensity={0.45} />
        </Suspense>
      </Boundary>
    </>
  )
}
