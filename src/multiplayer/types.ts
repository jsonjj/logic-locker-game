/** Shared multiplayer data shapes mirrored in the Realtime Database. */

export type MatchStatus = 'lobby' | 'playing' | 'intermission' | 'ended'

/** One participant in a match (also their live transform + score). */
export interface NetPlayer {
  uid: string
  name: string
  /** Jumpsuit tint so players are distinguishable in-world and on the board. */
  color: string
  ready?: boolean
  /** Live transform, written by that player's own client ~10Hz. */
  x?: number
  z?: number
  ry?: number
  moving?: boolean
  /** Kills THIS round (resets each round). Drives the live board. */
  kills?: number
  /** Rounds won — first to the target wins the series. */
  wins?: number
  /** Whether they're up (false while respawning). */
  alive?: boolean
  /** Number of times downed (drives the growing respawn delay). */
  deaths?: number
  online?: boolean
  joinedAt?: number
  /** Result of the between-rounds quiz (drives next round's buff). */
  quiz?: NetQuiz
}

/** A player's answer to the intermission question. */
export interface NetQuiz {
  answered?: boolean
  correct?: boolean
  timeMs?: number
  mistakes?: number
  /** Reward tier earned: 0 none, 1 small, 2 big. */
  tier?: number
}

/** A host-simulated enemy, broadcast to every client. */
export interface NetEnemy {
  x: number
  z: number
  hp: number
  maxHp: number
  kind: 'melee' | 'ranged'
}

/** A damage claim a client sends to the host for authoritative resolution. */
export interface NetHit {
  eid: string
  dmg: number
  by: string
}

export interface NetMeta {
  hostUid: string
  status: MatchStatus
  createdAt: number
  startedAt?: number
  /** Wall-clock time (ms) the current round ends. */
  endsAt?: number
  /** 1-based round number in a first-to-N series. */
  round?: number
  /** Rounds needed to take the match. */
  targetWins?: number
  /** Wall-clock time (ms) the current intermission ends. */
  intermissionEndsAt?: number
  /** uid of the most recent round winner (shown during intermission). */
  lastRoundWinner?: string
  /** uid of the series champion (set when status === 'ended'). */
  champion?: string
  /** Index into the shared quiz pool for the current intermission question. */
  quizId?: number
}

export interface MatchSnapshot {
  code: string
  meta: NetMeta | null
  players: Record<string, NetPlayer>
}

/** Player jumpsuit colors, assigned by join order (supports up to 6). */
export const PLAYER_COLORS = [
  '#e0892f', // orange (the single-player hue)
  '#36b3ff', // blue
  '#52d273', // green
  '#c66bff', // purple
  '#ff5d6c', // red
  '#ffd24a', // gold
]

export const MAX_PLAYERS = 6

/** Rounds needed to win the series. */
export const TARGET_WINS = 3
