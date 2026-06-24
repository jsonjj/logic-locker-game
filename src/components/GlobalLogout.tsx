import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logOut } from '../firebase/auth'
import '../styles/global-logout.css'

/**
 * Always-on logout control, fixed to the top-right of every screen while signed
 * in. Renders above the in-game HUD so the player can bail out from anywhere.
 */
export default function GlobalLogout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  async function handleLogout() {
    try {
      await logOut()
    } catch {
      /* ignore — leave the session regardless */
    }
    navigate('/auth', { replace: true })
  }

  return (
    <button type="button" className="global-logout" onClick={handleLogout} aria-label="Log out">
      <span aria-hidden>⏻</span>
      Log out
    </button>
  )
}
