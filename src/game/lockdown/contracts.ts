/**
 * Shared contracts for "Logic Locker: Lockdown" — the rescue/escape game layer.
 *
 * Every parallel workstream imports types from THIS file so modules stay
 * decoupled and can be built independently:
 *   - Agent A  Isometric engine + art reskin   (Vec2, IsoPoint, IsoProject)
 *   - Agent B  Story & comms                    (DialogueLine, StoryBeat)
 *   - Agent C  Sectors, map & progression       (Sector, SectorView, SectorState)
 *   - Agent D  Scoring, pursuer & star ranks     (RunStats, LevelResult, StarRank, PursuerState)
 *   - Agent E  Global + per-level leaderboard    (LeaderboardEntry, LeaderboardScope)
 *
 * RULE: treat this file as read-only. If you need a new shared type, leave a
 * `// PROPOSE:` comment describing it and the integrator will add it.
 */

// ---------- Geometry / Isometric (Agent A) ----------

/** World-space point, expressed as percentages (0..100) of the play field. */
export interface Vec2 {
  x: number
  y: number
}

/** Screen-space position (percentages of the stage) after iso projection. */
export interface IsoPoint {
  left: number
  top: number
  /** Painter's-algorithm depth; higher renders in front. */
  z: number
}

/** Agent A implements this: project a top-down world point to iso screen %. */
export type IsoProject = (world: Vec2, opts?: { elevation?: number }) => IsoPoint

// ---------- Sectors / Progression (Agent C) ----------

export type SectorId = string

export interface Sector {
  id: SectorId
  /** Order along the "fight inward" path (0 = nearest the exit, last = mentor). */
  order: number
  /** e.g. "Sector 1 · Holding Cells". */
  name: string
  /** Short flavor shown on the map. */
  blurb: string
  /** The existing lesson whose steps power this sector's reasoning challenges. */
  lessonId: string
  /** This sector unlocks only after the given sector is cleared (null = open). */
  unlockAfter: SectorId | null
  /** Soft time target (seconds) used for the time component of star ranking. */
  parTimeSec: number
}

export type SectorState = 'locked' | 'unlocked' | 'cleared'

export interface SectorView extends Sector {
  state: SectorState
  /** The player's best run on this sector, or null if never cleared. */
  bestResult: LevelResult | null
}

// ---------- Scoring / Stars (Agent D) ----------

export type StarRank = 0 | 1 | 2 | 3

/** Live inputs the gameplay flow feeds the scorer when a sector is cleared. */
export interface RunStats {
  sectorId: SectorId
  /** Total elapsed time of the run, in milliseconds. */
  timeMs: number
  /** Reasoning mistakes made during the run. */
  mistakes: number
  /** Whether the pursuer caught up (lowers stars; never hard-fails). */
  caught: boolean
  /** Soft time target carried from the sector for time scoring. */
  parTimeSec: number
}

export interface LevelResult {
  sectorId: SectorId
  stars: StarRank
  timeMs: number
  mistakes: number
  caught: boolean
  /** Composite score used for leaderboards (higher = better). */
  score: number
  /** Epoch milliseconds when the run completed. */
  completedAt: number
}

/** Live pursuer state, surfaced to the HUD. */
export interface PursuerState {
  /** 0 = far/safe, 1 = caught up. */
  proximity: number
  caught: boolean
}

// ---------- Story / Comms (Agent B) ----------

export type SpeakerId = 'akash' | 'warden' | 'ally' | 'self' | (string & {})

export interface DialogueLine {
  speaker: SpeakerId
  /** Display name shown in the comms header. */
  name: string
  text: string
  mood?: 'neutral' | 'tense' | 'taunt' | 'warm' | 'urgent'
}

export type StoryBeatTrigger =
  | { kind: 'intro' } // capture cutscene, before the first sector
  | { kind: 'before-sector'; sectorId: SectorId }
  | { kind: 'after-sector'; sectorId: SectorId }
  | { kind: 'ending' } // mentor freed

export interface StoryBeat {
  id: string
  trigger: StoryBeatTrigger
  lines: DialogueLine[]
}

// ---------- Leaderboard (Agent E) ----------

export interface LeaderboardEntry {
  uid: string
  displayName: string
  avatarId: string
  /** Per-sector board uses the sector id; the global board uses null. */
  sectorId: SectorId | null
  score: number
  stars: StarRank
  timeMs: number
  /** Epoch milliseconds. */
  updatedAt: number
}

export type LeaderboardScope =
  | { kind: 'sector'; sectorId: SectorId }
  | { kind: 'global' }

// ---------- Cross-cutting routing ----------

export const ROUTES = {
  intro: '/intro',
  map: '/map',
  leaderboard: '/leaderboard',
  /** Gameplay route for a single sector. */
  play: (sectorId: SectorId) => `/play/${sectorId}`,
} as const

/** Path pattern (for <Route path>) matching ROUTES.play. */
export const PLAY_ROUTE_PATTERN = '/play/:sectorId'
