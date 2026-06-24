/**
 * [Agent 3] A tiny self-contained R3F canvas showing the lock core. It is purely
 * decorative: the wireframe core spins and shifts from red toward green as the
 * breach progresses. Static when the user prefers reduced motion. This does NOT
 * use the game engine's GameCanvas — it is an isolated mini-canvas per the brief.
 */
import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function Core({ progress, reduced }: { progress: number; reduced: boolean }) {
  const ref = useRef<Mesh>(null)
  const hue = 8 + Math.max(0, Math.min(1, progress)) * 132
  const color = `hsl(${hue}, 82%, 56%)`

  useFrame((_, delta) => {
    if (!ref.current || reduced) return
    ref.current.rotation.y += delta * 0.7
    ref.current.rotation.x += delta * 0.28
  })

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.15, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} wireframe />
    </mesh>
  )
}

export default function LockInset({ progress }: { progress: number }) {
  const reduced = usePrefersReducedMotion()
  return (
    <div className="p3-inset" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 3, 3]} intensity={40} />
        <Core progress={progress} reduced={reduced} />
      </Canvas>
    </div>
  )
}
