import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isRealtimeConfigured } from '../firebase/firebaseConfig'
import '../styles/multiplayer.css'

/**
 * The post-login menu: choose One Player (the full single-player campaign,
 * unchanged) or Multiplayer (a live competitive arena). Single player never
 * routes through any networking code.
 */
export default function ModeSelectPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && !user) return <Navigate to="/" replace />
  if (!loading && user && !profile?.displayName) return <Navigate to="/profile-setup" replace />

  return (
    <div className="mode-select">
      <div className="mode-select-head">
        <span className="mode-eyebrow">Logic Locker: Breakout</span>
        <h1 className="mode-title">Choose your run</h1>
        <p className="mode-sub">Break out solo, or drop into a live arena with friends.</p>
      </div>

      <div className="mode-cards">
        <button type="button" className="mode-card" onClick={() => navigate('/world')}>
          <span className="mode-card-icon" aria-hidden>🚪</span>
          <span className="mode-card-name">Single Player</span>
          <span className="mode-card-desc">
            The prison-break campaign — learn, fight, and free Akash room by room. Clear rooms to
            spin the wheel and unlock weapons &amp; upgrades.
          </span>
          <span className="mode-card-cta">Play solo →</span>
        </button>

        <button
          type="button"
          className={`mode-card mode-card--versus${isRealtimeConfigured ? '' : ' is-disabled'}`}
          onClick={() => isRealtimeConfigured && navigate('/mp')}
          disabled={!isRealtimeConfigured}
        >
          <span className="mode-card-icon" aria-hidden>⚔️</span>
          <span className="mode-card-name">Multiplayer</span>
          <span className="mode-card-desc">
            A live arena for 2–6 friends. Share enemies, race for kills, and battle a best-of
            series with a real-time leaderboard.
          </span>
          <span className="mode-card-cta">
            {isRealtimeConfigured ? 'Find a match →' : 'Realtime DB not configured'}
          </span>
        </button>
      </div>

      <p className="mode-note">
        <strong>How it connects:</strong> you learn concepts and unlock weapons &amp; upgrades in
        Single Player — and the gear you earn carries over into Multiplayer, where you can take it
        into the arena against 2–6 friends.
      </p>
    </div>
  )
}
