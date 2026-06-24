import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/global-home.css'

// Routes that already have their own back/leave affordance, or where "home"
// makes no sense (the menu itself, pre-login screens).
const HIDDEN_PREFIXES = ['/auth', '/profile-setup', '/play', '/mp']

/**
 * Always-on "Menu" button (top-right, beside Log out) so the player can hop back
 * to the One Player / Multiplayer chooser from any in-game screen.
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
      onClick={() => navigate('/play')}
      aria-label="Back to menu"
    >
      <span aria-hidden>⌂</span>
      Menu
    </button>
  )
}
