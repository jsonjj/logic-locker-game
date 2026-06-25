/**
 * Realtime-multiplayer transport over Firebase Realtime Database.
 *
 * Model: host-authoritative, friends-with-a-code. One client (the host) owns the
 * enemy simulation, the match clock, and score crediting; every client writes
 * only its own player transform and pushes damage "claims" the host resolves.
 * No dedicated server — the host's browser is the source of truth.
 */
import {
  ref,
  set,
  update,
  get,
  onValue,
  onChildAdded,
  push,
  remove,
  onDisconnect,
  serverTimestamp,
  increment,
  type Unsubscribe,
} from 'firebase/database'
import { rtdb, isRealtimeConfigured } from '../firebase/firebaseConfig'
import type { MatchSnapshot, NetEnemy, NetHit, NetMeta, NetPlayer } from './types'
import { MAX_PLAYERS } from './types'

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no easily-confused chars

export function makeMatchCode(len = 4): string {
  let s = ''
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return s
}

function matchRef(code: string) {
  return ref(rtdb, `matches/${code}`)
}

export interface JoinIdentity {
  uid: string
  name: string
  color: string
}

export type JoinResult = 'ok' | 'notfound' | 'full' | 'started' | 'unconfigured'

/** Create a fresh match and return its code (retries on the rare code clash). */
export async function createMatch(host: JoinIdentity): Promise<string> {
  if (!isRealtimeConfigured) throw new Error('Realtime Database not configured')
  let code = makeMatchCode()
  // Avoid colliding with an existing live match.
  for (let i = 0; i < 5; i++) {
    const existing = await get(matchRef(code))
    if (!existing.exists()) break
    code = makeMatchCode()
  }
  const meta: NetMeta = { hostUid: host.uid, status: 'lobby', createdAt: Date.now() }
  await set(matchRef(code), {
    meta,
    players: {
      [host.uid]: cleanPlayer({
        uid: host.uid,
        name: host.name,
        color: host.color,
        ready: true,
        kills: 0,
        alive: true,
        online: true,
        joinedAt: Date.now(),
      }),
    },
  })
  return code
}

/** Join an existing lobby. Returns a status the UI can act on. */
export async function joinMatch(code: string, who: JoinIdentity): Promise<JoinResult> {
  if (!isRealtimeConfigured) return 'unconfigured'
  const snap = await get(matchRef(code))
  if (!snap.exists()) return 'notfound'
  const data = snap.val() as { meta?: NetMeta; players?: Record<string, NetPlayer> }
  const players = data.players ?? {}
  const already = Boolean(players[who.uid])
  if (data.meta?.status !== 'lobby' && !already) return 'started'
  if (!already && Object.keys(players).length >= MAX_PLAYERS) return 'full'
  await set(ref(rtdb, `matches/${code}/players/${who.uid}`), cleanPlayer({
    uid: who.uid,
    name: who.name,
    color: who.color,
    ready: false,
    kills: 0,
    alive: true,
    online: true,
    joinedAt: Date.now(),
  }))
  return 'ok'
}

/** Subscribe to the whole match (meta + players). */
export function subscribeMatch(code: string, cb: (snap: MatchSnapshot) => void): Unsubscribe {
  return onValue(matchRef(code), (s) => {
    const val = (s.val() as { meta?: NetMeta; players?: Record<string, NetPlayer> } | null) ?? {}
    cb({ code, meta: val.meta ?? null, players: val.players ?? {} })
  })
}

export function subscribeEnemies(code: string, cb: (enemies: Record<string, NetEnemy>) => void): Unsubscribe {
  return onValue(ref(rtdb, `matches/${code}/enemies`), (s) => {
    cb((s.val() as Record<string, NetEnemy> | null) ?? {})
  })
}

/** Write my own live transform (called throttled from the player controller). */
export function updatePlayerTransform(
  code: string,
  uid: string,
  t: Pick<NetPlayer, 'x' | 'z' | 'ry' | 'moving'>,
): void {
  void update(ref(rtdb, `matches/${code}/players/${uid}`), t)
}

export function setReady(code: string, uid: string, ready: boolean): void {
  void update(ref(rtdb, `matches/${code}/players/${uid}`), { ready })
}

export function setPlayerColor(code: string, uid: string, color: string): void {
  void update(ref(rtdb, `matches/${code}/players/${uid}`), { color })
}

/** Start the series: round 1, reset every player's score/lives. */
export async function startMatch(code: string, durationMs: number, targetWins: number): Promise<void> {
  const snap = await get(ref(rtdb, `matches/${code}/players`))
  const players = (snap.val() as Record<string, NetPlayer> | null) ?? {}
  const fanout: Record<string, unknown> = {
    'meta/status': 'playing',
    'meta/startedAt': serverTimestamp(),
    'meta/round': 1,
    'meta/targetWins': targetWins,
    'meta/endsAt': Date.now() + durationMs,
    'meta/champion': null,
    'meta/lastRoundWinner': null,
    'meta/intermissionEndsAt': null,
    'enemies': null,
  }
  for (const uid of Object.keys(players)) {
    fanout[`players/${uid}/kills`] = 0
    fanout[`players/${uid}/wins`] = 0
    fanout[`players/${uid}/deaths`] = 0
    fanout[`players/${uid}/alive`] = true
    fanout[`players/${uid}/quiz`] = null
  }
  await update(ref(rtdb, `matches/${code}`), fanout)
}

/** Begin the next round: bump the round, reset per-round score + lives. */
export async function nextRound(code: string, round: number, durationMs: number): Promise<void> {
  const snap = await get(ref(rtdb, `matches/${code}/players`))
  const players = (snap.val() as Record<string, NetPlayer> | null) ?? {}
  const fanout: Record<string, unknown> = {
    'meta/status': 'playing',
    'meta/round': round,
    'meta/endsAt': Date.now() + durationMs,
    'meta/intermissionEndsAt': null,
    'enemies': null,
  }
  for (const uid of Object.keys(players)) {
    fanout[`players/${uid}/kills`] = 0
    fanout[`players/${uid}/deaths`] = 0
    fanout[`players/${uid}/alive`] = true
  }
  await update(ref(rtdb, `matches/${code}`), fanout)
}

/**
 * End the round → intermission with a shared quiz question. Resets every
 * player's quiz answer so they can take the new question; the next round begins
 * once everyone has answered (or the intermission times out).
 */
export async function goIntermission(
  code: string,
  winnerUid: string,
  untilMs: number,
  quizId: number,
): Promise<void> {
  const snap = await get(ref(rtdb, `matches/${code}/players`))
  const players = (snap.val() as Record<string, NetPlayer> | null) ?? {}
  const fanout: Record<string, unknown> = {
    'meta/status': 'intermission',
    'meta/lastRoundWinner': winnerUid,
    'meta/intermissionEndsAt': untilMs,
    'meta/quizId': quizId,
  }
  for (const uid of Object.keys(players)) {
    fanout[`players/${uid}/quiz`] = { answered: false }
  }
  await update(ref(rtdb, `matches/${code}`), fanout)
}

/** Submit my answer to the intermission quiz (drives my next-round buff). */
export function submitQuiz(
  code: string,
  uid: string,
  result: { correct: boolean; timeMs: number; mistakes: number; tier: number },
): void {
  void update(ref(rtdb, `matches/${code}/players/${uid}/quiz`), {
    answered: true,
    correct: result.correct,
    timeMs: result.timeMs,
    mistakes: result.mistakes,
    tier: result.tier,
  })
}

export function creditWin(code: string, uid: string): void {
  void update(ref(rtdb, `matches/${code}/players/${uid}`), { wins: increment(1) })
}

export async function finishSeries(code: string, championUid: string): Promise<void> {
  await update(ref(rtdb, `matches/${code}/meta`), { status: 'ended', champion: championUid })
}

export async function endMatch(code: string): Promise<void> {
  await update(ref(rtdb, `matches/${code}/meta`), { status: 'ended' })
}

// --- Lives / respawn -------------------------------------------------------
export function reportDeath(code: string, uid: string): void {
  void update(ref(rtdb, `matches/${code}/players/${uid}`), { alive: false, deaths: increment(1) })
}

export function reportRespawn(code: string, uid: string): void {
  void update(ref(rtdb, `matches/${code}/players/${uid}`), { alive: true })
}

/** Mark presence and auto-clean this player's node if the tab closes/disconnects. */
export function attachPresence(code: string, uid: string, isHost: boolean): void {
  const meRef = ref(rtdb, `matches/${code}/players/${uid}`)
  void update(meRef, { online: true })
  void onDisconnect(meRef).remove()
  // If the host drops, end the match so guests aren't stranded.
  if (isHost) {
    void onDisconnect(ref(rtdb, `matches/${code}/meta`)).update({ status: 'ended' })
  }
}

export async function leaveMatch(code: string, uid: string, isHost: boolean): Promise<void> {
  if (isHost) {
    await remove(matchRef(code))
  } else {
    await remove(ref(rtdb, `matches/${code}/players/${uid}`))
  }
}

// --- Host-authoritative enemy + hit plumbing -------------------------------

export function writeEnemies(code: string, enemies: Record<string, NetEnemy>): void {
  void set(ref(rtdb, `matches/${code}/enemies`), enemies)
}

/** A client claims it hit an enemy; the host resolves it. */
export function pushHit(code: string, hit: NetHit): void {
  void push(ref(rtdb, `matches/${code}/hits`), hit)
}

/** Host: stream incoming hit claims (child-added), with a remover for each. */
export function subscribeHits(
  code: string,
  cb: (key: string, hit: NetHit) => void,
): Unsubscribe {
  return onChildAdded(ref(rtdb, `matches/${code}/hits`), (s) => {
    const v = s.val() as NetHit | null
    if (v && s.key) cb(s.key, v)
  })
}

export function clearHit(code: string, key: string): void {
  void remove(ref(rtdb, `matches/${code}/hits/${key}`))
}

export function creditKill(code: string, uid: string): void {
  void update(ref(rtdb, `matches/${code}/players/${uid}`), { kills: increment(1) })
}

/** Strip undefined fields (RTDB rejects them). */
function cleanPlayer(p: NetPlayer): NetPlayer {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(p)) if (v !== undefined) out[k] = v
  return out as unknown as NetPlayer
}
