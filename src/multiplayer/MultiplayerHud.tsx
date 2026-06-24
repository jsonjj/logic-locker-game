import { useEffect, useState, type RefObject } from 'react'
import ArenaMinimap from './ArenaMinimap'
import type { LiveEnemy } from './SharedEnemies'
import type { NetPlayer } from './types'

interface MultiplayerHudProps {
  roster: NetPlayer[]
  colors: Record<string, string>
  selfUid: string
  endsAt?: number
  round?: number
  targetWins?: number
  hp: number
  maxHp: number
  dead: boolean
  respawnAt: number | null
  playersRef: RefObject<Record<string, NetPlayer>>
  enemiesViewRef: RefObject<Map<string, LiveEnemy> | null>
  ids: string[]
}

function fireShot() {
  window.dispatchEvent(new CustomEvent('ll-fire'))
}

/** Live, always-on competitive overlay: leaderboard + clock + HP + radar. */
export default function MultiplayerHud({
  roster,
  colors,
  selfUid,
  endsAt,
  round,
  targetWins,
  hp,
  maxHp,
  dead,
  respawnAt,
  playersRef,
  enemiesViewRef,
  ids,
}: MultiplayerHudProps) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  const remaining = endsAt ? Math.max(0, endsAt - now) : 0
  const mm = Math.floor(remaining / 60000)
  const ss = Math.floor((remaining % 60000) / 1000)
  const respawnLeft = respawnAt ? Math.max(0, Math.ceil((respawnAt - now) / 1000)) : 0

  const ranked = [...roster].sort(
    (a, b) => (b.wins ?? 0) - (a.wins ?? 0) || (b.kills ?? 0) - (a.kills ?? 0),
  )

  return (
    <>
      {endsAt && (
        <div className="mp-timer" role="timer">
          {round ? <span className="mp-round">Round {round} · First to {targetWins}</span> : null}
          <span className="mp-clock">
            {mm}:{ss.toString().padStart(2, '0')}
          </span>
        </div>
      )}

      <div className="mp-board" aria-label="Live leaderboard">
        <div className="mp-board-title">LIVE · WINS / KILLS</div>
        <ol className="mp-board-list">
          {ranked.map((p, i) => (
            <li key={p.uid} className={`mp-board-row${p.uid === selfUid ? ' is-me' : ''}`}>
              <span className="mp-board-rank">{i + 1}</span>
              <span className="mp-board-dot" style={{ background: colors[p.uid] }} />
              <span className="mp-board-name">{p.name}</span>
              <span className="mp-board-wins">{p.wins ?? 0}★</span>
              <span className="mp-board-kills">{p.kills ?? 0}</span>
            </li>
          ))}
        </ol>
      </div>

      <ArenaMinimap
        playersRef={playersRef}
        enemiesViewRef={enemiesViewRef}
        ids={ids}
        colors={colors}
        selfUid={selfUid}
      />

      {/* Health. */}
      <div className="mp-health" aria-label="Health">
        {Array.from({ length: maxHp }).map((_, i) => (
          <span key={i} className={`mp-hp-pip${i < hp ? ' is-full' : ''}`} />
        ))}
      </div>

      <div className="mp-crosshair" aria-hidden>
        +
      </div>

      <button type="button" className="mp-fire" onClick={fireShot} aria-label="Fire">
        FIRE
      </button>
      <p className="mp-hint">Move: WASD · Fire: F (or the button) · Round wins the series</p>

      {dead && (
        <div className="mp-downed">
          <div className="mp-downed-title">DOWN</div>
          <div className="mp-downed-sub">Respawning in {respawnLeft}s…</div>
        </div>
      )}
    </>
  )
}
