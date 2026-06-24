import type { ChoiceStep, Lesson, Step } from '../types'

const CHOICE_TYPES = new Set<Step['type']>([
  'multipleChoice',
  'prediction',
  'highlightChoice',
  'symbolTap',
])

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Total number of versions for a step (base + variants). */
export function variantCount(step: Step): number {
  return (step.variants?.length ?? 0) + 1
}

/**
 * How many full "case tracks" a lesson offers. Every step is rendered with the
 * same track so a room's questions stay consistent within one run.
 */
export function trackCount(lesson: Lesson): number {
  return lesson.steps.reduce((max, s) => Math.max(max, variantCount(s)), 1)
}

/**
 * Merge the chosen track's variant content over the base step. Track 0 is the
 * base step; 1..N select a variant. The step's identity (id, type, phase) is
 * always preserved so progress tracking stays stable across versions. Steps
 * with no variant for the requested track fall back to the base.
 */
export function resolveStep(step: Step, track: number): Step {
  const variants = step.variants
  if (!variants || track <= 0 || track > variants.length) return step
  const v = variants[track - 1]
  return {
    ...step,
    ...v,
    id: step.id,
    type: step.type,
    phase: step.phase,
    variants: step.variants,
  } as Step
}

/**
 * Produce a lightly-varied copy of a lesson for one run. This is the local,
 * no-network "freshness" pass (same spirit as the procedural enemy AI): it
 * doesn't invent new content, it just (a) resolves every step to the chosen
 * authored case track and (b) shuffles the answer order on choice questions, so
 * players can't memorize "the answer is always B" or the exact wording.
 */
export function varyLesson(lesson: Lesson, track: number): Lesson {
  return { ...lesson, steps: lesson.steps.map((step) => varyStep(step, track)) }
}

/**
 * Resolve a single step to a track and shuffle its answer order (choice steps).
 * Same "freshness" pass as varyLesson, applied per step so puzzle quizzes can be
 * assembled from individual questions across tracks.
 */
export function varyStep(step: Step, track: number): Step {
  const resolved = resolveStep(step, track)
  if (CHOICE_TYPES.has(resolved.type) && 'choices' in resolved) {
    const cs = resolved as ChoiceStep
    return { ...cs, choices: shuffle(cs.choices) } as Step
  }
  return resolved
}

/**
 * Choose a case track for a run. New players get a random track; on retry we
 * guarantee a different track than the previous run.
 */
export function pickTrack(lesson: Lesson, previous?: number): number {
  const total = trackCount(lesson)
  if (total <= 1) return 0
  if (previous === undefined || previous === null) {
    return Math.floor(Math.random() * total)
  }
  return (previous + 1 + Math.floor(Math.random() * (total - 1))) % total
}
