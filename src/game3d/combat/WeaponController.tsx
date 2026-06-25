import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useGameState } from '../state/GameStateContext'
import { useInventory } from '../state/InventoryContext'
import { useCombat } from './CombatContext'
import { playBlast } from '../../audio/sound'
import type { GearItem } from '../systems/gear'

interface Fx {
  kind: 'ranged' | 'melee' | 'aoe'
  from: [number, number, number]
  to: [number, number, number]
  color: string
  until: number
  /** Blast radius (m), only for kind === 'aoe'. */
  radius?: number
}

/** The fire dispatch: any DOM control can `window.dispatchEvent(new Event('ll-fire'))`. */
const FIRE_EVENT = 'll-fire'

export interface WeaponControllerProps {
  /** Disable firing (menus, puzzle overlays, cutscenes). */
  disabled?: boolean
  /** Force a specific weapon (e.g. the finale's guaranteed AoE cannon). */
  weaponOverride?: GearItem
}

export default function WeaponController({ disabled = false, weaponOverride }: WeaponControllerProps) {
  const gs = useGameState()
  const { weapon: equippedWeapon } = useInventory()
  const weapon = weaponOverride ?? equippedWeapon
  const combat = useCombat()
  const lastFire = useRef(0)
  const [fx, setFx] = useState<Fx | null>(null)

  // Latest values for the event handlers (avoid stale closures).
  const state = useRef({ disabled, weapon })
  state.current = { disabled, weapon }

  useEffect(() => {
    function tryFire() {
      const { disabled: off, weapon: w } = state.current
      if (off || gs.paused) return
      const now = performance.now()
      if (now - lastFire.current < (w.cooldownMs ?? 500)) return
      lastFire.current = now
      playBlast(w.aoe ? 'boom' : 'laser')

      const from = gs.playerPos.current
      const heading = gs.playerHeading.current
      const ranged = w.weaponKind === 'ranged'
      const target = combat.findTarget(
        { x: from.x, z: from.z },
        w.range ?? 2.4,
        ranged ? heading : undefined,
      )

      const muzzle: [number, number, number] = [from.x, from.y + 0.2, from.z]

      // AoE weapon: detonate at the aimed enemy (or a forward point) and jolt
      // everyone in the blast — strong crowd control, but not a one-shot.
      if (w.aoe) {
        let ix: number
        let iz: number
        if (target) {
          const tp = target.getPos()
          ix = tp.x
          iz = tp.z
        } else {
          const reach = Math.min(w.range ?? 12, 12)
          ix = from.x + Math.sin(heading) * reach
          iz = from.z + Math.cos(heading) * reach
        }
        combat.damageInRadius(ix, iz, w.aoe, w.damage ?? 1)
        setFx({ kind: 'aoe', from: muzzle, to: [ix, from.y + 0.2, iz], color: w.color, radius: w.aoe, until: now + 260 })
        return
      }

      if (target) {
        const tp = target.getPos()
        target.damage(w.damage ?? 1)
        setFx({ kind: ranged ? 'ranged' : 'melee', from: muzzle, to: [tp.x, tp.y + 0.2, tp.z], color: w.color, until: now + 120 })
      } else {
        // Whiff: show the shot/swing going forward.
        const reach = ranged ? Math.min(w.range ?? 10, 12) : w.range ?? 2.4
        const tx = from.x + Math.sin(heading) * reach
        const tz = from.z + Math.cos(heading) * reach
        setFx({ kind: ranged ? 'ranged' : 'melee', from: muzzle, to: [tx, from.y + 0.2, tz], color: w.color, until: now + 100 })
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        tryFire()
      }
    }
    function onPointer(e: PointerEvent) {
      // Ignore clicks on UI controls so buttons still work.
      const el = e.target as HTMLElement | null
      if (el && el.closest('button, input, a, [data-ui]')) return
      tryFire()
    }
    function onFireEvent() {
      tryFire()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener(FIRE_EVENT, onFireEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener(FIRE_EVENT, onFireEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    if (fx && performance.now() > fx.until) setFx(null)
  })

  if (!fx) return null

  if (fx.kind === 'aoe') {
    const r = fx.radius ?? 4
    return (
      <group position={[fx.to[0], 0.15, fx.to[2]]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r * 0.55, r, 40]} />
          <meshStandardMaterial color={fx.color} emissive={fx.color} emissiveIntensity={2.4} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[r * 0.45, 16, 16]} />
          <meshStandardMaterial color={fx.color} emissive={fx.color} emissiveIntensity={1.8} transparent opacity={0.28} />
        </mesh>
      </group>
    )
  }

  if (fx.kind === 'ranged') {
    return (
      <group>
        <Line points={[fx.from, fx.to]} color={fx.color} lineWidth={3} />
        <mesh position={fx.to}>
          <sphereGeometry args={[0.25, 10, 10]} />
          <meshStandardMaterial color={fx.color} emissive={fx.color} emissiveIntensity={2.5} />
        </mesh>
      </group>
    )
  }

  // Melee swing: a quick emissive arc at the strike point.
  return (
    <mesh position={fx.to} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.4, 0.9, 16, 1, 0, Math.PI]} />
      <meshStandardMaterial color={fx.color} emissive={fx.color} emissiveIntensity={2} transparent opacity={0.8} />
    </mesh>
  )
}
