import { useMemo } from 'react'
import type { StoryBeat, StoryBeatTrigger } from '../game/lockdown/contracts'
import { getBeat } from '../data/story'

/**
 * useStoryBeat — thin React helper over getBeat (Agent B).
 *
 * Returns the StoryBeat whose trigger matches, or undefined if none exists.
 * Memoized on the trigger's identifying fields so consumers can pass an inline
 * trigger object without re-running on every render.
 */
export function useStoryBeat(trigger: StoryBeatTrigger): StoryBeat | undefined {
  const sectorId = 'sectorId' in trigger ? trigger.sectorId : undefined
  // Re-resolve only when the trigger's identity (kind + sector) changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getBeat(trigger), [trigger.kind, sectorId])
}
