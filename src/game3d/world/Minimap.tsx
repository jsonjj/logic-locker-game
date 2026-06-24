import { useEffect, useMemo, useRef } from 'react'
import { useGameState } from '../state/GameStateContext'
import { hubDef } from './rooms'
import type { RoomDef } from '../contracts'
import '../../styles/world3d.css'

export interface MinimapProps {
  variant: 'hub' | 'room'
  /** Required for variant="room"; ignored for the hub. */
  def?: RoomDef
}

const STAGE = 148
const PAD = 14
const INNER = STAGE - PAD * 2

interface MarkerSpec {
  key: string
  x: number
  y: number
  className: string
}

/**
 * [Agent 2 owns this file] A self-contained DOM minimap overlay. It draws a
 * top-down schematic of the current space (hub yard or a sector room) plus
 * static markers (sector doors / exit / puzzle anchor) at render time, then
 * drives the live player arrow and objective ping from refs inside a
 * requestAnimationFrame loop — never calling setState — so it adds zero React
 * churn while the world runs.
 */
export default function Minimap({ variant, def }: MinimapProps) {
  const game = useGameState()
  // Keep a ref to the latest game value so the rAF loop reads fresh refs without
  // re-subscribing every frame.
  const gameRef = useRef(game)
  gameRef.current = game

  const playerRef = useRef<HTMLDivElement>(null)
  const objectiveRef = useRef<HTMLDivElement>(null)

  const layout = useMemo(() => {
    const size = variant === 'hub' ? hubDef.size : def?.size
    if (!size) return null
    const [w, d] = size
    const extent = Math.max(w, d)
    const scale = INNER / extent
    const cx = STAGE / 2
    const cy = STAGE / 2
    const toMap = (x: number, z: number): [number, number] => [cx + x * scale, cy + z * scale]

    const markers: MarkerSpec[] = []
    if (variant === 'hub') {
      hubDef.doors.forEach((door, i) => {
        if (door.to === 'hub') return
        const [mx, my] = toMap(door.position.x, door.position.z)
        markers.push({ key: `door-${i}`, x: mx, y: my, className: 'll-minimap__marker ll-minimap__marker--door' })
      })
    } else if (def) {
      const [ex, ey] = toMap(def.exitDoor.position.x, def.exitDoor.position.z)
      markers.push({ key: 'exit', x: ex, y: ey, className: 'll-minimap__marker ll-minimap__marker--exit' })
      const [ax, ay] = toMap(def.puzzleAnchor.x, def.puzzleAnchor.z)
      markers.push({ key: 'anchor', x: ax, y: ay, className: 'll-minimap__marker ll-minimap__marker--anchor' })
    }

    return {
      scale,
      cx,
      cy,
      roomBox: {
        left: cx - (w * scale) / 2,
        top: cy - (d * scale) / 2,
        width: w * scale,
        height: d * scale,
      },
      markers,
    }
  }, [variant, def])

  useEffect(() => {
    if (!layout) return
    const { scale, cx, cy } = layout
    let raf = 0
    const tick = () => {
      const g = gameRef.current
      const pos = g.playerPos.current
      const player = playerRef.current
      if (player) {
        const mx = cx + pos.x * scale
        const my = cy + pos.z * scale
        const heading = g.playerHeading.current
        player.style.left = `${mx}px`
        player.style.top = `${my}px`
        // Player faces -z (north) at heading 0; rotate the arrow to match.
        player.style.transform = `translate(-50%, -50%) rotate(${heading + Math.PI}rad)`
      }
      const obj = objectiveRef.current
      if (obj) {
        const target = g.objective?.target ?? null
        if (target) {
          obj.style.display = 'block'
          obj.style.left = `${cx + target.x * scale}px`
          obj.style.top = `${cy + target.z * scale}px`
        } else {
          obj.style.display = 'none'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [layout])

  if (!layout) return null

  const title = variant === 'hub' ? 'The Yard' : (def?.name ?? 'Sector')

  return (
    <div className="ll-minimap" aria-hidden="true">
      <div className="ll-minimap__title">
        <span>Map</span>
        <b>{title}</b>
      </div>
      <div className="ll-minimap__stage">
        <div
          className="ll-minimap__room"
          style={{
            left: `${layout.roomBox.left}px`,
            top: `${layout.roomBox.top}px`,
            width: `${layout.roomBox.width}px`,
            height: `${layout.roomBox.height}px`,
          }}
        />
        {layout.markers.map((m) => (
          <div key={m.key} className={m.className} style={{ left: `${m.x}px`, top: `${m.y}px` }} />
        ))}
        <div ref={objectiveRef} className="ll-minimap__objective" style={{ display: 'none' }} />
        <div ref={playerRef} className="ll-minimap__player" />
      </div>
    </div>
  )
}
