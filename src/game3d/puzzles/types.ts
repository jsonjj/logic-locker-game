/**
 * [Agent 3] Internal types shared by the interactive puzzle devices and the
 * per-sector PuzzleScene controller. Public contracts (PuzzleSceneProps,
 * PuzzleResult, getPuzzleScene) live in ../contracts.ts and registry.tsx.
 */
import type {
  ChoiceStep,
  ClueSortStep,
  DeductionGridStep,
  LogicSwitchesStep,
  OrderingStep,
  SingleCellGridStep,
} from '../../types'

/** A security device archetype. Several lesson step types map to each. */
export type DeviceKind = 'console' | 'locker' | 'grid' | 'gate' | 'wiring'

/** The subset of lesson Steps that can drive an interactive device. */
export type InteractiveStep =
  | ChoiceStep
  | ClueSortStep
  | DeductionGridStep
  | SingleCellGridStep
  | LogicSwitchesStep
  | OrderingStep

/** How aggressive a breach route is, for flavor + scoring. */
export type RouteRisk = 'fast' | 'balanced' | 'safe'

/** One of the 2-3 branching ways to crack a sector's lock. */
export interface RouteDef {
  /** Stable id reported back via PuzzleResult.route. */
  id: string
  label: string
  blurb: string
  risk: RouteRisk
  /** The device(s) the player must clear, in order, to open the lock. */
  steps: InteractiveStep[]
}

/** Callbacks every device component receives from the controller. */
export interface DeviceCallbacks {
  /** Fired once when the device is correctly cracked. */
  onSolved: () => void
  /** Fired on every wrong attempt (controller nudges the alarm). */
  onMistake: () => void
}
