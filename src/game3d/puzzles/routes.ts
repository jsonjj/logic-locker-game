/**
 * [Agent 3] Pure helpers (no React) that assemble a difficulty-scaled quiz from
 * a Lesson and map each lesson Step type onto a security-device archetype.
 */
import type { Lesson, Step, StepPhase } from '../../types'
import { trackCount, varyStep } from '../../logic/variants'
import type { DeviceKind, InteractiveStep, RouteRisk } from './types'

const INTERACTIVE_TYPES = new Set<Step['type']>([
  'multipleChoice',
  'prediction',
  'highlightChoice',
  'symbolTap',
  'clueSort',
  'deductionGrid',
  'miniGrid',
  'singleCellGrid',
  'logicSwitches',
  'ordering',
])

/** Narrowing guard: is this a step a device can be built from? */
export function isInteractive(step: Step): step is InteractiveStep {
  return INTERACTIVE_TYPES.has(step.type)
}

/** Map a lesson step type onto the device that renders it. */
export function deviceKindForStep(step: InteractiveStep): DeviceKind {
  switch (step.type) {
    case 'multipleChoice':
    case 'prediction':
    case 'highlightChoice':
    case 'symbolTap':
      return 'console'
    case 'clueSort':
      return 'locker'
    case 'deductionGrid':
    case 'miniGrid':
    case 'singleCellGrid':
      return 'grid'
    case 'logicSwitches':
      return 'gate'
    case 'ordering':
      return 'wiring'
  }
}

/** Short in-fiction name for a device archetype. */
export function deviceLabel(kind: DeviceKind): string {
  switch (kind) {
    case 'console':
      return 'Override Console'
    case 'locker':
      return 'Evidence Locker'
    case 'grid':
      return 'Deduction Terminal'
    case 'gate':
      return 'Logic-Gate Panel'
    case 'wiring':
      return 'Relay Sequencer'
  }
}

const PHASE_WEIGHT: Record<StepPhase, number> = {
  intro: 0,
  'micro-practice': 1,
  'guided-practice': 2,
  'pattern-check': 3,
  challenge: 4,
  reflection: 1,
  completion: 0,
}

/** Relative difficulty of a single question (higher = harder). */
export function stepWeight(step: InteractiveStep): number {
  return PHASE_WEIGHT[step.phase] ?? 2
}

export type Difficulty = 'hard' | 'standard' | 'thorough'

export interface DifficultyDef {
  id: Difficulty
  label: string
  blurb: string
  /** Number of questions the player must clear to open the lock. */
  count: number
  /** Flavor/badge styling reused from the old route risk classes. */
  risk: RouteRisk
}

/**
 * Three ways to crack a lock. Fewer questions = harder questions; more
 * questions = an easier-per-question but longer, complete sweep. Players trade
 * brevity against difficulty.
 */
export const DIFFICULTIES: DifficultyDef[] = [
  {
    id: 'hard',
    label: 'Lockdown',
    blurb: 'Only 4 nodes — but the toughest the lesson has. No warm-up. For experts.',
    count: 4,
    risk: 'fast',
  },
  {
    id: 'standard',
    label: 'Standard',
    blurb: '5 nodes. Still hard, with a touch more room to breathe.',
    count: 5,
    risk: 'balanced',
  },
  {
    id: 'thorough',
    label: 'Thorough',
    blurb: '10 nodes. Each one a bit easier, but a long, complete sweep of the topic.',
    count: 10,
    risk: 'safe',
  },
]

export function difficultyDef(id: Difficulty): DifficultyDef {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1]
}

/**
 * Assemble the quiz for a lock at the chosen difficulty.
 *
 * - "hard"/"standard": the N HARDEST distinct questions, presented hardest-first.
 * - "thorough": a full sweep ramped easy → hard; if the lesson has fewer than N
 *   distinct questions, it pads with extra authored variants (different tracks)
 *   so it stays the longest but lowest-average-difficulty option.
 *
 * Each chosen question is resolved to a (varied) authored track with its answer
 * order shuffled, so repeated visits aren't memorizable.
 */
export function buildQuiz(lesson: Lesson, difficulty: Difficulty, prestige = 0): InteractiveStep[] {
  const base = lesson.steps.filter(isInteractive)
  if (base.length === 0) return []
  const { count } = difficultyDef(difficulty)
  const tracks = trackCount(lesson)

  let picks: InteractiveStep[]
  // After a prestige, even the "thorough" sweep skews to the harder questions
  // first — finishing the game makes every replay genuinely tougher.
  if (difficulty === 'thorough' && prestige <= 0) {
    // Ramp easy → hard; cycle from the easiest when padding past the pool.
    const easyFirst = [...base].sort((a, b) => stepWeight(a) - stepWeight(b))
    picks = Array.from({ length: count }, (_, i) => easyFirst[i % easyFirst.length])
  } else {
    // The hardest `count`, toughest first; cycle from the hardest when padding.
    const hardFirst = [...base].sort((a, b) => stepWeight(b) - stepWeight(a))
    picks = Array.from({ length: count }, (_, i) => hardFirst[i % hardFirst.length])
  }

  // Resolve each pick to a varied track; give repeats of the same base question
  // a different track so duplicates don't read identically. Prestige offsets the
  // starting track so a replay surfaces fresh wording rather than the same set.
  const lastTrack = new Map<string, number>()
  return picks.map((step) => {
    const prev = lastTrack.get(step.id)
    let track = (Math.floor(Math.random() * tracks) + prestige) % tracks
    if (tracks > 1 && prev !== undefined) track = (prev + 1) % tracks
    lastTrack.set(step.id, track)
    return varyStep(step, track) as InteractiveStep
  })
}
