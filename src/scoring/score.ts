import type { LevelResult, RunStats, StarRank } from '../game/lockdown/contracts'

/**
 * Scoring rules for "Logic Locker: Lockdown".
 *
 * Pressure is LEARNING-SAFE: the timer and the pursuer only affect star rank
 * and composite score. Clearing a sector ALWAYS earns at least one star.
 */

const BASE_SCORE = 1000
const MISTAKE_PENALTY = 120
const CAUGHT_PENALTY = 150
const MIN_SCORE = 50
/** How hard time overage is punished, scaled against par. */
const TIME_OVERAGE_WEIGHT = 250
/** Multiplier on par for the (lenient) 2-star time window. */
const TWO_STAR_TIME_FACTOR = 1.5

/** Human-readable description of the star rules, for UI and tests. */
export const STAR_RULES = {
  three: 'Flawless: 0 mistakes, beat par time, and not caught.',
  two: 'Sharp: at most 1 mistake, within 1.5× par time, and not caught.',
  one: 'Cleared: you escaped the sector — every clear earns a star.',
  summary:
    '3 stars = perfect & fast & uncaught · 2 stars = nearly clean & not caught · 1 star = cleared.',
} as const

/** Compute the star rank for a run. Clearing always yields >= 1 star. */
function computeStars(stats: RunStats): StarRank {
  const parMs = stats.parTimeSec * 1000
  if (stats.mistakes === 0 && stats.timeMs <= parMs && !stats.caught) {
    return 3
  }
  if (
    stats.mistakes <= 1 &&
    stats.timeMs <= parMs * TWO_STAR_TIME_FACTOR &&
    !stats.caught
  ) {
    return 2
  }
  return 1
}

/** Turn live run stats into a persisted result (stars + composite score). */
export function computeResult(stats: RunStats): LevelResult {
  const parMs = Math.max(1, stats.parTimeSec * 1000)
  const stars = computeStars(stats)

  // Time overage penalty scales with how far past par the run went.
  const overageFraction = Math.max(0, (stats.timeMs - parMs) / parMs)
  const timePenalty = Math.round(overageFraction * TIME_OVERAGE_WEIGHT)

  const raw =
    BASE_SCORE -
    stats.mistakes * MISTAKE_PENALTY -
    timePenalty -
    (stats.caught ? CAUGHT_PENALTY : 0)

  const score = Math.max(MIN_SCORE, raw)

  return {
    sectorId: stats.sectorId,
    stars,
    timeMs: stats.timeMs,
    mistakes: stats.mistakes,
    caught: stats.caught,
    score,
    completedAt: Date.now(),
  }
}

/** Format milliseconds as "M:SS" (e.g. 83000 -> "1:23"). */
export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
