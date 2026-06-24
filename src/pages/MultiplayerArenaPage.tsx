import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isRealtimeConfigured } from '../firebase/firebaseConfig'
import { GameStateProvider } from '../game3d/state/GameStateContext'
import { GameCanvas, ThirdPersonPlayer } from '../game3d/engine'
import {
  subscribeMatch,
  subscribeEnemies,
  attachPresence,
  leaveMatch,
  updatePlayerTransform,
  nextRound,
  goIntermission,
  creditWin,
  finishSeries,
  reportDeath,
  reportRespawn,
} from '../multiplayer/net'
import { playerSpawn, respawnDelay, ROUND_DURATION_MS, INTERMISSION_MS, MAX_HP } from '../multiplayer/arena'
import { type NetEnemy, type NetMeta, type NetPlayer } from '../multiplayer/types'
import { resolveColors } from '../multiplayer/colors'
import { useInventory } from '../game3d/state/InventoryContext'
import { GEAR } from '../game3d/systems/gear'
import { useSectorProgress } from '../sectors/useSectorProgress'
import ArenaEnvironment from '../multiplayer/ArenaEnvironment'
import RemotePlayers from '../multiplayer/RemotePlayers'
import SharedEnemies, { type EnemiesHandle, type LiveEnemy } from '../multiplayer/SharedEnemies'
import MpWeapon, { type MpWeaponProfile } from '../multiplayer/MpWeapon'
import PlayerVitals from '../multiplayer/PlayerVitals'
import MultiplayerHud from '../multiplayer/MultiplayerHud'
import '../styles/multiplayer.css'

export default function MultiplayerArenaPage() {
  const { code } = useParams()
  const { user, loading } = useAuth()

  if (loading) return <div className="world-loading">Entering the arena…</div>
  if (!user) return <Navigate to="/" replace />
  if (!isRealtimeConfigured) return <Navigate to="/play" replace />
  if (!code) return <Navigate to="/mp" replace />

  return <Arena code={code} uid={user.uid} />
}

function Arena({ code, uid }: { code: string; uid: string }) {
  const navigate = useNavigate()
  const inv = useInventory()
  // How many single-player lessons (sectors) you've cleared. This is a
  // GUARANTEED mastery boost — independent of the random reward wheel — so even
  // an unlucky single-player run still makes you stronger in the arena.
  const { views } = useSectorProgress()
  const mastery = useMemo(() => views.filter((v) => v.state === 'cleared').length, [views])

  // Carry single-player gear into the arena: equipped ranged weapon (or a
  // baseline pistol so you're never gun-less), plus bonus HP from armor — then
  // stack the lessons-earned mastery boost on top.
  const mpWeapon = useMemo<MpWeaponProfile>(() => {
    const w = inv.weapon
    const base = w.weaponKind === 'ranged' ? w : GEAR['plasma-pistol']
    const dmgBoost = mastery * 0.5
    const cdScale = Math.max(0.6, 1 - mastery * 0.04)
    return {
      name: base.name,
      damage: (base.damage ?? 1) + dmgBoost,
      range: (base.range ?? 13) + mastery * 0.6,
      cooldownMs: Math.round((base.cooldownMs ?? 360) * cdScale),
      aoe: base.aoe,
      color: base.color,
    }
  }, [inv.weapon, mastery])
  const maxHp = MAX_HP + inv.bonusLives + Math.floor(mastery / 2)

  const playersRef = useRef<Record<string, NetPlayer>>({})
  const enemiesViewRef = useRef<Map<string, LiveEnemy> | null>(null)
  const [roster, setRoster] = useState<NetPlayer[]>([])
  const [meta, setMeta] = useState<NetMeta | null>(null)
  const [enemies, setEnemies] = useState<Record<string, NetEnemy>>({})
  const rosterSig = useRef('')
  const metaSig = useRef('')
  const enemiesHandle = useRef<EnemiesHandle | null>(null)
  const presenceDone = useRef(false)
  const sawMeta = useRef(false)

  // Local lives state.
  const [hp, setHp] = useState(maxHp)
  const [dead, setDead] = useState(false)
  const [respawnAt, setRespawnAt] = useState<number | null>(null)
  const deathsRef = useRef(0)

  // Host round-resolution dedupe.
  const endedRoundRef = useRef(-1)
  const advancedRoundRef = useRef(-1)

  const isHost = meta?.hostUid === uid
  const status = meta?.status
  const playing = status === 'playing'
  const round = meta?.round ?? 1

  useEffect(() => {
    const unsub = subscribeMatch(code, (s) => {
      playersRef.current = s.players
      const m = s.meta
      const msig = m
        ? `${m.status}:${m.endsAt ?? 0}:${m.round ?? 0}:${m.intermissionEndsAt ?? 0}:${m.lastRoundWinner ?? ''}:${m.champion ?? ''}`
        : 'none'
      if (msig !== metaSig.current) {
        metaSig.current = msig
        setMeta(m)
      }
      if (m) sawMeta.current = true
      const list = Object.values(s.players).sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
      const sig = list
        .map((p) => `${p.uid}:${p.kills ?? 0}:${p.wins ?? 0}:${p.online ? 1 : 0}:${p.color ?? ''}:${p.name}`)
        .join('|')
      if (sig !== rosterSig.current) {
        rosterSig.current = sig
        setRoster(list)
      }
    })
    return () => unsub()
  }, [code])

  useEffect(() => {
    if (isHost) return
    const unsub = subscribeEnemies(code, setEnemies)
    return () => unsub()
  }, [code, isHost])

  useEffect(() => {
    if (presenceDone.current || !meta) return
    presenceDone.current = true
    attachPresence(code, uid, meta.hostUid === uid)
  }, [code, uid, meta])

  useEffect(() => {
    if (sawMeta.current && meta === null) navigate('/mp', { replace: true })
  }, [meta, navigate])

  // Reset local lives at the start of each round.
  useEffect(() => {
    deathsRef.current = 0
    setHp(maxHp)
    setDead(false)
    setRespawnAt(null)
  }, [round, status, maxHp])

  // --- Host: manage the round clock + first-to-N series -------------------
  useEffect(() => {
    if (!isHost) return
    if (status !== 'playing' && status !== 'intermission') return
    const targetWins = meta?.targetWins ?? 3
    const t = setInterval(() => {
      const m = meta
      if (!m) return
      const now = Date.now()
      if (m.status === 'playing' && m.endsAt && now >= m.endsAt && endedRoundRef.current !== round) {
        endedRoundRef.current = round
        // Round winner = most kills this round (tie → earliest to join).
        const ps = Object.values(playersRef.current)
        let winner: NetPlayer | null = null
        for (const p of ps) {
          if (
            !winner ||
            (p.kills ?? 0) > (winner.kills ?? 0) ||
            ((p.kills ?? 0) === (winner.kills ?? 0) && (p.joinedAt ?? 0) < (winner.joinedAt ?? 0))
          ) {
            winner = p
          }
        }
        if (winner) {
          creditWin(code, winner.uid)
          const winnerWins = (winner.wins ?? 0) + 1
          if (winnerWins >= targetWins) void finishSeries(code, winner.uid)
          else void goIntermission(code, winner.uid, now + INTERMISSION_MS)
        }
      }
      if (
        m.status === 'intermission' &&
        m.intermissionEndsAt &&
        now >= m.intermissionEndsAt &&
        advancedRoundRef.current !== round
      ) {
        advancedRoundRef.current = round
        void nextRound(code, round + 1, ROUND_DURATION_MS)
      }
    }, 400)
    return () => clearInterval(t)
  }, [isHost, status, round, code, meta])

  // --- Local death / respawn (delay grows each death) ---------------------
  const onDeath = useCallback(() => {
    setDead((already) => {
      if (already) return already
      const prior = deathsRef.current
      deathsRef.current = prior + 1
      setRespawnAt(Date.now() + respawnDelay(prior))
      reportDeath(code, uid)
      return true
    })
  }, [code, uid])

  useEffect(() => {
    if (!dead || !respawnAt) return
    const ms = Math.max(0, respawnAt - Date.now())
    const t = setTimeout(() => {
      setDead(false)
      setRespawnAt(null)
      setHp(maxHp)
      reportRespawn(code, uid)
    }, ms)
    return () => clearTimeout(t)
  }, [dead, respawnAt, code, uid, maxHp])

  const colors = useMemo(
    () => resolveColors(Object.fromEntries(roster.map((p) => [p.uid, p]))),
    [roster],
  )
  const ids = useMemo(() => roster.map((p) => p.uid), [roster])
  const myIndex = Math.max(0, roster.findIndex((p) => p.uid === uid))
  const spawn = useMemo(() => playerSpawn(myIndex), [myIndex])
  const alive = playing && !dead

  const onLeave = useCallback(async () => {
    await leaveMatch(code, uid, isHost)
    navigate('/play', { replace: true })
  }, [code, uid, isHost, navigate])

  if (status === 'ended') {
    const ranked = [...roster].sort(
      (a, b) => (b.wins ?? 0) - (a.wins ?? 0) || (b.kills ?? 0) - (a.kills ?? 0),
    )
    const champ = roster.find((p) => p.uid === meta?.champion)
    return (
      <div className="mp-results">
        <div className="mp-results-card">
          <span className="mode-eyebrow">Series over</span>
          <h1 className="mp-title">{champ ? `${champ.name} wins!` : 'Final standings'}</h1>
          <ol className="mp-results-list">
            {ranked.map((p, i) => (
              <li key={p.uid} className={`mp-results-row${p.uid === uid ? ' is-me' : ''}`}>
                <span className="mp-board-rank">{i === 0 ? '🏆' : i + 1}</span>
                <span className="mp-board-dot" style={{ background: colors[p.uid] }} />
                <span className="mp-board-name">{p.name}</span>
                <span className="mp-board-kills">{p.wins ?? 0} wins</span>
              </li>
            ))}
          </ol>
          <div className="mp-room-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/mp')}>
              Play again
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/play')}>
              Main menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mp-arena">
      <GameStateProvider>
        <GameCanvas>
          <ArenaEnvironment />
          <LocalPlayer code={code} uid={uid} spawn={spawn} frozen={!alive} />
          <RemotePlayers playersRef={playersRef} ids={ids} selfUid={uid} colors={colors} />
          <SharedEnemies
            ref={enemiesHandle}
            code={code}
            isHost={isHost}
            playing={playing}
            playersRef={playersRef}
            selfUid={uid}
            enemiesSnapshot={enemies}
            viewRef={enemiesViewRef}
            roundKey={round}
          />
          <MpWeapon
            code={code}
            uid={uid}
            isHost={isHost}
            playing={alive}
            handle={enemiesHandle}
            weapon={mpWeapon}
          />
          <PlayerVitals
            enemiesViewRef={enemiesViewRef}
            playing={playing}
            alive={alive}
            maxHp={maxHp}
            resetKey={round}
            onHp={setHp}
            onDeath={onDeath}
          />
        </GameCanvas>

        <MultiplayerHud
          roster={roster}
          colors={colors}
          selfUid={uid}
          endsAt={meta?.endsAt}
          round={meta?.round}
          targetWins={meta?.targetWins}
          hp={hp}
          maxHp={maxHp}
          dead={dead}
          respawnAt={respawnAt}
          playersRef={playersRef}
          enemiesViewRef={enemiesViewRef}
          ids={ids}
          weaponName={mpWeapon.name}
          power={mpWeapon.damage}
          mastery={mastery}
        />
      </GameStateProvider>

      {status === 'intermission' && <Intermission meta={meta} roster={roster} colors={colors} selfUid={uid} />}
      {status !== 'playing' && status !== 'intermission' && (
        <div className="mp-countdown">Waiting for the match to start…</div>
      )}

      <button type="button" className="mp-leave" onClick={onLeave}>
        Leave
      </button>
    </div>
  )
}

function Intermission({
  meta,
  roster,
  colors,
  selfUid,
}: {
  meta: NetMeta | null
  roster: NetPlayer[]
  colors: Record<string, string>
  selfUid: string
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  const left = meta?.intermissionEndsAt ? Math.max(0, Math.ceil((meta.intermissionEndsAt - now) / 1000)) : 0
  const winner = roster.find((p) => p.uid === meta?.lastRoundWinner)
  const ranked = [...roster].sort(
    (a, b) => (b.wins ?? 0) - (a.wins ?? 0) || (b.kills ?? 0) - (a.kills ?? 0),
  )
  return (
    <div className="mp-intermission">
      <div className="mp-results-card">
        <span className="mode-eyebrow">Round {meta?.round} complete</span>
        <h1 className="mp-title">{winner ? `${winner.name} takes the round` : 'Round over'}</h1>
        <ol className="mp-results-list">
          {ranked.map((p) => (
            <li key={p.uid} className={`mp-results-row${p.uid === selfUid ? ' is-me' : ''}`}>
              <span className="mp-board-dot" style={{ background: colors[p.uid] }} />
              <span className="mp-board-name">{p.name}</span>
              <span className="mp-board-kills">
                {p.wins ?? 0} wins · {p.kills ?? 0} kills
              </span>
            </li>
          ))}
        </ol>
        <p className="mp-series-note">Next round in {left}s…</p>
      </div>
    </div>
  )
}

function LocalPlayer({
  code,
  uid,
  spawn,
  frozen,
}: {
  code: string
  uid: string
  spawn: { x: number; y: number; z: number }
  frozen: boolean
}) {
  const last = useRef({ t: 0, x: 0, z: 0 })
  const onMove = useCallback(
    (pos: { x: number; y: number; z: number }, heading: number) => {
      const now = performance.now()
      if (now - last.current.t < 100) return
      const moved = Math.hypot(pos.x - last.current.x, pos.z - last.current.z)
      last.current = { t: now, x: pos.x, z: pos.z }
      updatePlayerTransform(code, uid, {
        x: Math.round(pos.x * 100) / 100,
        z: Math.round(pos.z * 100) / 100,
        ry: heading,
        moving: moved > 0.05,
      })
    },
    [code, uid],
  )
  return <ThirdPersonPlayer spawn={spawn} frozen={frozen} onMove={onMove} />
}
