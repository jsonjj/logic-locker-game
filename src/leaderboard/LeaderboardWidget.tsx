import AvatarIcon from '../components/AvatarIcon'
import type { LeaderboardScope, StarRank } from '../game/lockdown/contracts'
import { useLeaderboard } from './useLeaderboard'
import '../styles/leaderboard.css'

interface LeaderboardWidgetProps {
  scope: LeaderboardScope
  limit?: number
  highlightUid?: string
}

/** Format milliseconds as m:ss (or s.s under a minute) for tidy table cells. */
function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function StarRow({ stars }: { stars: StarRank }) {
  return (
    <span className="ll-lb-stars" aria-label={`${stars} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`ll-lb-star${n <= stars ? '' : ' is-empty'}`}>
          {n <= stars ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

/**
 * Compact, embeddable top-N leaderboard. Drop it anywhere (e.g. the sector map
 * or a results screen) with a scope; it loads and renders itself.
 */
export default function LeaderboardWidget({
  scope,
  limit = 5,
  highlightUid,
}: LeaderboardWidgetProps) {
  const { entries, loading, error } = useLeaderboard(scope, limit)
  const rows = entries.slice(0, limit)
  const title = scope.kind === 'global' ? 'Global Top Detectives' : 'Sector Top Runs'

  return (
    <section className="ll-lbw" aria-label={title}>
      <header className="ll-lbw-head">
        <p className="ll-lbw-title">{title}</p>
      </header>

      {loading ? (
        <p className="ll-lbw-state">Loading…</p>
      ) : error ? (
        <p className="ll-lbw-state">{error}</p>
      ) : rows.length === 0 ? (
        <p className="ll-lbw-state">No runs logged yet. Be the first!</p>
      ) : (
        <ol className="ll-lbw-list">
          {rows.map((entry, index) => (
            <li
              key={entry.uid}
              className={`ll-lbw-row${entry.uid === highlightUid ? ' is-you' : ''}`}
            >
              <span className="ll-lbw-rank">{index + 1}</span>
              <AvatarIcon id={entry.avatarId} size={26} className="ll-lb-avatar" />
              <span className="ll-lbw-name">{entry.displayName}</span>
              <span className="ll-lbw-meta">
                <StarRow stars={entry.stars} />
                <span className="ll-lbw-time">{formatTime(entry.timeMs)}</span>
                <span className="ll-lb-score">{entry.score.toLocaleString()}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
