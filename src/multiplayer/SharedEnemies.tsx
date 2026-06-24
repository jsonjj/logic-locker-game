import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { useGameState } from '../game3d/state/GameStateContext'
import {
  ARENA_HALF,
  ENEMY_NET_INTERVAL,
  ENEMY_SPEED,
  AIM_CONE,
  RANGED_FRACTION,
  aliveTargetForRound,
  spawnEveryForRound,
  enemyHpForRound,
} from './arena'
import {
  writeEnemies,
  subscribeHits,
  clearHit,
  creditKill,
} from './net'
import type { NetEnemy, NetPlayer } from './types'

/** Imperative surface the weapon uses to aim + (on the host) deal damage. */
export interface EnemiesHandle {
  nearest: (x: number, z: number, heading: number, range: number) => { id: string; x: number; z: number } | null
  /** Every enemy within `radius` of a point (for AoE weapons). */
  within: (x: number, z: number, radius: number) => { id: string; x: number; z: number }[]
  /** Host-authoritative damage. No-op on guests (they push hits over the wire). */
  damage: (id: string, dmg: number, by: string) => void
}

interface SharedEnemiesProps {
  code: string
  isHost: boolean
  playing: boolean
  /** Live transforms for all players (host targeting), read off-render. */
  playersRef: RefObject<Record<string, NetPlayer>>
  selfUid: string
  /** Latest networked enemy state (used by guests to render). */
  enemiesSnapshot: Record<string, NetEnemy>
  /** Optional mirror of live enemy positions for out-of-canvas UI (minimap). */
  viewRef?: RefObject<Map<string, LiveEnemy> | null>
  /** Changes between rounds; the host wipes its enemy sim when it does. */
  roundKey?: number
}

export interface LiveEnemy {
  x: number
  z: number
  hp: number
  maxHp: number
  kind: 'melee' | 'ranged'
}

const SharedEnemies = forwardRef<EnemiesHandle, SharedEnemiesProps>(function SharedEnemies(
  { code, isHost, playing, playersRef, selfUid, enemiesSnapshot, viewRef, roundKey },
  ref,
) {
  const gs = useGameState()
  // Authoritative (host) or interpolation-target (guest) enemy table.
  const enemies = useRef<Map<string, LiveEnemy>>(new Map())
  // Rendered positions (host = authoritative, guest = lerped) read by meshes.
  const render = useRef<Map<string, LiveEnemy>>(new Map())
  const [ids, setIds] = useState<string[]>([])
  const nextId = useRef(0)
  const spawnAcc = useRef(0)
  const netAcc = useRef(0)
  // Current round (drives population + difficulty scaling).
  const roundRef = useRef(roundKey ?? 1)
  roundRef.current = roundKey ?? 1

  // Keep the rendered id list in sync with whichever table is the source.
  function syncIds(source: Map<string, LiveEnemy>) {
    const next = Array.from(source.keys())
    setIds((prev) =>
      prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
    )
  }

  // --- Host: resolve damage authoritatively --------------------------------
  function hostDamage(id: string, dmg: number, by: string) {
    const e = enemies.current.get(id)
    if (!e) return
    e.hp -= dmg
    if (e.hp <= 0) {
      enemies.current.delete(id)
      creditKill(code, by)
      syncIds(enemies.current)
    }
  }

  useImperativeHandle(ref, (): EnemiesHandle => ({
    nearest: (x, z, heading, range) => {
      const source = isHost ? enemies.current : render.current
      let best: { id: string; x: number; z: number } | null = null
      let bestScore = Infinity
      const fx = Math.sin(heading)
      const fz = Math.cos(heading)
      for (const [id, e] of source) {
        const dx = e.x - x
        const dz = e.z - z
        const dist = Math.hypot(dx, dz)
        if (dist > range || dist < 0.001) continue
        const dot = (dx / dist) * fx + (dz / dist) * fz
        const ang = Math.acos(Math.max(-1, Math.min(1, dot)))
        // Prefer enemies inside the aim cone; penalize (don't exclude) others.
        const score = dist + (ang > AIM_CONE / 2 ? 1000 : ang * 4)
        if (score < bestScore) {
          bestScore = score
          best = { id, x: e.x, z: e.z }
        }
      }
      return best
    },
    within: (x, z, radius) => {
      const source = isHost ? enemies.current : render.current
      const out: { id: string; x: number; z: number }[] = []
      for (const [id, e] of source) {
        if (Math.hypot(e.x - x, e.z - z) <= radius) out.push({ id, x: e.x, z: e.z })
      }
      return out
    },
    damage: (id, dmg, by) => {
      if (isHost) hostDamage(id, dmg, by)
    },
  }))

  // --- Host: consume queued hit claims from guests -------------------------
  useEffect(() => {
    if (!isHost) return
    const unsub = subscribeHits(code, (key, hit) => {
      hostDamage(hit.eid, hit.dmg, hit.by)
      clearHit(code, key)
    })
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isHost])

  // --- Host: wipe the sim between rounds -----------------------------------
  useEffect(() => {
    if (!isHost) return
    enemies.current.clear()
    render.current = enemies.current
    spawnAcc.current = 0
    setIds([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, isHost])

  // --- Guest: keep an interpolation target table from the snapshot ---------
  useEffect(() => {
    if (isHost) return
    const map = enemies.current
    map.clear()
    for (const [id, e] of Object.entries(enemiesSnapshot)) {
      map.set(id, { x: e.x, z: e.z, hp: e.hp, maxHp: e.maxHp, kind: e.kind })
    }
    syncIds(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemiesSnapshot, isHost])

  // --- Simulation / interpolation ------------------------------------------
  const tmpTarget = useRef(new Vector3())
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)

    if (isHost) {
      if (playing) {
        // Spawn up to the round's target count, at the round's cadence.
        const target = aliveTargetForRound(roundRef.current)
        const every = spawnEveryForRound(roundRef.current)
        spawnAcc.current += dt
        while (enemies.current.size < target && spawnAcc.current >= every) {
          spawnAcc.current -= every
          spawnOne()
        }
        // Targets: every player position (local + remotes).
        const targets: { x: number; z: number }[] = [
          { x: gs.playerPos.current.x, z: gs.playerPos.current.z },
        ]
        const all = playersRef.current ?? {}
        for (const p of Object.values(all)) {
          if (p.uid === selfUid) continue
          if (typeof p.x === 'number' && typeof p.z === 'number') targets.push({ x: p.x, z: p.z })
        }
        for (const e of enemies.current.values()) {
          let tx = e.x
          let tz = e.z
          let bd = Infinity
          for (const p of targets) {
            const d = (p.x - e.x) ** 2 + (p.z - e.z) ** 2
            if (d < bd) {
              bd = d
              tx = p.x
              tz = p.z
            }
          }
          const dx = tx - e.x
          const dz = tz - e.z
          const dist = Math.hypot(dx, dz) || 1
          if (dist > 1.1) {
            e.x += (dx / dist) * ENEMY_SPEED * dt
            e.z += (dz / dist) * ENEMY_SPEED * dt
          }
          e.x = Math.max(-ARENA_HALF + 1, Math.min(ARENA_HALF - 1, e.x))
          e.z = Math.max(-ARENA_HALF + 1, Math.min(ARENA_HALF - 1, e.z))
        }
        // Broadcast at a fixed rate.
        netAcc.current += dt
        if (netAcc.current >= ENEMY_NET_INTERVAL) {
          netAcc.current = 0
          const out: Record<string, NetEnemy> = {}
          for (const [id, e] of enemies.current) {
            out[id] = { x: round(e.x), z: round(e.z), hp: e.hp, maxHp: e.maxHp, kind: e.kind }
          }
          writeEnemies(code, out)
        }
      }
      // Host renders straight from the authoritative table.
      render.current = enemies.current
      if (viewRef) viewRef.current = render.current
    } else {
      // Guest: lerp rendered positions toward the latest snapshot.
      const a = 1 - Math.exp(-12 * dt)
      for (const [id, target] of enemies.current) {
        const r = render.current.get(id)
        if (!r) {
          render.current.set(id, { ...target })
          continue
        }
        tmpTarget.current.set(target.x, 0, target.z)
        r.x += (target.x - r.x) * a
        r.z += (target.z - r.z) * a
        r.hp = target.hp
        r.maxHp = target.maxHp
      }
      // Drop any that disappeared.
      for (const id of render.current.keys()) {
        if (!enemies.current.has(id)) render.current.delete(id)
      }
      if (viewRef) viewRef.current = render.current
    }
  })

  function spawnOne() {
    const id = `e${nextId.current++}`
    // Spawn at a random arena-edge position.
    const edge = Math.floor(Math.random() * 4)
    const along = (Math.random() * 2 - 1) * (ARENA_HALF - 2)
    const pos =
      edge === 0
        ? { x: along, z: -ARENA_HALF + 2 }
        : edge === 1
          ? { x: along, z: ARENA_HALF - 2 }
          : edge === 2
            ? { x: -ARENA_HALF + 2, z: along }
            : { x: ARENA_HALF - 2, z: along }
    const hp = enemyHpForRound(roundRef.current)
    const kind: LiveEnemy['kind'] = Math.random() < RANGED_FRACTION ? 'ranged' : 'melee'
    enemies.current.set(id, { x: pos.x, z: pos.z, hp, maxHp: hp, kind })
    syncIds(enemies.current)
  }

  return (
    <>
      {ids.map((id) => (
        <EnemyMesh key={id} getData={() => render.current.get(id)} />
      ))}
    </>
  )
})

function EnemyMesh({ getData }: { getData: () => LiveEnemy | undefined }) {
  const group = useRef<Group>(null)
  const bar = useRef<Group>(null)
  const fill = useRef<Group>(null)
  const gun = useRef<Group>(null)
  const [armed, setArmed] = useState(false)
  const knownKind = useRef<LiveEnemy['kind'] | null>(null)

  useFrame(() => {
    const d = getData()
    const g = group.current
    if (!d || !g) return
    g.position.set(d.x, 0, d.z)
    // Latch the kind once it's known (guests learn it from the snapshot).
    if (knownKind.current !== d.kind) {
      knownKind.current = d.kind
      setArmed(d.kind === 'ranged')
    }
    if (fill.current) {
      const f = Math.max(0, Math.min(1, d.hp / d.maxHp))
      fill.current.scale.x = f
      fill.current.position.x = -(1 - f) * 0.5
    }
  })

  // Armed guards read as steel-blue with a muzzle glow; melee stay blood-red.
  const bodyColor = armed ? '#2f5d8c' : '#8c2f33'
  const headColor = armed ? '#4a86c0' : '#c0494b'
  const eyeColor = armed ? '#6cf0ff' : '#ffd84a'

  return (
    <group ref={group}>
      {/* Body */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.34, 0.7, 4, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial color={headColor} roughness={0.7} />
      </mesh>
      {/* Glowing eyes */}
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 1.58, 0.22]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={1.6} />
        </mesh>
      ))}
      {/* Gun — only on armed guards, so you can see at a glance who shoots. */}
      {armed && (
        <group ref={gun} position={[0.32, 1.0, 0.32]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.22]}>
            <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
            <meshStandardMaterial color="#1b2026" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.54]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#6cf0ff" emissive="#6cf0ff" emissiveIntensity={2} />
          </mesh>
        </group>
      )}
      {/* Health bar (camera bearing is fixed, so a static facing reads fine). */}
      <group ref={bar} position={[0, 2.15, 0]}>
        <mesh>
          <boxGeometry args={[1, 0.12, 0.04]} />
          <meshStandardMaterial color="#22262d" />
        </mesh>
        <group ref={fill} position={[0, 0, 0.03]}>
          <mesh>
            <boxGeometry args={[1, 0.12, 0.02]} />
            <meshStandardMaterial color="#56d364" emissive="#56d364" emissiveIntensity={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export default SharedEnemies
