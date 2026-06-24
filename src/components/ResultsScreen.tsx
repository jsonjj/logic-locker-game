import type { LevelResult } from '../game/lockdown/contracts'
import StarRow from '../scoring/StarRow'
import { formatTime } from '../scoring/score'
import '../styles/scoring.css'

interface ResultsScreenProps {
  result: LevelResult
  /** Whether this run is the player's new personal best. */
  isBest: boolean
  sectorName?: string
  onRetry: () => void
  onNext?: () => void
  onMap: () => void
  onLeaderboard: () => void
}

const STAR_HEADLINE: Record<number, string> = {
  3: 'Flawless run',
  2: 'Clean escape',
  1: 'Sector cleared',
  0: 'Sector cleared',
}

/** End-of-run summary: stars, stats, best ribbon, and navigation. */
export default function ResultsScreen({
  result,
  isBest,
  sectorName,
  onRetry,
  onNext,
  onMap,
  onLeaderboard,
}: ResultsScreenProps) {
  return (
    <div className="lockdown ll-results">
      <div className="ll-results-card">
        {isBest && (
          <div className="ll-results-ribbon" aria-label="New best run">
            New Best!
          </div>
        )}

        {sectorName && <p className="ll-results-sector">{sectorName}</p>}
        <h2 className="ll-results-headline">{STAR_HEADLINE[result.stars]}</h2>

        <div className="ll-results-stars">
          <StarRow stars={result.stars} size={48} animate />
        </div>

        <div className="ll-results-score">
          <span className="ll-results-score-value">{result.score.toLocaleString()}</span>
          <span className="ll-results-score-label">SCORE</span>
        </div>

        <dl className="ll-results-stats">
          <div className="ll-results-stat">
            <dt>Time</dt>
            <dd>{formatTime(result.timeMs)}</dd>
          </div>
          <div className="ll-results-stat">
            <dt>Mistakes</dt>
            <dd>{result.mistakes}</dd>
          </div>
          <div className={`ll-results-stat ${result.caught ? 'is-danger' : 'is-safe'}`}>
            <dt>Pursuer</dt>
            <dd>{result.caught ? 'Caught' : 'Evaded'}</dd>
          </div>
        </dl>

        <div className="ll-results-actions">
          {onNext && (
            <button type="button" className="ll-btn ll-btn-primary" onClick={onNext}>
              Next Sector
            </button>
          )}
          <button type="button" className="ll-btn ll-btn-ghost" onClick={onRetry}>
            Retry
          </button>
          <button type="button" className="ll-btn ll-btn-ghost" onClick={onMap}>
            Map
          </button>
          <button type="button" className="ll-btn ll-btn-ghost" onClick={onLeaderboard}>
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  )
}
