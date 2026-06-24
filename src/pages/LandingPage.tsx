import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const POINTS = [
  'Solve hand-crafted detective cases, one locked room at a time.',
  'Learn real logic: deduction grids, contradictions, and AND / OR / NOT.',
  'Earn badges, build streaks, and replay any case you have cracked.',
]

export default function LandingPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && user) {
    return <Navigate to={profile?.displayName ? '/play' : '/profile-setup'} replace />
  }

  return (
    <div className="landing">
      <header className="landing-top">
        <div className="brand">
          <span className="brand-mark">LL</span>
          <span>LOGIC LOCKER</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate('/auth', { state: { mode: 'login' } })}
        >
          Log In
        </button>
      </header>

      <main className="landing-inner">
        <section className="landing-copy">
          <span className="landing-eyebrow">Detective Academy</span>
          <h1 className="landing-title">
            Crack the case with <span className="grad">logic</span>.
          </h1>
          <p className="landing-sub">
            Logic Locker is an interactive academy where you reason your way through
            mysteries. No guessing allowed — only clues, deduction, and proof.
          </p>

          <ul className="landing-points">
            {POINTS.map((p) => (
              <li key={p} className="landing-point">
                <span className="landing-check">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="landing-cta-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
            >
              Sign Up
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/auth', { state: { mode: 'login' } })}
            >
              Log In
            </button>
          </div>
          <p className="landing-fineprint">Free to start &middot; Built for curious middle-school detectives</p>
        </section>

        <section className="landing-art" aria-hidden>
          <div className="case-board">
            <div className="case-board-head">
              <span className="case-tag">Case #2</span>
              <span className="case-title">The Locker Color Mix-Up</span>
            </div>
            <table className="case-grid">
              <thead>
                <tr>
                  <th />
                  <th>Red</th>
                  <th>Blue</th>
                  <th>Green</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Ava</th>
                  <td className="cg x">✕</td>
                  <td className="cg x">✕</td>
                  <td className="cg ok">✓</td>
                </tr>
                <tr>
                  <th>Ben</th>
                  <td className="cg x">✕</td>
                  <td className="cg ok">✓</td>
                  <td className="cg x">✕</td>
                </tr>
                <tr>
                  <th>Cruz</th>
                  <td className="cg ok">✓</td>
                  <td className="cg x">✕</td>
                  <td className="cg x">✕</td>
                </tr>
              </tbody>
            </table>
            <div className="case-badges">
              <span className="case-badge gold">Gold</span>
              <span className="case-badge">Solved with reasoning</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
