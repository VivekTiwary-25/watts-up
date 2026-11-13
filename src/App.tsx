import { Canvas } from '@react-three/fiber'
import { Scene } from '@/scene/Scene'
import { HUD } from './ui/HUD'

function App() {
  return (
    <main className="relative h-svh w-full">
      <Canvas
        shadows
        dpr={[1, 1.75]}
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
