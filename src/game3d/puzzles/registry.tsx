import type { ComponentType } from 'react'
import type { PuzzleSceneProps, SectorId } from '../contracts'
import PuzzleScene from './PuzzleScene'

/**
 * [Agent 3] Maps a sector to its interactive puzzle scene.
 *
 * Every sector is cracked through the same adaptive controller, `PuzzleScene`,
 * which reads the sector's lesson and assembles real security devices —
 * Override Console (choices), Evidence Locker (clue sort), Deduction Terminal
 * (grids), Logic-Gate Panel (switches), Relay Sequencer (ordering) — and offers
 * 2-3 branching breach routes per scene. Keeping the controller generic means a
 * sector's puzzle always stays tied to its authored lesson content.
 *
 * Contract kept stable: `getPuzzleScene(sectorId)` returns a component that
 * accepts `PuzzleSceneProps` and reports a `PuzzleResult` via `onComplete`.
 */
export function getPuzzleScene(_sectorId: SectorId): ComponentType<PuzzleSceneProps> {
  return PuzzleScene
}
