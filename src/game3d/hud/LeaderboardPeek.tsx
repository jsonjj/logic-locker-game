import { useNavigate } from 'react-router-dom'
import { R3D } from '../contracts'

export interface LeaderboardPeekProps {
  /** Override placement/visuals with extra classes if desired. */
  className?: string
  /** Custom label; defaults to "Leaderboard". */
  label?: string
}

/**
 * A tiny, self-contained "view leaderboard" widget the integrator can drop
 * anywhere on the hub HUD. Dependency-free beyond the router; navigates to the
 * shared leaderboard route.
 */
export default function LeaderboardPeek({ className, label = 'Leaderboard' }: LeaderboardPeekProps) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className={`hud-lb-peek${className ? ` ${className}` : ''}`}
      onClick={() => navigate(R3D.leaderboard)}
      aria-label="View the leaderboard"
    >
      <span className="hud-lb-trophy" aria-hidden>
        🏆
      </span>
      {label}
    </button>
  )
}
