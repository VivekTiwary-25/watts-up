import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { HUD } from './ui/HUD'

function App() {
  return <main className="relative h-svh w-full"><Canvas camera={{ position: [3, 2, 4], fov: 45 }} frameloop="demand"><ambientLight intensity={0.8}/><directionalLight position={[3,5,2]} intensity={2}/><mesh><boxGeometry/><meshStandardMaterial color="#9298a3"/></mesh><OrbitControls enableDamping={false}/></Canvas><HUD/></main>
}
export default App
