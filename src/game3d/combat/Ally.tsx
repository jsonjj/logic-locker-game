import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import type { Group } from 'three'
import { useGameState } from '../state/GameStateContext'
import { useCombat } from './CombatContext'
import type { Vec3 } from '../contracts'

const SEEK_RANGE = 34
const ATTACK_RANGE = 16
const STOP_RANGE = 6
const FIRE_INTERVAL = 600
const ALLY_DAMAGE = 2

export interface AllyProps {
  id: number
  spawn: Vec3
  speed?: number
  paused?: boolean
}

interface Beam {
  x: number
  z: number
  len: number
  angle: number
}

/**
 * A freed inmate fighting on your side. Light-colored mirror of an Enemy: it
 * seeks the nearest hostile, closes in, and zaps it with a quick beam. Allies
 * are invulnerable — they're a reward for surviving the swarm.
 */
export default function Ally({ id, spawn, speed = 3.3, paused = false }: AllyProps) {
  const body = useRef<RapierRigidBody>(null)
  const rig = useRef<Group>(null)
  const lastShot = useRef(0)
  const beamUntil = useRef(0)
  const [beam, setBeam] = useState<Beam | null>(null)
  const gs = useGameState()
  const combat = useCombat()

  // Expose this helper's live position so the minimap can plot a blue dot.
  useEffect(() => {
    combat.registerAlly({
      id,
      getPos: () => {
        const t = body.current?.translation()
        return t ? { x: t.x, y: t.y, z: t.z } : { x: spawn.x, y: spawn.y, z: spawn.z }
      },
    })
    return () => combat.unregisterAlly(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useFrame((_, delta) => {
    const rb = body.current
    if (!rb) return
    const v = rb.linvel()

    if (paused || gs.paused) {
      rb.setLinvel({ x: 0, y: v.y, z: 0 }, true)
      return
    }

    const t = rb.translation()
    const target = combat.findTarget({ x: t.x, z: t.z }, SEEK_RANGE)

    // Expire the beam VFX.
    if (beam && performance.now() > beamUntil.current) setBeam(null)

    if (!target) {
      rb.setLinvel({ x: 0, y: v.y, z: 0 }, true)
      return
    }

    const tp = target.getPos()
    const dx = tp.x - t.x
    const dz = tp.z - t.z
    const dist = Math.hypot(dx, dz) || 1
    const nx = dx / dist
    const nz = dz / dist
    if (rig.current) rig.current.rotation.y = Math.atan2(nx, nz)

    if (dist > STOP_RANGE) {
      rb.setLinvel({ x: nx * speed, y: v.y, z: nz * speed }, true)
    } else {
      rb.setLinvel({ x: 0, y: v.y, z: 0 }, true)
    }

    const now = performance.now()
    if (dist < ATTACK_RANGE && now - lastShot.current > FIRE_INTERVAL) {
      lastShot.current = now
      target.damage(ALLY_DAMAGE)
      beamUntil.current = now + 90
      // Anchor the bolt at the midpoint so it spans ally -> target.
      setBeam({ x: t.x + nx * (dist / 2), z: t.z + nz * (dist / 2), len: dist, angle: Math.atan2(nx, nz) })
    }
    void delta
  })

  return (
    <group>
      <RigidBody
        ref={body}
        colliders={false}
        position={[spawn.x, spawn.y, spawn.z]}
        enabledRotations={[false, false, false]}
        mass={1}
        linearDamping={0.5}
        angularDamping={1}
      >
        <CapsuleCollider args={[0.5, 0.4]} friction={0.3} />
        <group ref={rig} position={[0, -0.9, 0]}>
          <mesh position={[0, 1, 0]} castShadow>
            <capsuleGeometry args={[0.42, 0.9, 6, 12]} />
            <meshStandardMaterial color="#bdecff" emissive="#3fd0ff" emissiveIntensity={0.5} metalness={0.2} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.85, 0]} castShadow>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshStandardMaterial color="#eafaff" />
          </mesh>
          <mesh position={[0, 1.88, 0.27]}>
            <boxGeometry args={[0.34, 0.1, 0.08]} />
            <meshStandardMaterial color="#7fefff" emissive="#7fefff" emissiveIntensity={2.6} />
          </mesh>
        </group>
      </RigidBody>

      {beam && (
        <mesh position={[beam.x, 1.2, beam.z]} rotation={[0, beam.angle, 0]}>
          {/* origin-anchored bolt pointing at the target (+z local) */}
          <boxGeometry args={[0.1, 0.1, beam.len]} />
          <meshStandardMaterial color="#9af0ff" emissive="#9af0ff" emissiveIntensity={3} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  )
}
