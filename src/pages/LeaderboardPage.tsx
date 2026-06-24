import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarIcon from '../components/AvatarIcon'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../firebase/firebaseConfig'
import { useLeaderboard } from '../leaderboard/useLeaderboard'
import {
  type LeaderboardScope,
  type SectorId,
  type StarRank,
} from '../game/lockdown/contracts'
// Agent C owns this list; importing keeps the sector tabs in sync with the map.
import { sectors } from '../data/sectors'
import '../styles/leaderboard.css'

type TabKey = 'global' | SectorId

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function rankClass(rank: number): string {
  if (rank === 1) return 'll-lb-rank is-gold'
  if (rank === 2) return 'll-lb-rank is-silver'
  if (rank === 3) return 'll-lb-rank is-bronze'
  return 'll-lb-rank'
}

function Stars({ stars }: { stars: StarRank }) {
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

export default function LeaderboardPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<TabKey>('global')

  const sortedSectors = useMemo(
    () => [...sectors].sort((a, b) => a.order - b.order),
    [],
  )

  const scope: LeaderboardScope = useMemo(
    () => (tab === 'global' ? { kind: 'global' } : { kind: 'sector', sectorId: tab }),
    [tab],
  )

  const { entries, loading, error, refresh } = useLeaderboard(scope, 20)

  const activeSector = sortedSectors.find((s) => s.id === tab)
  const heading =
    tab === 'global' ? 'Global Rankings' : activeSector?.name ?? 'Sector Rankings'
  const scoreLabel = tab === 'global' ? 'Total Score' : 'Score'
  const timeLabel = tab === 'global' ? 'Total Time' : 'Time'

  return (
    <div className="lockdown ll-lb-page">
      <header className="ll-lb-header">
        <div>
          <p className="ll-lb-eyebrow">Fortress Standings</p>
          <h1 className="ll-lb-title">Leaderboard</h1>
          <p className="ll-lb-subtitle">
            See who is clearing sectors fastest and cleanest. Climb the global board
            by stacking your best run in every sector.
          </p>
        </div>
        <Link to="/world" className="ll-lb-back">
          ← Back to the prison
        </Link>
      </header>

      <div className="ll-lb-tabs" role="tablist" aria-label="Leaderboard scope">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'global'}
          className="ll-lb-tab"
          onClick={() => setTab('global')}
        >
          Global
        </button>
        {sortedSectors.map((sector) => (
          <button
            key={sector.id}
            type="button"
            role="tab"
            aria-selected={tab === sector.id}
            className="ll-lb-tab"
            onClick={() => setTab(sector.id)}
          >
            {sector.name.replace(/·.*/, '').trim() || sector.name}
          </button>
        ))}
      </div>

      <section className="ll-lb-card">
        <div className="ll-lb-card-head">
          <h2>{heading}</h2>
          {!loading && !error && (
            <span className="ll-lb-count">
              {entries.length} {entries.length === 1 ? 'detective' : 'detectives'}
            </span>
          )}
        </div>

        {!isFirebaseConfigured ? (
          <div className="ll-lb-state">
            <strong>Leaderboards are offline</strong>
            Add your Firebase keys to <code>.env</code> and restart to start competing.
          </div>
        ) : loading ? (
          <div className="ll-lb-state" aria-busy="true">
            <div className="ll-lb-skeleton" style={{ maxWidth: 280, margin: '0 auto 12px' }} />
            <div className="ll-lb-skeleton" style={{ maxWidth: 200, margin: '0 auto' }} />
          </div>
        ) : error ? (
          <div className="ll-lb-state">
            <strong>Something went wrong</strong>
            {error}
            <div style={{ marginTop: 14 }}>
              <button type="button" className="ll-lb-back" onClick={refresh}>
                Retry
              </button>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="ll-lb-state">
            <strong>No runs logged yet</strong>
            Clear {tab === 'global' ? 'a sector' : 'this sector'} to claim the top spot.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ll-lb-table">
              <thead>
                <tr>
                  <th className="ll-col-rank">#</th>
                  <th>Detective</th>
                  <th>Stars</th>
                  <th className="ll-col-num">{timeLabel}</th>
                  <th className="ll-col-num">{scoreLabel}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const rank = index + 1
                  const isYou = !!profile && entry.uid === profile.uid
                  return (
                    <tr key={entry.uid} className={`ll-lb-row${isYou ? ' is-you' : ''}`}>
                      <td>
                        <span className={rankClass(rank)}>{rank}</span>
                      </td>
                      <td>
                        <div className="ll-lb-player">
                          <AvatarIcon id={entry.avatarId} size={34} className="ll-lb-avatar" />
                          <span className="ll-lb-name">{entry.displayName}</span>
                          {isYou && <span className="ll-lb-you">You</span>}
                        </div>
                      </td>
                      <td>
                        <Stars stars={entry.stars} />
                      </td>
                      <td className="ll-col-num">{formatTime(entry.timeMs)}</td>
                      <td className="ll-col-num ll-lb-score">
                        {entry.score.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
