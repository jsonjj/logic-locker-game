import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signUp, logIn, authErrorMessage } from '../firebase/auth'
import { isFirebaseConfigured } from '../firebase/firebaseConfig'

export default function AuthPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initialMode = (location.state as { mode?: 'login' | 'signup' } | null)?.mode ?? 'login'
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Once authenticated, leave the auth screen.
  useEffect(() => {
    if (!loading && user) {
      navigate(profile?.displayName ? '/play' : '/profile-setup', { replace: true })
    }
  }, [user, profile, loading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password)
      } else {
        await logIn(email.trim(), password)
      }
      // Navigation handled by the effect above.
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen-center">
      <div className="card card-elevated" style={{ width: '100%', maxWidth: 420 }}>
        <Link
          to="/"
          className="brand"
          style={{ justifyContent: 'center', marginBottom: 6, textDecoration: 'none' }}
        >
          <span className="brand-mark">LL</span>
          <span>LOGIC LOCKER</span>
        </Link>
        <p className="muted center" style={{ marginTop: 0 }}>
          Detective Academy &middot; Recruit Access
        </p>

        {!isFirebaseConfigured && (
          <div className="form-note">
            Firebase is not configured yet. Add your keys to <code>.env</code> (see README)
            to enable sign-up and login.
          </div>
        )}

        <div className="btn-row" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={`btn btn-block ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setMode('login')}
          >
            Log In
          </button>
          <button
            type="button"
            className={`btn btn-block ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Working…' : mode === 'signup' ? 'Create Recruit Account' : 'Enter the Locker'}
          </button>
        </form>
      </div>
    </div>
  )
}
