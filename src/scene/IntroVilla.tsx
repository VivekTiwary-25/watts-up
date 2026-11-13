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
import { ContactShadows, Environment, Sky, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useHouse } from '@/store/useHouse'
import { MOTION } from './effects/mains'
import { glbExists } from './glb'

/** Full villa (~5.3M vertices): only for the section-cut "Villa" view, loaded when it opens. */
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
  periodS: 64,
} as const

/** Villa view looks a little higher than the intro (no hero card below), so the villa sits centred. */
export const VILLA_VIEW_TARGET: [number, number, number] = [0, 2.5, -8]

/**
 * Camera position on the villa orbit at time `t` seconds. t = 0 (and `still`, for reduced motion)
 * is the front view of the open +x facade; from there it sways slowly either side and back.
 */
export function villaOrbit(t: number, still = false): [number, number, number] {
  const s = VILLA_SHOT
  const phase = still ? 0 : Math.sin((t / s.periodS) * Math.PI * 2) * s.sweep
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
 * Villa exterior, sunset sky and light. The intro and the "Villa" view both show a simplified
 * villa (house-lite.glb) from the front, loaded after first paint and faded in. In the rooms view nothing renders
 * (the lite GLB stays cached by useGLTF, so going back is instant).
 */
export function IntroVilla() {
  const intro = useHouse((s) => s.view === 'intro')
  const villa = useHouse((s) => s.villa)
  // the Villa view shows the same whole villa from the front as the intro
  const show = intro || villa
  const [lite, setLite] = useState(false)
  const [ready, setReady] = useState(false)
  const get = useThree((s) => s.get)
  const setDpr = useThree((s) => s.setDpr)

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
      {show && lite && liteVilla}
      {show && ready && (
        <>
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
