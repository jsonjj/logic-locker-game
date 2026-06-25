/**
 * A flat pool of single-answer multiple-choice questions pulled from every
 * lesson, used for the between-rounds quiz in multiplayer. All clients resolve
 * the same `quizId` (an index into this pool) so everyone answers the same
 * question and results are comparable.
 */
import { lessons } from '../data/lessons'
import type { ChoiceStep } from '../types'

export interface QuizQuestion {
  prompt: string
  choices: { id: string; label: string }[]
  correctId: string
}

const CHOICE_TYPES = new Set(['multipleChoice', 'prediction', 'highlightChoice', 'symbolTap'])

function buildPool(): QuizQuestion[] {
  const out: QuizQuestion[] = []
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (!CHOICE_TYPES.has(step.type)) continue
      const s = step as ChoiceStep
      if (!s.choices || s.choices.length < 2 || !s.correctAnswer) continue
      if (!s.choices.some((c) => c.id === s.correctAnswer)) continue
      out.push({
        prompt: s.prompt,
        choices: s.choices.map((c) => ({ id: c.id, label: c.label })),
        correctId: s.correctAnswer,
      })
    }
  }
  return out
}

export const QUIZ_POOL: QuizQuestion[] = buildPool()
export const QUIZ_COUNT = QUIZ_POOL.length

/** Resolve a quiz index (wraps; safe even if the pool is small). */
export function getQuizQuestion(index: number): QuizQuestion | null {
  if (QUIZ_COUNT === 0) return null
  return QUIZ_POOL[((index % QUIZ_COUNT) + QUIZ_COUNT) % QUIZ_COUNT]
}

/** Pick a random quiz index to broadcast for the next intermission. */
export function randomQuizId(): number {
  return QUIZ_COUNT > 0 ? Math.floor(Math.random() * QUIZ_COUNT) : 0
}
