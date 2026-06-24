import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Billboard } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import { useGameState } from '../state/GameStateContext'
import { useCombat, type EnemyHandle } from './CombatContext'
import type { Vec3 } from '../contracts'

export type EnemyKind = 'melee' | 'ranged'

export interface EnemyProps {
  id: number
  spawn: Vec3
  /** Chase speed (m/s). */
  speed?: number
  hp?: number
  kind?: EnemyKind
  /** Lives removed per hit (contact or bolt). Defaults to 1. */
  damage?: number
  /** Stop acting (e.g. puzzle open / paused). */
  paused?: boolean
  onDeath?: (id: number) => void
}

const CONTACT_RANGE = 1.7
const RANGED_HOLD = 8 // preferred distance for shooters
const RANGED_SIGHT = 24
const FIRE_INTERVAL = 1500
const PROJ_SPEED = 9
const PROJ_RANGE = 28

interface Projectile {
  pid: number
  start: { x: number; z: number }
  dir: { x: number; z: number }
  color: string
}

/** An enemy plasma bolt: travels straight, hits the player on contact, dodgeable. */
function Bolt({
  start,
  dir,
  color,
  damage,
  onDone,
}: {
  start: { x: number; z: number }
  dir: { x: number; z: number }
  color: string
  damage: number
  onDone: () => void
}) {
  const ref = useRef<Mesh>(null)
  const travelled = useRef(0)
  const done = useRef(false)
  const gs = useGameState()
  const combat = useCombat()

  useFrame((_, delta) => {
    const m = ref.current
    if (!m || done.current || gs.paused) return
    const step = PROJ_SPEED * Math.min(delta, 1 / 30)
    m.position.x += dir.x * step
    m.position.z += dir.z * step
    travelled.current += step

    const p = gs.playerPos.current
    if (Math.hypot(p.x - m.position.x, p.z - m.position.z) < 0.75) {
      done.current = true
      combat.hitPlayer(damage)
      onDone()
      return
    }
    if (travelled.current > PROJ_RANGE) {
      done.current = true
      onDone()
    }
  })

  return (
    <mesh ref={ref} position={[start.x, 1.2, start.z]}>
      <sphereGeometry args={[0.2, 10, 10]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
    </mesh>
  )
}

/** A roaming guard that hunts the player; melee strike or ranged bolts. */
export default function Enemy({
  id,
  spawn,
  speed = 2.6,
  hp = 3,
  kind = 'melee',
  damage = 1,
  paused = false,
  onDeath,
}: EnemyProps) {
  const body = useRef<RapierRigidBody>(null)
  const rig = useRef<Group>(null)
  const hpRef = useRef(hp)
  const alive = useRef(true)
  const flash = useRef(0)
  const lastShot = useRef(0)
  const boltId = useRef(0)
  const [dead, setDead] = useState(false)
  const [hpView, setHpView] = useState(hp)
  const [bolts, setBolts] = useState<Projectile[]>([])

  const gs = useGameState()
  const combat = useCombat()
  const boltColor = kind === 'ranged' ? '#ff8a3d' : '#ff5a48'

  useEffect(() => {
    const handle: EnemyHandle = {
      id,
      getPos: () => {
        const t = body.current?.translation()
        return t ? { x: t.x, y: t.y, z: t.z } : { x: spawn.x, y: spawn.y, z: spawn.z }
      },
      damage: (n: number) => {
        if (!alive.current) return false
        hpRef.current -= n
        setHpView(hpRef.current)
        flash.current = 1
        if (hpRef.current <= 0) {
          alive.current = false
          setDead(true)
          onDeath?.(id)
          return true
        }
        return false
      },
      isAlive: () => alive.current,
    }
    combat.register(handle)
    return () => combat.unregister(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useFrame((_, delta) => {
    const rb = body.current
    if (!rb || dead) return
    const dt = Math.min(delta, 1 / 30)
    if (flash.current > 0) flash.current = Math.max(0, flash.current - dt * 3)

    const p = gs.playerPos.current
    const t = rb.translation()
    const dx = p.x - t.x
    const dz = p.z - t.z
    const dist = Math.hypot(dx, dz)
    const v = rb.linvel()

    if (paused || gs.paused || dist < 0.001) {
      rb.setLinvel({ x: 0, y: v.y, z: 0 }, true)
      return
    }

    const nx = dx / dist
    const nz = dz / dist
    if (rig.current) rig.current.rotation.y = Math.atan2(nx, nz)

    if (kind === 'ranged') {
      // Keep range, shuffle in/out of the preferred distance, and fire.
      let dirSign = 0
      if (dist < RANGED_HOLD - 1) dirSign = -1
      else if (dist > RANGED_HOLD + 1) dirSign = 1
      rb.setLinvel({ x: nx * speed * dirSign, y: v.y, z: nz * speed * dirSign }, true)

      const now = performance.now()
      if (dist < RANGED_SIGHT && now - lastShot.current > FIRE_INTERVAL) {
        lastShot.current = now
        boltId.current += 1
        const pid = boltId.current
        setBolts((b) => [
          ...b,
          { pid, start: { x: t.x, z: t.z }, dir: { x: nx, z: nz }, color: boltColor },
        ])
      }
    } else if (dist < CONTACT_RANGE) {
      rb.setLinvel({ x: 0, y: v.y, z: 0 }, true)
      combat.hitPlayer(damage)
    } else {
      rb.setLinvel({ x: nx * speed, y: v.y, z: nz * speed }, true)
    }
  })

  if (dead) return null

  const bodyColor = kind === 'ranged' ? '#2a1f10' : '#3a1620'
  const glow = flash.current > 0.05 ? '#ffffff' : kind === 'ranged' ? '#ff9a3d' : '#ff3b2f'
  const frac = Math.max(0, Math.min(1, hpView / hp))
  const barW = 1.1

  return (
    <group>
      <RigidBody
        ref={body}
        colliders={false}
        position={[spawn.x, spawn.y, spawn.z]}
        enabledRotations={[false, false, false]}
        mass={1.1}
        linearDamping={0.4}
        angularDamping={1}
      >
        <CapsuleCollider args={[0.5, 0.4]} friction={0.3} />
        <group ref={rig} position={[0, -0.9, 0]}>
          <mesh position={[0, 1, 0]} castShadow>
            <capsuleGeometry args={[0.42, 0.9, 6, 12]} />
            <meshStandardMaterial color={bodyColor} metalness={0.2} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.85, 0]} castShadow>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshStandardMaterial color="#1c1014" />
          </mesh>
          <mesh position={[0, 1.88, 0.27]}>
            <boxGeometry args={[0.34, 0.1, 0.08]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={2.4} />
          </mesh>
          {kind === 'ranged' && (
            <mesh position={[0.3, 1.05, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
              <meshStandardMaterial color="#444c58" metalness={0.5} roughness={0.4} />
            </mesh>
          )}

          {/* health bar (always faces camera) */}
          <Billboard position={[0, 2.45, 0]}>
            <mesh>
              <planeGeometry args={[barW + 0.06, 0.18]} />
              <meshBasicMaterial color="#0c0e13" />
            </mesh>
            <mesh position={[-(barW * (1 - frac)) / 2, 0, 0.01]}>
              <planeGeometry args={[barW * frac, 0.12]} />
              <meshBasicMaterial color={frac > 0.5 ? '#5ee06a' : frac > 0.25 ? '#ffce4a' : '#ff5a48'} />
            </mesh>
          </Billboard>
        </group>
      </RigidBody>

      {bolts.map((b) => (
        <Bolt
          key={b.pid}
          start={b.start}
          dir={b.dir}
          color={b.color}
          damage={damage}
          onDone={() => setBolts((cur) => cur.filter((x) => x.pid !== b.pid))}
        />
      ))}
    </group>
  )
}
