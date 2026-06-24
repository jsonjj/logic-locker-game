import { describe, it, expect } from 'vitest'
import { lessons } from '../data/lessons'
import { trackCount, resolveStep } from '../logic/variants'
import { evaluateRule } from '../logic/switchLogic'
import { isInteractiveStep } from '../logic/stepUtils'
import type { Step } from '../types'

/** Validate that a single resolved step has a self-consistent, solvable answer key. */
function validateStep(step: Step, where: string) {
  switch (step.type) {
    case 'multipleChoice':
    case 'prediction':
    case 'highlightChoice':
    case 'symbolTap': {
      const ids = step.choices.map((c) => c.id)
      expect(ids.length, `${where}: needs choices`).toBeGreaterThan(1)
      expect(new Set(ids).size, `${where}: duplicate choice ids`).toBe(ids.length)
      expect(ids, `${where}: correctAnswer not a choice`).toContain(step.correctAnswer)
      break
    }
    case 'clueSort': {
      const cardIds = step.cards.map((c) => c.id).sort()
      const answerIds = Object.keys(step.correctAnswer).sort()
      expect(answerIds, `${where}: answer keys must match card ids`).toEqual(cardIds)
      for (const [card, cat] of Object.entries(step.correctAnswer)) {
        expect(step.categories, `${where}: card ${card} -> unknown category ${cat}`).toContain(cat)
      }
      break
    }
    case 'deductionGrid':
    case 'miniGrid': {
      const { rows, cols, correctAnswer } = step
      for (const [row, cells] of Object.entries(correctAnswer)) {
        expect(rows, `${where}: unknown row ${row}`).toContain(row)
        for (const [col, sym] of Object.entries(cells)) {
          expect(cols, `${where}: unknown col ${col}`).toContain(col)
          expect(['X', 'check'], `${where}: bad symbol ${sym}`).toContain(sym)
        }
      }
      // A full deduction grid must be a valid one-to-one matching.
      if (step.type === 'deductionGrid') {
        for (const row of rows) {
          const checks = cols.filter((c) => correctAnswer[row]?.[c] === 'check')
          expect(checks.length, `${where}: row ${row} must have exactly one check`).toBe(1)
        }
        for (const col of cols) {
          const checks = rows.filter((r) => correctAnswer[r]?.[col] === 'check')
          expect(checks.length, `${where}: col ${col} must have exactly one check`).toBe(1)
        }
      }
      break
    }
    case 'singleCellGrid': {
      expect(step.rows, `${where}: targetRow not in rows`).toContain(step.targetRow)
      expect(step.cols, `${where}: targetCol not in cols`).toContain(step.targetCol)
      expect(['X', 'check'], `${where}: bad target symbol`).toContain(step.correctAnswer)
      break
    }
    case 'logicSwitches': {
      const switchIds = new Set(step.switches.map((s) => s.id))
      const usedIds = new Set<string>()
      const collect = (rule: typeof step.rule) => {
        if (rule.kind === 'var') usedIds.add(rule.id)
        else if (rule.kind === 'not') collect(rule.operand)
        else rule.operands.forEach(collect)
      }
      collect(step.rule)
      for (const id of usedIds) {
        expect(switchIds.has(id), `${where}: rule uses unknown switch ${id}`).toBe(true)
      }
      if (step.expectedSolution) {
        for (const id of Object.keys(step.expectedSolution)) {
          expect(switchIds.has(id), `${where}: expectedSolution has unknown switch ${id}`).toBe(true)
        }
        expect(
          evaluateRule(step.rule, step.expectedSolution),
          `${where}: expectedSolution does not satisfy the rule`,
        ).toBe(step.correctAnswer)
      }
      break
    }
    case 'ordering': {
      const ids = step.items.map((i) => i.id)
      expect(step.correctAnswer.slice().sort(), `${where}: order must be a permutation of items`).toEqual(
        ids.slice().sort(),
      )
      break
    }
    default:
      break
  }
}

describe('lesson content integrity', () => {
  for (const lesson of lessons) {
    it(`${lesson.id}: base and every variant track is valid`, () => {
      const tracks = trackCount(lesson)
      for (let track = 0; track < tracks; track++) {
        for (const base of lesson.steps) {
          const step = resolveStep(base, track)
          validateStep(step, `${lesson.id}/${base.id}@track${track}`)
        }
      }
    })

    it(`${lesson.id}: every interactive question has an alternate version`, () => {
      expect(
        trackCount(lesson),
        `${lesson.id} should offer at least 2 case tracks`,
      ).toBeGreaterThanOrEqual(2)
      for (const step of lesson.steps) {
        if (isInteractiveStep(step)) {
          expect(
            (step.variants?.length ?? 0) >= 1,
            `${lesson.id}/${step.id} is missing an alternate version`,
          ).toBe(true)
        }
      }
    })
  }
})
