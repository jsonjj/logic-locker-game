import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'

/** Anything with a live world position (used by the minimap to plot dots). */
export interface PosHandle {
  id: number
  getPos: () => { x: number; y: number; z: number }
}

export interface EnemyHandle extends PosHandle {
  /** Apply damage; returns true if this hit killed the enemy. */
  damage: (n: number) => boolean
  isAlive: () => boolean
}

interface CombatValue {
  register: (h: EnemyHandle) => void
  unregister: (id: number) => void
  /** Nearest living enemy within `range` of `from`; if `heading` is given, only
   *  enemies roughly in front (within ~70°) are eligible (for ranged aim). */
  findTarget: (
    from: { x: number; z: number },
    range: number,
    heading?: number,
  ) => EnemyHandle | null
  /** All living enemy handles (snapshot). */
  enemies: () => EnemyHandle[]
  /** Damage every living enemy within `radius` of (x,z). Returns the kill count. */
  damageInRadius: (x: number, z: number, radius: number, amount: number) => number
  /** Register/unregister a friendly helper so the minimap can show it. */
  registerAlly: (h: PosHandle) => void
  unregisterAlly: (id: number) => void
  /** All registered ally handles (snapshot). */
  allies: () => PosHandle[]
  /** Route a contact hit through global i-frames so guards can't drain you. */
  hitPlayer: (amount?: number) => void
  setPlayerDamageHandler: (fn: ((amount: number) => void) | null) => void
}

const CombatContext = createContext<CombatValue | undefined>(undefined)

const IFRAME_MS = 1000

export function CombatProvider({ children }: { children: ReactNode }) {
  const map = useRef(new Map<number, EnemyHandle>())
  const allyMap = useRef(new Map<number, PosHandle>())
  const handler = useRef<((amount: number) => void) | null>(null)
  const lastHit = useRef(0)

  const value = useMemo<CombatValue>(() => {
    return {
      register: (h) => {
        map.current.set(h.id, h)
      },
      unregister: (id) => {
        map.current.delete(id)
      },
      findTarget: (from, range, heading) => {
        let best: EnemyHandle | null = null
        let bestD = range
        for (const h of map.current.values()) {
          if (!h.isAlive()) continue
          const p = h.getPos()
          const dx = p.x - from.x
          const dz = p.z - from.z
          const d = Math.hypot(dx, dz)
          if (d > range) continue
          if (heading !== undefined && d > 0.001) {
            // forward = (sin(heading), cos(heading)); cos(angle) >= ~0.34 (≈70°)
            const fx = Math.sin(heading)
            const fz = Math.cos(heading)
            const dot = (dx / d) * fx + (dz / d) * fz
            if (dot < 0.34) continue
          }
          if (d < bestD) {
            bestD = d
            best = h
          }
        }
        return best
      },
      enemies: () => Array.from(map.current.values()).filter((h) => h.isAlive()),
      damageInRadius: (x, z, radius, amount) => {
        let kills = 0
        for (const h of map.current.values()) {
          if (!h.isAlive()) continue
          const p = h.getPos()
          if (Math.hypot(p.x - x, p.z - z) <= radius) {
            if (h.damage(amount)) kills += 1
          }
        }
        return kills
      },
      registerAlly: (h) => {
        allyMap.current.set(h.id, h)
      },
      unregisterAlly: (id) => {
        allyMap.current.delete(id)
      },
      allies: () => Array.from(allyMap.current.values()),
      hitPlayer: (amount = 1) => {
        const now = performance.now()
        if (now - lastHit.current < IFRAME_MS) return
        lastHit.current = now
        handler.current?.(amount)
      },
      setPlayerDamageHandler: (fn) => {
        handler.current = fn
      },
    }
  }, [])

  return <CombatContext.Provider value={value}>{children}</CombatContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCombat(): CombatValue {
  const ctx = useContext(CombatContext)
  if (!ctx) throw new Error('useCombat must be used within a CombatProvider')
  return ctx
}
