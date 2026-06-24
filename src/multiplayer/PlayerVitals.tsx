import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { type Group } from 'three'
import { useGameState } from '../game3d/state/GameStateContext'
import {
  DAMAGE_INTERVAL,
  ENEMY_TOUCH_RANGE,
  SPAWN_INVULN,
  ENEMY_SHOOT_RANGE,
  ENEMY_MIN_SHOOT_DIST,
  ENEMY_SHOOT_COOLDOWN,
  ENEMY_SHOOT_JITTER,
  ENEMY_PROJECTILE_SPEED,
  ENEMY_PROJECTILE_DMG,
  ENEMY_PROJECTILE_HIT_RADIUS,
  ENEMY_MAX_SHOOTERS,
} from './arena'
import type { LiveEnemy } from './SharedEnemies'

interface PlayerVitalsProps {
  enemiesViewRef: RefObject<Map<string, LiveEnemy> | null>
  playing: boolean
  /** True while the local player is up (false during respawn). */
  alive: boolean
  /** Max health (base + bonus from carried-over armor). */
  maxHp: number
  /** Changes between rounds; refills health when it does. */
  resetKey: number
  onHp: (hp: number) => void
  onDeath: () => void
}

/** Local incoming-fire pool — each client simulates the shots aimed at itself. */
const POOL = 20
interface Projectile {
  active: boolean
  x: number
  z: number
  vx: number
  vz: number
  life: number
}

/**
 * Local-authoritative health. Two threats drain HP:
 *  - melee contact: enemies touching you tick damage on a fixed cadence.
 *  - ranged fire: armed enemies (kind === 'ranged') lob dodgeable projectiles
 *    aimed at your position. Each client simulates the shots fired AT it, so
 *    moving genuinely dodges them — no netcode round-trip needed.
 * Each client owns its own health; on death it fires `onDeath` and the arena
 * schedules the respawn (which grows slightly longer each time you go down).
 */
export default function PlayerVitals({
  enemiesViewRef,
  playing,
  alive,
  maxHp,
  resetKey,
  onHp,
  onDeath,
}: PlayerVitalsProps) {
  const gs = useGameState()
  const hp = useRef(maxHp)
  const dmgAcc = useRef(0)
  const invulnUntil = useRef(0)
  const prevAlive = useRef(true)
  const maxRef = useRef(maxHp)
  maxRef.current = maxHp
  const downed = useRef(false)

  // Incoming-fire simulation.
  const proj = useRef<Projectile[]>(
    Array.from({ length: POOL }, () => ({ active: false, x: 0, z: 0, vx: 0, vz: 0, life: 0 })),
  )
  const slotRefs = useRef<(Group | null)[]>([])
  const shootCd = useRef<Map<string, number>>(new Map())

  function clearProjectiles() {
    for (const p of proj.current) p.active = false
    shootCd.current.clear()
  }

  // New round → full health + a fresh invulnerability window.
  useEffect(() => {
    hp.current = maxRef.current
    onHp(maxRef.current)
    invulnUntil.current = performance.now() + SPAWN_INVULN * 1000
    dmgAcc.current = 0
    downed.current = false
    clearProjectiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  function applyDamage(amount: number) {
    if (downed.current) return
    hp.current = Math.max(0, hp.current - amount)
    onHp(hp.current)
    if (hp.current <= 0) {
      downed.current = true
      onDeath()
    }
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)

    // Respawn / round-start: refill and grant a brief invulnerability window.
    if (alive && !prevAlive.current) {
      hp.current = maxRef.current
      onHp(maxRef.current)
      invulnUntil.current = performance.now() + SPAWN_INVULN * 1000
      dmgAcc.current = 0
      downed.current = false
      clearProjectiles()
    }
    prevAlive.current = alive

    if (!playing || !alive) {
      if (proj.current.some((p) => p.active)) clearProjectiles()
      syncSlots()
      return
    }

    const now = performance.now()
    const invuln = now < invulnUntil.current
    const px = gs.playerPos.current.x
    const pz = gs.playerPos.current.z

    // --- Advance existing incoming projectiles ------------------------------
    for (const p of proj.current) {
      if (!p.active) continue
      p.x += p.vx * dt
      p.z += p.vz * dt
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        continue
      }
      if (!invuln && Math.hypot(p.x - px, p.z - pz) <= ENEMY_PROJECTILE_HIT_RADIUS) {
        p.active = false
        applyDamage(ENEMY_PROJECTILE_DMG)
      }
    }

    const enemies = enemiesViewRef.current

    // --- Melee contact damage ----------------------------------------------
    if (!invuln && enemies && enemies.size > 0) {
      let touching = false
      for (const e of enemies.values()) {
        if (Math.hypot(e.x - px, e.z - pz) <= ENEMY_TOUCH_RANGE) {
          touching = true
          break
        }
      }
      if (touching) {
        dmgAcc.current += dt
        if (dmgAcc.current >= DAMAGE_INTERVAL) {
          dmgAcc.current = 0
          applyDamage(1)
        }
      } else {
        dmgAcc.current = 0
      }
    } else {
      dmgAcc.current = 0
    }

    // --- Armed enemies open fire (nearest few, on a cooldown) ---------------
    if (enemies && enemies.size > 0) {
      const shooters: { id: string; x: number; z: number; dist: number }[] = []
      for (const [id, e] of enemies) {
        if (e.kind !== 'ranged') continue
        const dist = Math.hypot(e.x - px, e.z - pz)
        if (dist > ENEMY_SHOOT_RANGE || dist < ENEMY_MIN_SHOOT_DIST) continue
        shooters.push({ id, x: e.x, z: e.z, dist })
      }
      shooters.sort((a, b) => a.dist - b.dist)
      const active = shooters.slice(0, ENEMY_MAX_SHOOTERS)
      const activeIds = new Set(active.map((s) => s.id))

      for (const s of active) {
        // Stagger first shots so a fresh wave doesn't volley in unison.
        let cd = shootCd.current.get(s.id)
        if (cd === undefined) cd = Math.random() * ENEMY_SHOOT_COOLDOWN
        cd -= dt
        if (cd <= 0) {
          if (fire(s.x, s.z, px, pz)) {
            cd = ENEMY_SHOOT_COOLDOWN + Math.random() * ENEMY_SHOOT_JITTER
          } else {
            cd = 0.05 // pool full — retry shortly
          }
        }
        shootCd.current.set(s.id, cd)
      }
      // Forget enemies that are gone or out of play so the map can't grow.
      for (const id of shootCd.current.keys()) {
        if (!activeIds.has(id) && !enemies.has(id)) shootCd.current.delete(id)
      }
    }

    syncSlots()
  })

  /** Aim a pooled projectile from (sx,sz) at the player's current spot. */
  function fire(sx: number, sz: number, px: number, pz: number): boolean {
    const slot = proj.current.find((p) => !p.active)
    if (!slot) return false
    const dx = px - sx
    const dz = pz - sz
    const len = Math.hypot(dx, dz) || 1
    slot.active = true
    slot.x = sx
    slot.z = sz
    slot.vx = (dx / len) * ENEMY_PROJECTILE_SPEED
    slot.vz = (dz / len) * ENEMY_PROJECTILE_SPEED
    // Time to cross its range, plus a little slack.
    slot.life = ENEMY_SHOOT_RANGE / ENEMY_PROJECTILE_SPEED + 0.4
    return true
  }

  function syncSlots() {
    for (let i = 0; i < POOL; i++) {
      const g = slotRefs.current[i]
      const p = proj.current[i]
      if (!g) continue
      if (p.active) {
        g.visible = true
        g.position.set(p.x, 1.1, p.z)
      } else if (g.visible) {
        g.visible = false
      }
    }
  }

  return (
    <group>
      {Array.from({ length: POOL }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            slotRefs.current[i] = el
          }}
          visible={false}
        >
          <mesh>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color="#ff8a3c" emissive="#ff5a2a" emissiveIntensity={2.8} />
          </mesh>
          {/* faint trail so fast shots read as streaks */}
          <mesh scale={[1, 1, 2.4]} position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ffd0a0" emissive="#ff7a3c" emissiveIntensity={1.6} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
