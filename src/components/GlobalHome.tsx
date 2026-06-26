import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/global-home.css'

// Routes that already have their own back/leave affordance, or where "home"
// makes no sense (the world hub itself, pre-login screens).
const HIDDEN_PREFIXES = ['/auth', '/profile-setup', '/world']

/**
 * Always-on "Hub" button (top-right, beside Log out) so the player can hop back
 * to the single-player world hub from any in-game screen.
 */
export default function GlobalHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (!user) return null
  if (pathname === '/') return null
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null

  return (
    <button
      type="button"
      className="global-home"
      onClick={() => navigate('/world')}
      aria-label="Back to hub"
    >
      <span aria-hidden>⌂</span>
      Hub
    </button>
  )
}
