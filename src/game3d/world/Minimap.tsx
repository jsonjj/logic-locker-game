import { useEffect, useMemo, useRef } from 'react'
import { useGameState } from '../state/GameStateContext'
import { useCombat, type PosHandle } from '../combat/CombatContext'
import { hubDef } from './rooms'
import type { RoomDef } from '../contracts'
import '../../styles/world3d.css'

/** A static marker the caller wants drawn at a fixed world point. */
export interface MinimapMarker {
  id: string
  x: number
  z: number
  className: string
}

export interface MinimapProps {
  variant: 'hub' | 'room' | 'custom'
  /** Required for variant="room"; ignored otherwise. */
  def?: RoomDef
  /** For variant="custom" (e.g. the finale corridor): explicit footprint + markers. */
  custom?: {
    size: [number, number]
    title: string
    markers?: MinimapMarker[]
  }
  /** Extra world-space markers drawn on any variant (e.g. loose item pickups). */
  extraMarkers?: MinimapMarker[]
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
 * top-down schematic of the current space (hub yard, a sector room, or a custom
 * corridor) plus static markers, then drives the live player arrow, objective
 * ping, a dotted guide line to the objective, and red/blue dots for enemies and
 * allied helpers — all from refs inside a requestAnimationFrame loop (never
 * calling setState), so it adds zero React churn while the world runs.
 */
export default function Minimap({ variant, def, custom, extraMarkers }: MinimapProps) {
  const game = useGameState()
  const combat = useCombat()
  // Keep refs to the latest context values so the rAF loop reads fresh data
  // without re-subscribing every frame.
  const gameRef = useRef(game)
  gameRef.current = game
  const combatRef = useRef(combat)
  combatRef.current = combat

  const playerRef = useRef<HTMLDivElement>(null)
  const objectiveRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGLineElement>(null)
  const enemyLayerRef = useRef<HTMLDivElement>(null)
  const allyLayerRef = useRef<HTMLDivElement>(null)

  const layout = useMemo(() => {
    const size = variant === 'hub' ? hubDef.size : variant === 'custom' ? custom?.size : def?.size
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
    } else if (variant === 'room' && def) {
      const [ex, ey] = toMap(def.exitDoor.position.x, def.exitDoor.position.z)
      markers.push({ key: 'exit', x: ex, y: ey, className: 'll-minimap__marker ll-minimap__marker--exit' })
      const [ax, ay] = toMap(def.puzzleAnchor.x, def.puzzleAnchor.z)
      markers.push({ key: 'anchor', x: ax, y: ay, className: 'll-minimap__marker ll-minimap__marker--anchor' })
    } else if (variant === 'custom' && custom?.markers) {
      custom.markers.forEach((m) => {
        const [mx, my] = toMap(m.x, m.z)
        markers.push({ key: m.id, x: mx, y: my, className: m.className })
      })
    }

    // Caller-supplied world markers (loose items, the finale key, etc.) on any variant.
    extraMarkers?.forEach((m) => {
      const [mx, my] = toMap(m.x, m.z)
      markers.push({ key: m.id, x: mx, y: my, className: m.className })
    })

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
  }, [variant, def, custom, extraMarkers])

  useEffect(() => {
    if (!layout) return
    const { scale, cx, cy } = layout
    const enemyNodes = new Map<number, HTMLDivElement>()
    const allyNodes = new Map<number, HTMLDivElement>()

    // Reconcile a pool of dot <div>s against a live entity list, imperatively
    // (no React state) so it stays cheap even with a swarm on screen.
    const syncDots = (
      layer: HTMLDivElement | null,
      nodes: Map<number, HTMLDivElement>,
      list: PosHandle[],
      className: string,
    ) => {
      if (!layer) return
      const seen = new Set<number>()
      for (const ent of list) {
        seen.add(ent.id)
        let node = nodes.get(ent.id)
        if (!node) {
          node = document.createElement('div')
          node.className = className
          layer.appendChild(node)
          nodes.set(ent.id, node)
        }
        const p = ent.getPos()
        node.style.left = `${cx + p.x * scale}px`
        node.style.top = `${cy + p.z * scale}px`
      }
      for (const [id, node] of nodes) {
        if (!seen.has(id)) {
          node.remove()
          nodes.delete(id)
        }
      }
    }

    let raf = 0
    const tick = () => {
      const g = gameRef.current
      const c = combatRef.current
      const pos = g.playerPos.current
      const px = cx + pos.x * scale
      const py = cy + pos.z * scale

      const player = playerRef.current
      if (player) {
        const heading = g.playerHeading.current
        player.style.left = `${px}px`
        player.style.top = `${py}px`
        // Player faces -z (north) at heading 0; rotate the arrow to match.
        player.style.transform = `translate(-50%, -50%) rotate(${heading + Math.PI}rad)`
      }

      const target = g.objective?.target ?? null
      const obj = objectiveRef.current
      const line = lineRef.current
      if (target) {
        const ox = cx + target.x * scale
        const oy = cy + target.z * scale
        if (obj) {
          obj.style.display = 'block'
          obj.style.left = `${ox}px`
          obj.style.top = `${oy}px`
        }
        if (line) {
          line.style.display = 'block'
          line.setAttribute('x1', `${px}`)
          line.setAttribute('y1', `${py}`)
          line.setAttribute('x2', `${ox}`)
          line.setAttribute('y2', `${oy}`)
        }
      } else {
        if (obj) obj.style.display = 'none'
        if (line) line.style.display = 'none'
      }

      syncDots(enemyLayerRef.current, enemyNodes, c.enemies(), 'll-minimap__dot ll-minimap__dot--enemy')
      syncDots(allyLayerRef.current, allyNodes, c.allies(), 'll-minimap__dot ll-minimap__dot--ally')

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      enemyNodes.forEach((n) => n.remove())
      allyNodes.forEach((n) => n.remove())
    }
  }, [layout])

  if (!layout) return null

  const title =
    variant === 'hub' ? 'The Yard' : variant === 'custom' ? (custom?.title ?? 'Map') : (def?.name ?? 'Sector')

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
        <svg className="ll-minimap__lines" width={STAGE} height={STAGE} aria-hidden="true">
          <line ref={lineRef} className="ll-minimap__line" x1="0" y1="0" x2="0" y2="0" style={{ display: 'none' }} />
        </svg>
        <div ref={enemyLayerRef} className="ll-minimap__layer" />
        <div ref={allyLayerRef} className="ll-minimap__layer" />
        <div ref={objectiveRef} className="ll-minimap__objective" style={{ display: 'none' }} />
        <div ref={playerRef} className="ll-minimap__player" />

        <div className="ll-minimap__legend">
          <span className="ll-minimap__legend-item">
            <i className="ll-minimap__dot ll-minimap__dot--enemy ll-minimap__dot--static" />
            Foe
          </span>
          <span className="ll-minimap__legend-item">
            <i className="ll-minimap__dot ll-minimap__dot--ally ll-minimap__dot--static" />
            Ally
          </span>
        </div>
      </div>
    </div>
  )
}
