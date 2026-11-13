import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function App() {
  return (
    <main className="relative h-svh w-full">
      <Canvas camera={{ position: [3, 2, 4], fov: 45 }} frameloop="demand">
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={2} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="#9298a3" />
        </mesh>
        <OrbitControls enableDamping={false} />
      </Canvas>
      <div className="glass pointer-events-none absolute top-6 left-6 rounded-2xl px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">Watt's Up?</h1>
      </div>
    </main>
  )
}

export default App
