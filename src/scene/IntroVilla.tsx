import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import { ContactShadows, Environment, PerformanceMonitor, Sky, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useHouse } from '@/store/useHouse'
import { MOTION } from './effects/mains'
import { glbExists } from './glb'

/** Full villa (~5.3M vertices): only for the section-cut "Villa" view, loaded when it opens. */
const FULL_URL = '/models/house.glb'
/** Simplified villa (gltfpack -cc -si 0.1 -sa, ~99k vertices, same bounds) for the intro. */
const LITE_URL = '/models/house-lite.glb'

/** Intro budget: skip the villa if it is not ready in time; cap the pixel ratio meanwhile. */
export const INTRO_BUDGET = { timeoutMs: 8000, maxDpr: 1.25, fadeS: 0.6 } as const

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

/** Skip the villa intro and go to the overhead rooms view, only while the intro still shows. */
export function skipIntro() {
  const state = useHouse.getState()
  if (state.view === 'intro') state.setView('overview')
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

type Fade = { material: THREE.Material; opacity: number; transparent: boolean }

type VillaProps = {
  url: string
  /** hide SketchUp edge-line primitives (the lite intro villa) */
  hideLines?: boolean
  onReady?: () => void
}

function Villa({ url, hideLines = false, onReady }: VillaProps) {
  const { scene } = useGLTF(url)
  const fitted = useMemo(() => {
    const object = scene.clone(true)
    const fades: Fade[] = []
    const seen = new Set<THREE.Material>()
    object.traverse((node) => {
      if (hideLines && node instanceof THREE.Line) node.visible = false
      if (!(node instanceof THREE.Mesh)) return
      node.castShadow = false
      node.receiveShadow = false
      node.frustumCulled = true
      // the rooms' night fog (far = 52 m) would wash the villa out
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) {
        if (!seen.has(material)) {
          seen.add(material)
          fades.push({ material, opacity: material.opacity, transparent: material.transparent })
        }
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
    object.scale.setScalar(scale)
    object.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
    return { object, fades }
  }, [scene, hideLines])

  // static after placement: compose the matrices once, then skip per-frame local updates
  useLayoutEffect(() => {
    const { object } = fitted
    object.updateMatrixWorld(true)
    object.traverse((node) => {
      node.matrixAutoUpdate = false
    })
  }, [fitted])

  // fade in (~0.6 s) from transparent, then restore the original opaque materials
  const fade = useRef(1)
  useLayoutEffect(() => {
    fade.current = MOTION.reduce ? 1 : 0
    if (fade.current < 1) {
      for (const f of fitted.fades) {
        f.material.transparent = true
        f.material.opacity = 0
        f.material.needsUpdate = true
      }
    }
    onReady?.()
    return () => {
      for (const f of fitted.fades) {
        f.material.opacity = f.opacity
        f.material.transparent = f.transparent
        f.material.needsUpdate = true
      }
    }
    // onReady is a mount notification only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitted])

  useFrame((_, delta) => {
    if (fade.current >= 1) return
    const next = MOTION.reduce ? 1 : Math.min(1, fade.current + delta / INTRO_BUDGET.fadeS)
    fade.current = next
    for (const f of fitted.fades) {
      if (next < 1) {
        f.material.opacity = f.opacity * next
        continue
      }
      f.material.opacity = f.opacity
      f.material.transparent = f.transparent
      f.material.needsUpdate = true
    }
  })

  return <primitive object={fitted.object} />
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
 * Villa exterior, sunset sky and light. The intro orbits a simplified villa (house-lite.glb),
 * loaded after first paint and faded in; the "Villa" view loads the full model lazily and eases
 * a clipping plane down to cut it open at the ground floor. In the rooms view nothing renders
 * (the lite GLB stays cached by useGLTF, so going back is instant).
 */
export function IntroVilla() {
  const intro = useHouse((s) => s.view === 'intro')
  const villa = useHouse((s) => s.villa)
  const cut = villa && !intro
  const show = intro || villa
  const [lite, setLite] = useState(false)
  const [full, setFull] = useState(false)
  const [ready, setReady] = useState(false)
  const get = useThree((s) => s.get)
  const setDpr = useThree((s) => s.setDpr)

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

  // start on the lite villa only after first paint: sky, ground and UI show immediately
  useEffect(() => {
    let alive = true
    const begin = () => {
      glbExists(LITE_URL).then((ok) => alive && setLite(ok))
    }
    const idle = typeof window.requestIdleCallback === 'function'
    const handle = idle
      ? window.requestIdleCallback(begin, { timeout: 500 })
      : window.setTimeout(begin, 0)
    return () => {
      alive = false
      if (idle) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [])

  // the full villa is only probed (and then loaded) once the Villa view opens
  useEffect(() => {
    if (!villa) return
    let alive = true
    glbExists(FULL_URL).then((ok) => alive && setFull(ok))
    return () => {
      alive = false
    }
  }, [villa])

  // intro budget: no villa within 8 s means skip straight to the overhead rooms view
  useEffect(() => {
    if (!intro || ready) return
    const timer = window.setTimeout(skipIntro, INTRO_BUDGET.timeoutMs)
    return () => window.clearTimeout(timer)
  }, [intro, ready])

  // cap the pixel ratio while the intro shows; restore the previous one on exit
  useEffect(() => {
    if (!intro) return
    const previous = get().viewport.dpr
    setDpr(Math.min(previous, INTRO_BUDGET.maxDpr))
    return () => setDpr(previous)
  }, [intro, get, setDpr])

  const liteVilla = (
    <Boundary>
      <Suspense fallback={null}>
        <Villa url={LITE_URL} hideLines onReady={() => setReady(true)} />
      </Suspense>
    </Boundary>
  )

  return (
    <>
      {show && <SunsetBackdrop />}
      {intro && lite && liteVilla}
      {intro && ready && (
        <>
          {/* watch the frame rate only once the villa is in (loading hitches don't count) */}
          <PerformanceMonitor onDecline={skipIntro} />
          <ContactShadows
            frames={1}
            position={[0, 0.02, -8]}
            scale={44}
            blur={2.5}
            far={10}
            opacity={0.4}
            resolution={512}
          />
        </>
      )}
      {cut && full && (
        <Boundary>
          {/* while the full villa streams in, the cached lite one stands in */}
          <Suspense fallback={lite ? liteVilla : null}>
            <Villa url={FULL_URL} />
          </Suspense>
        </Boundary>
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
