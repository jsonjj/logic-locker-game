import { useEffect, useMemo } from 'react'
import { useTopDownPlayer } from '../useTopDownPlayer'
import DetectiveSprite from '../DetectiveSprite'
import Joystick from '../Joystick'
import IsoStage from '../iso/IsoStage'
import IsoEntity from '../iso/IsoEntity'
import WardenSprite from '../iso/sprites/WardenSprite'
import { project } from '../iso/projection'
import PursuerHud from '../../components/pursuer/PursuerHud'
import type { SceneStation } from '../RoomScene'
import type { Vec2 } from '../lockdown/contracts'
import '../../styles/play.css'

const INTERACT_RANGE = 13
const PURSUER_SPAWN: Vec2 = { x: 50, y: 6 }

/** Snaking layout of stations across the room, in world coords (0..100). */
function layout(n: number): Vec2[] {
  if (n <= 0) return []
  const cols = Math.min(4, n)
  const rows = Math.ceil(n / cols)
  const out: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols)
    let col = i % cols
    if (row % 2 === 1) col = cols - 1 - col
    const x = cols === 1 ? 50 : 24 + col * (52 / (cols - 1))
    const y = rows === 1 ? 46 : 26 + row * (44 / (rows - 1))
    out.push({ x, y })
  }
  return out
}

/**
 * The 2.5D walkable sector: the player explores an iso fortress room, walking
 * up to "stations" (each backed by a reasoning step). A pursuer (the Warden's
 * reach) creeps in from the back as the alarm rises, catching up if the player
 * stalls — pressure only, never a hard fail.
 */
export default function IsoRoom({
  title,
  subtitle,
  variant = 'corridor',
  stations,
  activeIndex,
  frozen,
  proximity,
  caught,
  timeMs,
  onInteract,
  onExit,
  hudDone,
  hudTotal,
}: {
  title: string
  subtitle?: string
  variant?: 'corridor' | 'cell' | 'vault'
  stations: SceneStation[]
  activeIndex: number
  frozen: boolean
  proximity: number
  caught: boolean
  timeMs: number
  onInteract: () => void
  onExit: () => void
  hudDone: number
  hudTotal: number
}) {
  const positions = useMemo(() => layout(stations.length), [stations.length])

  const { pos, facing, moving, setJoy } = useTopDownPlayer({
    start: { x: 50, y: 86 },
    speed: 30,
    frozen,
    bounds: { minX: 10, maxX: 90, minY: 14, maxY: 90 },
  })

  const activePos = positions[activeIndex]
  const nearActive =
    !!activePos &&
    !frozen &&
    Math.hypot(activePos.x - pos.x, activePos.y - pos.y) < INTERACT_RANGE

  // The pursuer slides from its spawn toward the player as the alarm rises.
  const t = Math.min(1, Math.max(0, proximity))
  const pursuerPos: Vec2 = {
    x: PURSUER_SPAWN.x + (pos.x - PURSUER_SPAWN.x) * t,
    y: PURSUER_SPAWN.y + (pos.y - PURSUER_SPAWN.y) * t,
  }
  const pursuerFacing = pursuerPos.x < pos.x ? 'right' : 'left'

  // Keyboard interact (Space / Enter / E).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if ((k === ' ' || k === 'enter' || k === 'e') && nearActive) {
        e.preventDefault()
        onInteract()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nearActive, onInteract])

  const promptPoint = activePos ? project(activePos) : null

  return (
    <div className="game-page lockdown">
      <div className="game-hud">
        <div className="hud-left">
          <button type="button" className="btn btn-ghost" onClick={onExit}>
            ← Map
          </button>
          <span className="hud-chip">
            <span className="case-dot" />
            <span className="hud-chip-num">{hudDone}</span>/{hudTotal} locks
          </span>
        </div>
        <div className="hud-right">
          <PursuerHud proximity={proximity} caught={caught} timeMs={timeMs} />
        </div>
      </div>

      <div className="play-stage-wrap">
        <IsoStage variant={variant} danger={proximity}>
          <div className="stage-title">
            {title}
            {subtitle && <small>{subtitle}</small>}
          </div>

          {stations.map((s, i) => {
            const p = positions[i] ?? { x: 50, y: 50 }
            const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming'
            const isNear = state === 'active' && nearActive
            return (
              <IsoEntity key={s.id} pos={p} shadow={false}>
                <div className={`iso-station ${state} ${isNear ? 'near' : ''}`}>
                  {state === 'active' && <span className="iso-station-bang">!</span>}
                  <span className="iso-station-icon">{state === 'done' ? '✓' : s.glyph}</span>
                  <span className="iso-station-label">{s.label}</span>
                </div>
              </IsoEntity>
            )
          })}

          {/* The pursuer, once the alarm has begun to rise. */}
          {proximity > 0.03 && (
            <IsoEntity pos={pursuerPos}>
              <WardenSprite facing={pursuerFacing} moving />
            </IsoEntity>
          )}

          {/* The player. */}
          <IsoEntity pos={pos}>
            <DetectiveSprite facing={facing} moving={moving} />
          </IsoEntity>

          {/* UI overlay above all depth-sorted entities. */}
          <div className="iso-ui">
            {caught && <div className="iso-caught">⚠ The Warden is on you — move!</div>}

            {nearActive && promptPoint && (
              <div
                className="iso-prompt"
                style={{ left: `${promptPoint.left}%`, top: `${promptPoint.top}%` }}
              >
                <b>Examine</b> {stations[activeIndex]?.label}
              </div>
            )}

            {!frozen && (
              <div className="game-hint-bar">
                Walk to the glowing lock, then press the button or Space
              </div>
            )}

            <Joystick onChange={setJoy} />
            <button
              type="button"
              className="game-action-btn"
              disabled={!nearActive}
              onClick={() => nearActive && onInteract()}
            >
              Examine
            </button>
          </div>
        </IsoStage>
      </div>
    </div>
  )
}
