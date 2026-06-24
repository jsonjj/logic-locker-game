import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useTopDownPlayer } from './useTopDownPlayer'
import DetectiveSprite from './DetectiveSprite'
import Joystick from './Joystick'

export interface SceneStation {
  id: string
  label: string
  glyph: string
}

interface Burst {
  key: number
  x: number
  y: number
}

const INTERACT_RANGE = 11

/** Lay stations out in a gentle snaking path so the room feels explorable. */
function layout(n: number): { x: number; y: number }[] {
  if (n <= 0) return []
  const cols = Math.min(4, n)
  const rows = Math.ceil(n / cols)
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols)
    let col = i % cols
    if (row % 2 === 1) col = cols - 1 - col
    const x = cols === 1 ? 50 : 16 + col * (68 / (cols - 1))
    const y = rows === 1 ? 46 : 28 + row * (50 / (rows - 1))
    out.push({ x, y })
  }
  return out
}

/**
 * The walkable room: each lesson step becomes a station the detective walks up
 * to. Only the active station can be opened; finished ones show a check.
 */
export default function RoomScene({
  title,
  subtitle,
  stations,
  activeIndex,
  frozen,
  onInteract,
  onExit,
  hudDone,
  hudTotal,
}: {
  title: string
  subtitle?: string
  stations: SceneStation[]
  activeIndex: number
  frozen: boolean
  onInteract: () => void
  onExit: () => void
  hudDone: number
  hudTotal: number
}) {
  const positions = useMemo(() => layout(stations.length), [stations.length])

  // Spawn near the previous station when resuming partway through.
  const start = useMemo(() => {
    const prev = positions[activeIndex - 1]
    if (prev) return { x: prev.x, y: Math.min(88, prev.y + 12) }
    return { x: 50, y: 86 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { pos, facing, moving, setJoy } = useTopDownPlayer({
    start,
    speed: 30,
    frozen,
    bounds: { minX: 8, maxX: 92, minY: 18, maxY: 90 },
  })

  const activePos = positions[activeIndex]
  const nearActive =
    !!activePos &&
    !frozen &&
    Math.hypot(activePos.x - pos.x, activePos.y - pos.y) < INTERACT_RANGE

  // Celebrate with a particle burst whenever a station is completed.
  const [bursts, setBursts] = useState<Burst[]>([])
  const prevActive = useRef(activeIndex)
  const burstId = useRef(0)
  useEffect(() => {
    if (activeIndex > prevActive.current) {
      const p = positions[prevActive.current]
      if (p) {
        const key = burstId.current++
        setBursts((b) => [...b, { key, x: p.x, y: p.y }])
        window.setTimeout(() => setBursts((b) => b.filter((x) => x.key !== key)), 750)
      }
    }
    prevActive.current = activeIndex
  }, [activeIndex, positions])

  // Keyboard interact.
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

  return (
    <div className="game-page">
      <div className="game-hud">
        <div className="hud-left">
          <button type="button" className="btn btn-ghost" onClick={onExit}>
            ← Hallway
          </button>
        </div>
        <div className="hud-right">
          <span className="hud-chip">
            <span className="case-dot" />
            <span className="hud-chip-num">{hudDone}</span>/{hudTotal} clues
          </span>
        </div>
      </div>

      <div className="game-stage floor-room">
        <div className="game-wall" />
        <div className="game-rug" />
        <div className="stage-title">
          {title}
          {subtitle && <small>{subtitle}</small>}
        </div>

        {stations.map((s, i) => {
          const p = positions[i] ?? { x: 50, y: 50 }
          const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming'
          const isNear = state === 'active' && nearActive
          return (
            <div
              key={s.id}
              className={`station ${state} ${isNear ? 'near' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {state === 'active' && <span className="station-bang">!</span>}
              <span className="station-icon">{state === 'done' ? '✓' : s.glyph}</span>
              <span className="station-label">{s.label}</span>
            </div>
          )
        })}

        <div className="player" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
          <DetectiveSprite facing={facing} moving={moving} />
        </div>

        {nearActive && activePos && (
          <div
            className="interact-prompt"
            style={{ left: `${activePos.x}%`, top: `${activePos.y - 8}%` }}
          >
            <b>Examine</b> {stations[activeIndex]?.label}
          </div>
        )}

        <div className="fx-layer">
          {bursts.map((b) =>
            Array.from({ length: 10 }).map((_, i) => {
              const ang = (i / 10) * Math.PI * 2
              return (
                <span
                  key={`${b.key}-${i}`}
                  className="fx-dot"
                  style={
                    {
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      '--fx-dx': `${Math.cos(ang) * 46}px`,
                      '--fx-dy': `${Math.sin(ang) * 46}px`,
                    } as CSSProperties
                  }
                />
              )
            }),
          )}
        </div>

        {!frozen && (
          <div className="game-hint-bar">
            Walk to the glowing clue, then press the button or Space
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
    </div>
  )
}
