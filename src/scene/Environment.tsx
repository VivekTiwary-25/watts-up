import { useEffect, useState } from 'react'
import { Environment as DreiEnvironment, Lightformer } from '@react-three/drei'
import { glbExists } from './glb'

export function Environment() {
  const [hasHdr, setHasHdr] = useState(false)
  useEffect(() => {
    let alive = true
    glbExists('/models/env.hdr').then((exists) => alive && setHasHdr(exists))
    return () => { alive = false }
  }, [])

  return hasHdr ? (
    <DreiEnvironment files="/models/env.hdr" background={false} environmentIntensity={0.6} />
  ) : (
    <DreiEnvironment background={false} environmentIntensity={0.6}>
      <Lightformer color="#cad9ff" intensity={2} position={[0, 5, -8]} scale={[12, 8, 1]} />
      <Lightformer color="#ffd8b0" intensity={1.2} position={[-6, 2, 3]} scale={[5, 5, 1]} />
    </DreiEnvironment>
  )
}
