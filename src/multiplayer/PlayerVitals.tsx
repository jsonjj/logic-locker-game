import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameState } from '../game3d/state/GameStateContext'
import { DAMAGE_INTERVAL, ENEMY_TOUCH_RANGE, SPAWN_INVULN } from './arena'
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

/**
 * Local-authoritative health: counts enemies touching the local player and
 * drains HP on a fixed cadence. Each client owns its own health (friendly,
 * low-stakes game) — on death it fires `onDeath` and the arena schedules the
 * respawn, which grows slightly longer each time you go down.
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

  // New round → full health + a fresh invulnerability window.
  useEffect(() => {
    hp.current = maxRef.current
    onHp(maxRef.current)
    invulnUntil.current = performance.now() + SPAWN_INVULN * 1000
    dmgAcc.current = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)

    // Respawn / round-start: refill and grant a brief invulnerability window.
    if (alive && !prevAlive.current) {
      hp.current = maxRef.current
      onHp(maxRef.current)
      invulnUntil.current = performance.now() + SPAWN_INVULN * 1000
      dmgAcc.current = 0
    }
    prevAlive.current = alive

    if (!playing || !alive) return
    const now = performance.now()
    if (now < invulnUntil.current) return

    const enemies = enemiesViewRef.current
    if (!enemies || enemies.size === 0) return

    const px = gs.playerPos.current.x
    const pz = gs.playerPos.current.z
    let touching = false
    for (const e of enemies.values()) {
      if (Math.hypot(e.x - px, e.z - pz) <= ENEMY_TOUCH_RANGE) {
        touching = true
        break
      }
    }
    if (!touching) {
      dmgAcc.current = 0
      return
    }
    dmgAcc.current += dt
    if (dmgAcc.current >= DAMAGE_INTERVAL) {
      dmgAcc.current = 0
      hp.current = Math.max(0, hp.current - 1)
      onHp(hp.current)
      if (hp.current <= 0) onDeath()
    }
  })

  return null
}
