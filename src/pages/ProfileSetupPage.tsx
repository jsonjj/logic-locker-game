import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createUserProfile } from '../firebase/progress'
import { avatars, DEFAULT_AVATAR_ID } from '../data/avatars'
import AvatarIcon from '../components/AvatarIcon'

export default function ProfileSetupPage() {
  const { user, profile, setProfile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // If a profile already exists, skip setup.
  useEffect(() => {
    if (profile?.displayName) {
      navigate('/play', { replace: true })
    }
  }, [profile, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) {
      setError('A recruit needs a name. Enter your display name.')
      return
    }
    if (!user) {
      setError('You are not signed in.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await createUserProfile(user.uid, user.email ?? '', name, avatarId)
      setProfile(created)
      navigate('/play', { replace: true })
    } catch {
      setError('Could not save your profile. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <div className="screen-center">
      <div className="card card-elevated" style={{ width: '100%', maxWidth: 460 }}>
        <h2 className="center">Recruit Setup</h2>
        <p className="muted center" style={{ marginTop: 0 }}>
          "Before you touch a single clue, I need a name to yell. — Akash"
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="displayName">Display name (required)</label>
            <input
              id="displayName"
              className="input"
              type="text"
              maxLength={24}
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jayden"
            />
          </div>

          <div className="field">
            <label>Pick an avatar (optional)</label>
            <div className="avatar-grid">
              {avatars.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`avatar-option ${avatarId === a.id ? 'selected' : ''}`}
                  onClick={() => setAvatarId(a.id)}
                  aria-pressed={avatarId === a.id}
                  title={a.label}
                >
                  <AvatarIcon id={a.id} size={56} />
                </button>
              ))}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Saving…' : 'Enter the Locker'}
          </button>
        </form>
      </div>
    </div>
  )
}
