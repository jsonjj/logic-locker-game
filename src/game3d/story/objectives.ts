import type { DialogueLine, ObjectiveState, Vec3 } from '../contracts'
import type { Sector } from '../../game/lockdown/contracts'
import {
  ENDING_LINES,
  INTRO_LINES,
  MISSION_TAGLINE,
  akashDistancePhrase,
  getSectorBeat,
} from './beats'

/**
 * [Agent 4] Turns the player's situation into a punchy, story-driven HUD
 * objective (plus a waypoint target). Every line answers "where do I go and
 * why" — and the why is always the same: reason your way deeper to free Akash.
 *
 * `getObjective(ctx)` keeps a stable signature for the integrator. The extra
 * narrative helpers below are optional sugar the HUD/cutscene layer may use.
 */
export interface ObjectiveContext {
  scene: 'hub' | 'room'
  /** In a room: 'solve' until the lock is cracked, then 'exit'. */
  phase?: 'solve' | 'exit'
  sector?: Sector
  nextSector?: Sector
  allCleared?: boolean
  /** World point to aim the waypoint at (door / puzzle anchor). */
  target?: Vec3 | null
}

export function getObjective(ctx: ObjectiveContext): ObjectiveState {
  const target = ctx.target ?? null

  if (ctx.scene === 'hub') {
    if (ctx.allCleared) {
      return {
        kind: 'escape',
        text: 'Every block is open — reach the outer gate and get Akash out.',
        target,
      }
    }
    const next = ctx.nextSector
    if (!next) {
      return { kind: 'goto', text: 'Find the next locked block and break in.', target }
    }
    const beat = getSectorBeat(next.id)
    const breach = beat?.breach ?? `Break into ${next.name}`
    return {
      kind: 'goto',
      text: `${breach} — ${akashDistancePhrase(next.order)}.`,
      target,
      sectorId: next.id,
    }
  }

  // Inside a sector room.
  const sector = ctx.sector
  const beat = sector ? getSectorBeat(sector.id) : undefined

  if (ctx.phase === 'exit') {
    return {
      kind: sector && isDeepest(sector) ? 'escape' : 'return',
      text: beat?.exit ?? 'Lock cracked — slip through before the Warden\u2019s sweep.',
      target,
      sectorId: sector?.id,
    }
  }

  return {
    kind: 'solve',
    text: beat?.solve ?? `Crack the security lock on ${sector?.name ?? 'this block'}.`,
    target,
    sectorId: sector?.id,
  }
}

/** True when this sector is the deepest one (where Akash is held). */
function isDeepest(sector: Sector): boolean {
  return getSectorBeat(sector.id)?.sectorId === 'lesson-7' || sector.id === 'lesson-7'
}

// ---------------------------------------------------------------------------
// Optional narrative helpers (HUD / cutscene layer may use these)
// ---------------------------------------------------------------------------

/** Lines for the capture cutscene before the first block. */
export function getIntroLines(): DialogueLine[] {
  return INTRO_LINES
}

/** Lines for the ending cutscene after the deepest block is cleared. */
export function getEndingLines(): DialogueLine[] {
  return ENDING_LINES
}

/** A short Akash radio whisper to celebrate clearing a given sector. */
export function getClearedWhisper(sector: Sector): string | undefined {
  return getSectorBeat(sector.id)?.whisper
}

/** One-line framing for menus / loading screens. */
export function getMissionTagline(): string {
  return MISSION_TAGLINE
}
