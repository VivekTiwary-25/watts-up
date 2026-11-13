import { Canvas } from '@react-three/fiber'
import { Scene } from '@/scene/Scene'

function App() {
  return (
    <main className="relative h-svh w-full">
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 13, 12], fov: 45 }} frameloop="demand">
        <Scene />
      </Canvas>
      <div className="glass pointer-events-none absolute top-6 left-6 rounded-2xl px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">Watt's Up?</h1>
      </div>
    </main>
  )
}

export default App
