import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { QUALITY } from '@/data/config'
import { Scene } from '@/scene/Scene'
import { HUD } from './ui/HUD'

// Weak laptop GPUs (e.g. RTX 2050) choke above ~1.5x on hi-dpi panels.
const MAX_DPR = Math.min(1.5, QUALITY.dpr.high)

function App() {
  return (
    <main className="relative h-svh w-full">
      <Canvas
        // PCFShadowMap: PCFSoft was removed in three r18x and only logs a warning
        shadows="percentage"
        dpr={[1, MAX_DPR]}
        performance={{ min: QUALITY.regressMin }}
        // tone mapping + AA happen once, in the post stack (PostFX)
        gl={{
          antialias: false,
          toneMapping: THREE.NoToneMapping,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 13, 12], fov: 45 }}
        frameloop="demand"
      >
        <Scene />
      </Canvas>
      <HUD />
    </main>
  )
}
export default App
