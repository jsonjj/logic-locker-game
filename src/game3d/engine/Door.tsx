import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import type { Mesh, MeshStandardMaterial } from 'three'
import type { DoorProps } from '../contracts'
import { useGameState } from '../state/GameStateContext'
import { prefersReducedMotion } from './prefersReducedMotion'

/**
 * A sliding blast door (Agent 1).
 *
 * - A kinematic RigidBody slab that RAISES out of the doorway as `open` goes
 *   true (and drops back to block when false), so physics stays correct: closed
 *   = solid wall, open = the slab is lifted clear and the player walks through.
 * - A static frame + objective glow/marker when `highlight` is set.
 * - onEnter trigger: a cheap distance check against the shared player position
 *   (no extra sensor body). Fires once each time the player crosses into the
 *   opening while the door is open; re-arms after they leave.
 *
 * The moving slab is rendered as a top-level (un-nested) RigidBody so its
 * world-space kinematic translation isn't compounded by a parent transform.
 */

const DOOR_W = 2.4
const DOOR_H = 3
const DOOR_D = 0.3
const RISE = 3.4 // how far the slab lifts when fully open
const ENTER_RADIUS = 1.5
const RELEASE_RADIUS = 2.3

export default function Door({
  position,
  rotationY = 0,
  open,
  // `label` is part of the contract but rendered by the HUD/world layer (which
  // owns text); the engine keeps the door purely in-canvas + collider-driven.
  highlight = false,
  onEnter,
}: DoorProps) {
  const slab = useRef<RapierRigidBody>(null)
  const progress = useRef(0) // 0 closed .. 1 open
  const entered = useRef(false)
  const glow = useRef<MeshStandardMaterial>(null)
  const marker = useRef<Mesh>(null)
  const gs = useGameState()

  const baseY = position[1] + DOOR_H / 2

  useFrame((state, delta) => {
    const reduce = prefersReducedMotion()
    const dt = Math.min(delta, 1 / 30)

    // Animate the slab toward open/closed.
    const targetP = open ? 1 : 0
    if (reduce) progress.current = targetP
    else progress.current += (targetP - progress.current) * (1 - Math.exp(-7 * dt))

    if (slab.current) {
      slab.current.setNextKinematicTranslation({
        x: position[0],
        y: baseY + progress.current * RISE,
        z: position[2],
      })
    }

    // Objective glow pulse + bobbing marker.
    if (highlight) {
      const pulse = reduce ? 0.7 : 0.55 + Math.sin(state.clock.elapsedTime * 3) * 0.35
      if (glow.current) glow.current.emissiveIntensity = pulse
      if (marker.current) {
        marker.current.position.y =
          DOOR_H + 0.9 + (reduce ? 0 : Math.sin(state.clock.elapsedTime * 2.5) * 0.18)
        if (!reduce) marker.current.rotation.y = state.clock.elapsedTime * 1.6
      }
    } else if (glow.current) {
      glow.current.emissiveIntensity = 0
    }

    // onEnter trigger (distance to opening, on the ground plane).
    if (onEnter && open && progress.current > 0.5) {
      const p = gs.playerPos.current
      const dx = p.x - position[0]
      const dz = p.z - position[2]
      const dist = Math.hypot(dx, dz)
      if (!entered.current && dist < ENTER_RADIUS) {
        entered.current = true
        onEnter()
      } else if (entered.current && dist > RELEASE_RADIUS) {
        entered.current = false
      }
    } else if (!open) {
      entered.current = false
    }
  })

  return (
    <>
      {/* Static frame + objective markers, oriented with the doorway. */}
      <group position={position} rotation={[0, rotationY, 0]}>
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            castShadow
            receiveShadow
            position={[s * (DOOR_W / 2 + 0.15), DOOR_H / 2, 0]}
          >
            <boxGeometry args={[0.3, DOOR_H + 0.3, 0.5]} />
            <meshStandardMaterial color="#39414c" roughness={0.85} metalness={0.2} />
          </mesh>
        ))}
        <mesh castShadow receiveShadow position={[0, DOOR_H + 0.15, 0]}>
          <boxGeometry args={[DOOR_W + 0.6, 0.3, 0.5]} />
          <meshStandardMaterial color="#39414c" roughness={0.85} metalness={0.2} />
        </mesh>

        {/* Highlight glow strip across the lintel. */}
        <mesh position={[0, DOOR_H + 0.15, 0.26]}>
          <boxGeometry args={[DOOR_W + 0.4, 0.12, 0.04]} />
          <meshStandardMaterial
            ref={glow}
            color="#ffb43a"
            emissive="#ffb43a"
            emissiveIntensity={0}
            toneMapped={false}
          />
        </mesh>

        {/* Objective marker (only when highlighted). */}
        {highlight && (
          <mesh ref={marker} position={[0, DOOR_H + 0.9, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.32, 0.6, 4]} />
            <meshStandardMaterial
              color="#ffb43a"
              emissive="#ffb43a"
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>

      {/* The moving slab — top-level kinematic body (world-space animation). */}
      <RigidBody
        ref={slab}
        type="kinematicPosition"
        colliders="cuboid"
        position={[position[0], baseY, position[2]]}
        rotation={[0, rotationY, 0]}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[DOOR_W, DOOR_H, DOOR_D]} />
          <meshStandardMaterial
            color={highlight ? '#6b5526' : '#4a5663'}
            emissive={highlight ? '#3a2a08' : '#000000'}
            emissiveIntensity={highlight ? 0.5 : 0}
            metalness={0.45}
            roughness={0.55}
          />
        </mesh>
        <mesh position={[0, 0, DOOR_D / 2 + 0.01]}>
          <boxGeometry args={[DOOR_W * 0.9, 0.08, 0.02]} />
          <meshStandardMaterial color="#2b333d" metalness={0.5} roughness={0.5} />
        </mesh>
      </RigidBody>
    </>
  )
}
