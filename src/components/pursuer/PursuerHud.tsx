import { formatTime } from '../../scoring/score'
import '../../styles/scoring.css'

interface PursuerHudProps {
  /** 0 = far/safe, 1 = caught up. */
  proximity: number
  caught: boolean
  /** Elapsed run time in ms. */
  timeMs: number
}

/**
 * Heads-up display for the pursuer: an alarm meter that fills and glows red as
 * the pursuer closes in, plus a live timer readout. Reduced-motion friendly.
 */
export default function PursuerHud({ proximity, caught, timeMs }: PursuerHudProps) {
  const pct = Math.min(100, Math.max(0, proximity * 100))
  const danger = Math.min(1, Math.max(0, proximity))
  const level = caught ? 'caught' : proximity >= 0.66 ? 'high' : proximity >= 0.33 ? 'mid' : 'low'

  return (
    <div
      className={`ll-pursuer-hud level-${level}`}
      style={{ ['--ll-danger' as string]: danger.toFixed(3) }}
      role="status"
      aria-live="polite"
    >
      <div className="ll-pursuer-meter">
        <div className="ll-pursuer-meter-head">
          <span className="ll-pursuer-label">
            {caught ? 'Caught!' : 'Pursuer'}
          </span>
          <span className="ll-pursuer-pct" aria-hidden="true">
            {Math.round(pct)}%
          </span>
        </div>
        <div
          className="ll-pursuer-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label="Pursuer proximity"
        >
          <div className="ll-pursuer-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="ll-pursuer-timer" aria-label="Run time">
        <span className="ll-pursuer-timer-value">{formatTime(timeMs)}</span>
      </div>
    </div>
  )
}
