import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { WaypointProps } from '../contracts'
import { prefersReducedMotion } from './prefersReducedMotion'

/**
 * A floating objective beacon (Agent 1): a downward-pointing arrow over a ground
 * halo, bobbing + slowly spinning above `target`. Cheap (a cone + a ring) and
 * reduced-motion aware (holds still when the user prefers reduced motion).
 */
export default function Waypoint({ target }: WaypointProps) {
  const group = useRef<Group>(null)
  const arrow = useRef<Group>(null)

  useFrame((state) => {
    if (!group.current || !target) return
    const reduce = prefersReducedMotion()
    const t = state.clock.elapsedTime
    group.current.position.set(target.x, target.y, target.z)
    if (arrow.current) {
      arrow.current.position.y = 3.2 + (reduce ? 0 : Math.sin(t * 2.4) * 0.22)
      arrow.current.rotation.y = reduce ? 0 : t * 1.4
    }
  })

  if (!target) return null

  return (
    <group ref={group} position={[target.x, target.y, target.z]}>
      {/* Ground halo. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.55, 0.8, 24]} />
        <meshStandardMaterial
          color="#5fd0ff"
          emissive="#5fd0ff"
          emissiveIntensity={0.9}
          toneMapped={false}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Bobbing arrow pointing down at the spot. */}
      <group ref={arrow} position={[0, 3.2, 0]}>
        <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.35, 0]}>
          <coneGeometry args={[0.34, 0.7, 4]} />
          <meshStandardMaterial
            color="#5fd0ff"
            emissive="#5fd0ff"
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[0.18, 0.4, 0.18]} />
          <meshStandardMaterial
            color="#5fd0ff"
            emissive="#5fd0ff"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}
