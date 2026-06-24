import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { prefersReducedMotion } from '../engine/prefersReducedMotion'

export interface CharacterProps {
  /** Drives the run cycle when true; otherwise a subtle idle. */
  moving?: boolean
  /** Uniform scale. */
  scale?: number
  /** Tint for the jumpsuit (player vs NPC variants). */
  color?: string
}

/**
 * A low-poly humanoid "agent" built entirely from primitives (Agent 1).
 *
 * Keeps a subtle agent-monkey identity (rounded ears + muzzle + tail) dressed in
 * a prison jumpsuit. Procedural animation only — no model files: arms/legs swing
 * in opposition for a run cycle, with a gentle idle sway and breathing bob when
 * standing. Reduced-motion aware. The model's feet sit at local y = 0.
 */
const SKIN = '#b07a4e'
const SKIN_LIGHT = '#cda079'
const BOOT = '#23282f'

export default function Character({ moving = false, scale = 1, color = '#e0892f' }: CharacterProps) {
  const root = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const tail = useRef<Group>(null)

  useFrame((state) => {
    const reduce = prefersReducedMotion()
    const t = state.clock.elapsedTime

    if (reduce) {
      if (root.current) root.current.position.y = 0
      if (legL.current) legL.current.rotation.x = 0
      if (legR.current) legR.current.rotation.x = 0
      if (armL.current) armL.current.rotation.x = 0
      if (armR.current) armR.current.rotation.x = 0
      return
    }

    if (moving) {
      const phase = t * 9
      const swing = Math.sin(phase)
      if (legL.current) legL.current.rotation.x = swing * 0.7
      if (legR.current) legR.current.rotation.x = -swing * 0.7
      if (armL.current) armL.current.rotation.x = -swing * 0.6
      if (armR.current) armR.current.rotation.x = swing * 0.6
      // Double-frequency vertical bounce for a running gait.
      if (root.current) root.current.position.y = Math.abs(Math.sin(phase)) * 0.08
      if (tail.current) tail.current.rotation.x = -0.4 + Math.sin(phase) * 0.2
    } else {
      const breathe = Math.sin(t * 2)
      const sway = Math.sin(t * 1.3)
      if (legL.current) legL.current.rotation.x = 0
      if (legR.current) legR.current.rotation.x = 0
      if (armL.current) armL.current.rotation.x = sway * 0.06
      if (armR.current) armR.current.rotation.x = -sway * 0.06
      if (root.current) root.current.position.y = breathe * 0.015
      if (tail.current) tail.current.rotation.x = -0.3 + Math.sin(t * 1.6) * 0.1
    }
  })

  return (
    <group ref={root} scale={scale}>
      {/* Torso / jumpsuit. */}
      <mesh castShadow position={[0, 1, 0]}>
        <capsuleGeometry args={[0.28, 0.55, 4, 10]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Chest panel + collar for a bit of detail. */}
      <mesh position={[0, 1.02, 0.27]}>
        <boxGeometry args={[0.34, 0.5, 0.06]} />
        <meshStandardMaterial color="#c9781f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.34, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.42]} />
        <meshStandardMaterial color="#b56a16" roughness={0.9} />
      </mesh>

      {/* Head. */}
      <mesh castShadow position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.25, 14, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* Muzzle (agent-monkey identity). */}
      <mesh position={[0, 1.6, 0.2]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={SKIN_LIGHT} roughness={0.7} />
      </mesh>
      {/* Eyes. */}
      {[-0.09, 0.09].map((x) => (
        <mesh key={x} position={[x, 1.72, 0.2]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#10141a" />
        </mesh>
      ))}
      {/* Rounded ears. */}
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} castShadow position={[x, 1.72, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
      ))}

      {/* Arms (shoulder-pivoted groups). */}
      <group ref={armL} position={[-0.36, 1.28, 0]}>
        <mesh castShadow position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.09, 0.36, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
      </group>
      <group ref={armR} position={[0.36, 1.28, 0]}>
        <mesh castShadow position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.09, 0.36, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
      </group>

      {/* Legs (hip-pivoted groups; feet reach y = 0). */}
      <group ref={legL} position={[-0.14, 0.62, 0]}>
        <mesh castShadow position={[0, -0.26, 0]}>
          <capsuleGeometry args={[0.11, 0.34, 4, 8]} />
          <meshStandardMaterial color="#2c343f" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, -0.56, 0.05]}>
          <boxGeometry args={[0.2, 0.12, 0.34]} />
          <meshStandardMaterial color={BOOT} roughness={0.8} />
        </mesh>
      </group>
      <group ref={legR} position={[0.14, 0.62, 0]}>
        <mesh castShadow position={[0, -0.26, 0]}>
          <capsuleGeometry args={[0.11, 0.34, 4, 8]} />
          <meshStandardMaterial color="#2c343f" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, -0.56, 0.05]}>
          <boxGeometry args={[0.2, 0.12, 0.34]} />
          <meshStandardMaterial color={BOOT} roughness={0.8} />
        </mesh>
      </group>

      {/* Tail (sells the monkey identity). */}
      <group ref={tail} position={[0, 0.75, -0.25]}>
        <mesh position={[0, 0, -0.25]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[0.05, 0.5, 4, 8]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}
