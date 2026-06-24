import { useRef, useState, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import Character from '../game3d/character/Character'
import type { NetPlayer } from './types'

interface RemotePlayersProps {
  /** Live transforms for everyone, updated off-render at network rate. */
  playersRef: RefObject<Record<string, NetPlayer>>
  /** Stable list of player uids (changes only on join/leave). */
  ids: string[]
  selfUid: string
  colors: Record<string, string>
}

/**
 * Renders every other player's avatar, smoothly interpolated toward the
 * transforms they broadcast (read from a ref so we never re-render per tick).
 */
export default function RemotePlayers({ playersRef, ids, selfUid, colors }: RemotePlayersProps) {
  const remoteIds = ids.filter((uid) => uid !== selfUid)
  return (
    <>
      {remoteIds.map((uid) => (
        <RemotePlayer key={uid} uid={uid} color={colors[uid] ?? '#888'} playersRef={playersRef} />
      ))}
    </>
  )
}

function RemotePlayer({
  uid,
  color,
  playersRef,
}: {
  uid: string
  color: string
  playersRef: RefObject<Record<string, NetPlayer>>
}) {
  const group = useRef<Group>(null)
  const cur = useRef(new Vector3())
  const inited = useRef(false)
  const [moving, setMoving] = useState(false)
  const movingRef = useRef(false)

  useFrame((_, delta) => {
    const d = playersRef.current?.[uid]
    const g = group.current
    if (!d || !g) return
    // Hide players while they're downed / respawning.
    g.visible = d.alive !== false
    const tx = d.x ?? 0
    const tz = d.z ?? 0
    if (!inited.current) {
      cur.current.set(tx, 0, tz)
      inited.current = true
    }
    const a = 1 - Math.exp(-12 * delta)
    cur.current.x += (tx - cur.current.x) * a
    cur.current.z += (tz - cur.current.z) * a
    g.position.set(cur.current.x, 0, cur.current.z)

    let diff = (d.ry ?? 0) - g.rotation.y
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    g.rotation.y += diff * a

    const mv = !!d.moving
    if (mv !== movingRef.current) {
      movingRef.current = mv
      setMoving(mv)
    }
  })

  return (
    <group ref={group}>
      <Character moving={moving} color={color} />
      {/* Team ring so players pop against the floor + match the leaderboard. */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.72, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.8} />
      </mesh>
    </group>
  )
}
