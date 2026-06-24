import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isRealtimeConfigured } from '../firebase/firebaseConfig'
import {
  createMatch,
  joinMatch,
  subscribeMatch,
  setReady,
  setPlayerColor,
  startMatch,
  attachPresence,
  leaveMatch,
  type JoinResult,
} from '../multiplayer/net'
import { PLAYER_COLORS, MAX_PLAYERS, TARGET_WINS, type MatchSnapshot } from '../multiplayer/types'
import { resolveColors } from '../multiplayer/colors'
import { ROUND_DURATION_MS } from '../multiplayer/arena'
import '../styles/multiplayer.css'

export default function MultiplayerLobbyPage() {
  const { code } = useParams()
  const { user, profile, loading } = useAuth()

  if (!loading && !user) return <Navigate to="/" replace />
  if (!loading && user && !profile?.displayName) return <Navigate to="/profile-setup" replace />
  if (!isRealtimeConfigured) return <Navigate to="/play" replace />

  return code ? <LobbyRoom code={code} /> : <LobbyEntry />
}

function LobbyEntry() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const identity = useMemo(
    () => ({ uid: user?.uid ?? '', name: profile?.displayName ?? 'Agent', color: PLAYER_COLORS[0] }),
    [user, profile],
  )

  async function onCreate() {
    setBusy(true)
    setError(null)
    try {
      const code = await createMatch(identity)
      navigate(`/mp/${code}`)
    } catch {
      setError('Could not create a match. Check your connection.')
      setBusy(false)
    }
  }

  async function onJoin() {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 3) {
      setError('Enter a valid room code.')
      return
    }
    setBusy(true)
    setError(null)
    const res: JoinResult = await joinMatch(code, identity)
    if (res === 'ok') {
      navigate(`/mp/${code}`)
      return
    }
    const messages: Record<JoinResult, string> = {
      ok: '',
      notfound: 'No match with that code.',
      full: 'That match is full (6 players max).',
      started: 'That match has already started.',
      unconfigured: 'Multiplayer is not available right now.',
    }
    setError(messages[res])
    setBusy(false)
  }

  return (
    <div className="mp-lobby">
      <button type="button" className="mp-back" onClick={() => navigate('/play')}>
        ← Back
      </button>
      <div className="mp-entry-card">
        <span className="mode-eyebrow">Multiplayer</span>
        <h1 className="mp-title">Arena</h1>
        <p className="mode-sub">Host a room and share the code, or join a friend's.</p>

        <button type="button" className="btn btn-primary mp-wide" disabled={busy} onClick={onCreate}>
          Host a new match
        </button>

        <div className="mp-or">or join with a code</div>

        <div className="mp-join-row">
          <input
            className="mp-code-input"
            value={joinCode}
            maxLength={6}
            placeholder="CODE"
            aria-label="Room code"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && onJoin()}
          />
          <button type="button" className="btn btn-ghost mp-join-btn" disabled={busy} onClick={onJoin}>
            Join
          </button>
        </div>

        {error && <p className="mp-error">{error}</p>}
      </div>
    </div>
  )
}

function LobbyRoom({ code }: { code: string }) {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const uid = user?.uid ?? ''
  const [snap, setSnap] = useState<MatchSnapshot | null>(null)
  const joinedRef = useRef(false)

  // Subscribe to the room; make sure we're a member (covers refresh / deep link).
  useEffect(() => {
    if (!uid) return
    const unsub = subscribeMatch(code, (s) => setSnap(s))
    return () => unsub()
  }, [code, uid])

  // Ensure membership + presence once we know who the host is.
  useEffect(() => {
    if (!uid || !snap?.meta || joinedRef.current) return
    joinedRef.current = true
    const isHost = snap.meta.hostUid === uid
    if (!snap.players[uid]) {
      void joinMatch(code, { uid, name: profile?.displayName ?? 'Agent', color: PLAYER_COLORS[0] })
    }
    attachPresence(code, uid, isHost)
  }, [code, uid, snap, profile])

  // When the host starts, everyone drops into the arena.
  useEffect(() => {
    if (snap?.meta?.status === 'playing') navigate(`/mp/${code}/play`, { replace: true })
    if (snap?.meta?.status === 'ended') navigate('/mp', { replace: true })
  }, [snap?.meta?.status, code, navigate])

  const players = useMemo(() => {
    const list = Object.values(snap?.players ?? {})
    return list.sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
  }, [snap])
  const colors = useMemo(() => resolveColors(snap?.players ?? {}), [snap])

  const isHost = snap?.meta?.hostUid === uid
  const me = snap?.players?.[uid]
  const everyoneReady = players.length >= 2 && players.every((p) => p.ready)
  // Colors another player has explicitly claimed (so I can't double-pick).
  const takenByOthers = new Set(
    players.filter((p) => p.uid !== uid && p.color).map((p) => p.color),
  )

  async function onLeave() {
    await leaveMatch(code, uid, isHost)
    navigate('/mp', { replace: true })
  }

  if (snap && !snap.meta) {
    return (
      <div className="mp-lobby">
        <div className="mp-entry-card">
          <h1 className="mp-title">Match closed</h1>
          <p className="mode-sub">This room no longer exists.</p>
          <button type="button" className="btn btn-primary mp-wide" onClick={() => navigate('/mp')}>
            Back to multiplayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mp-lobby">
      <button type="button" className="mp-back" onClick={onLeave}>
        ← Leave
      </button>
      <div className="mp-room-card">
        <span className="mode-eyebrow">Room code</span>
        <div className="mp-code-display">{code}</div>
        <p className="mode-sub">Share this code. The match starts when everyone's ready.</p>

        <ul className="mp-player-list">
          {players.map((p) => (
            <li key={p.uid} className="mp-player">
              <span className="mp-player-dot" style={{ background: colors[p.uid] }} />
              <span className="mp-player-name">
                {p.name}
                {p.uid === uid && ' (you)'}
                {p.uid === snap?.meta?.hostUid && <span className="mp-host-tag">HOST</span>}
              </span>
              <span className={`mp-ready-tag${p.ready ? ' is-ready' : ''}`}>
                {p.ready ? 'Ready' : 'Not ready'}
              </span>
            </li>
          ))}
          {Array.from({ length: Math.max(0, MAX_PLAYERS - players.length) }).map((_, i) => (
            <li key={`empty-${i}`} className="mp-player is-empty">
              <span className="mp-player-dot" />
              <span className="mp-player-name">Open slot</span>
            </li>
          ))}
        </ul>

        <div className="mp-color-pick">
          <span className="mp-color-label">Your color</span>
          <div className="mp-swatches">
            {PLAYER_COLORS.map((c) => {
              const mine = colors[uid] === c
              const taken = takenByOthers.has(c)
              return (
                <button
                  key={c}
                  type="button"
                  className={`mp-swatch${mine ? ' is-mine' : ''}${taken ? ' is-taken' : ''}`}
                  style={{ background: c }}
                  disabled={taken}
                  onClick={() => setPlayerColor(code, uid, c)}
                  aria-label={taken ? 'Color taken' : 'Pick this color'}
                />
              )
            })}
          </div>
        </div>

        <p className="mp-series-note">First to {TARGET_WINS} round wins takes the match.</p>

        <div className="mp-room-actions">
          <button
            type="button"
            className={`btn ${me?.ready ? 'btn-ghost' : 'btn-primary'}`}
            onClick={() => setReady(code, uid, !me?.ready)}
          >
            {me?.ready ? 'Unready' : "I'm ready"}
          </button>
          {isHost && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!everyoneReady}
              onClick={() => startMatch(code, ROUND_DURATION_MS, TARGET_WINS)}
              title={everyoneReady ? 'Start the match' : 'Need 2+ players, all ready'}
            >
              Start match
            </button>
          )}
        </div>
        {!isHost && <p className="mp-waiting">Waiting for the host to start…</p>}
      </div>
    </div>
  )
}
