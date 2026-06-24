import { useEffect, useRef, useState, type RefObject } from 'react'
import { useGameState } from '../game3d/state/GameStateContext'
import { pushHit } from './net'
import { playBlast } from '../audio/sound'
import type { EnemiesHandle } from './SharedEnemies'

/** Weapon profile the arena derives from the player's equipped gear. */
export interface MpWeaponProfile {
  name: string
  damage: number
  range: number
  cooldownMs: number
  aoe?: number
  color: string
}

interface MpWeaponProps {
  code: string
  uid: string
  isHost: boolean
  playing: boolean
  handle: RefObject<EnemiesHandle | null>
  weapon: MpWeaponProfile
}

interface Tracer {
  x: number
  z: number
  heading: number
  len: number
}

/**
 * The multiplayer sidearm — available from the first second (guns-fast). Its
 * stats come from the player's single-player loadout, so unlocking better gear
 * in One Player makes you stronger here. Auto-assists onto the nearest enemy in
 * the aim cone; the host applies damage, guests report hits over the wire.
 */
export default function MpWeapon({ code, uid, isHost, playing, handle, weapon }: MpWeaponProps) {
  const gs = useGameState()
  const cooldown = useRef(0)
  const [tracer, setTracer] = useState<Tracer | null>(null)

  // Keep the latest weapon profile for the (stable) event handler.
  const wRef = useRef(weapon)
  wRef.current = weapon

  useEffect(() => {
    function fire() {
      if (!playing) return
      const w = wRef.current
      const now = performance.now()
      if (now < cooldown.current) return
      cooldown.current = now + w.cooldownMs
      const h = handle.current
      if (!h) return
      const px = gs.playerPos.current.x
      const pz = gs.playerPos.current.z
      const heading = gs.playerHeading.current
      const target = h.nearest(px, pz, heading, w.range)

      let len = w.range
      let aim = heading
      let ix = px + Math.sin(heading) * w.range
      let iz = pz + Math.cos(heading) * w.range
      if (target) {
        ix = target.x
        iz = target.z
        const dx = ix - px
        const dz = iz - pz
        len = Math.hypot(dx, dz)
        aim = Math.atan2(dx, dz)
      }

      const deal = (id: string) => {
        if (isHost) h.damage(id, w.damage, uid)
        else pushHit(code, { eid: id, dmg: w.damage, by: uid })
      }

      if (w.aoe) {
        // Splash: damage everyone within the blast around the impact point.
        for (const e of h.within(ix, iz, w.aoe)) deal(e.id)
      } else if (target) {
        deal(target.id)
      }

      playBlast(w.aoe ? 'boom' : 'laser')
      setTracer({ x: px, z: pz, heading: aim, len })
    }

    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'f') fire()
    }
    function onFireEvent() {
      fire()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('ll-fire', onFireEvent as EventListener)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('ll-fire', onFireEvent as EventListener)
    }
  }, [code, uid, isHost, playing, handle, gs])

  useEffect(() => {
    if (!tracer) return
    const t = setTimeout(() => setTracer(null), 110)
    return () => clearTimeout(t)
  }, [tracer])

  if (!tracer) return null
  // Stronger guns fire visibly thicker, brighter beams so power reads at a glance.
  const thick = 0.05 + Math.min(0.22, (weapon.damage - 1) * 0.05)
  return (
    <group position={[tracer.x, 1.1, tracer.z]} rotation={[0, tracer.heading, 0]}>
      <mesh position={[0, 0, tracer.len / 2]}>
        <boxGeometry args={[thick, thick, tracer.len]} />
        <meshStandardMaterial color={weapon.color} emissive={weapon.color} emissiveIntensity={2.6} />
      </mesh>
      {weapon.aoe ? (
        <mesh position={[0, 0, tracer.len]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[weapon.aoe * 0.5, weapon.aoe, 28]} />
          <meshStandardMaterial color={weapon.color} emissive={weapon.color} emissiveIntensity={2} transparent opacity={0.5} />
        </mesh>
      ) : null}
    </group>
  )
}
