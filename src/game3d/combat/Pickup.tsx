import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { useGameState } from '../state/GameStateContext'
import { gear } from '../systems/gear'
import type { Vec3 } from '../contracts'

export interface PickupProps {
  /** Gear id to grant. */
  itemId: string
  position: Vec3
  onPickup: (itemId: string) => void
}

const RANGE = 1.9

/** A floating, glowing collectible. Walk into it to grab the gear. */
export default function Pickup({ itemId, position, onPickup }: PickupProps) {
  const group = useRef<Group>(null)
  const core = useRef<Mesh>(null)
  const taken = useRef(false)
  const [gone, setGone] = useState(false)
  const gs = useGameState()
  const item = gear(itemId)
  const color = item?.color ?? '#ffd27a'

  useFrame((stateR, delta) => {
    if (gone) return
    const t = stateR.clock.elapsedTime
    if (group.current) group.current.position.y = position.y + 0.6 + Math.sin(t * 2) * 0.15
    if (core.current) core.current.rotation.y += delta * 1.6

    if (!taken.current) {
      const p = gs.playerPos.current
      if (Math.hypot(p.x - position.x, p.z - position.z) < RANGE) {
        taken.current = true
        onPickup(itemId)
        setGone(true)
      }
    }
  })

  if (gone) return null

  return (
    <group ref={group} position={[position.x, position.y + 0.6, position.z]}>
      <mesh ref={core} castShadow>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* beacon light + base ring on the floor */}
      <pointLight intensity={4} distance={6} decay={2} color={color} />
      <mesh position={[0, -0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.55, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}
