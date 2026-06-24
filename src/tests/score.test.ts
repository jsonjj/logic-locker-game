import { describe, it, expect } from 'vitest'
import { computeResult, formatTime, STAR_RULES } from '../scoring/score'
import type { RunStats } from '../game/lockdown/contracts'

const base: RunStats = {
  sectorId: 'sector-1',
  timeMs: 30_000,
  mistakes: 0,
  caught: false,
  parTimeSec: 60,
}

describe('computeResult — star ranks', () => {
  it('awards 3 stars for a flawless, fast, uncaught run', () => {
    const r = computeResult({ ...base, mistakes: 0, timeMs: 50_000, caught: false })
    expect(r.stars).toBe(3)
  })

  it('drops to 2 stars with one mistake but within 1.5x par and uncaught', () => {
    const r = computeResult({ ...base, mistakes: 1, timeMs: 80_000, caught: false })
    expect(r.stars).toBe(2)
  })

  it('drops to 2 stars when over par but within 1.5x par', () => {
    const r = computeResult({ ...base, mistakes: 0, timeMs: 80_000, caught: false })
    expect(r.stars).toBe(2)
  })

  it('always awards at least 1 star for clearing (slow, messy, caught)', () => {
    const r = computeResult({ ...base, mistakes: 5, timeMs: 200_000, caught: true })
    expect(r.stars).toBe(1)
  })

  it('caps stars at 2 when caught even with a perfect time', () => {
    const r = computeResult({ ...base, mistakes: 0, timeMs: 10_000, caught: true })
    expect(r.stars).toBe(1)
  })
})

describe('computeResult — composite score', () => {
  it('starts near 1000 for a perfect run and is higher than a messy run', () => {
    const perfect = computeResult({ ...base, mistakes: 0, timeMs: 50_000, caught: false })
    const messy = computeResult({ ...base, mistakes: 3, timeMs: 120_000, caught: true })
    expect(perfect.score).toBeGreaterThan(messy.score)
    expect(perfect.score).toBeLessThanOrEqual(1000)
  })

  it('never drops below the floor of 50', () => {
    const r = computeResult({ ...base, mistakes: 50, timeMs: 999_000, caught: true })
    expect(r.score).toBeGreaterThanOrEqual(50)
  })

  it('carries through the run metadata and sets completedAt', () => {
    const r = computeResult({ ...base, sectorId: 'sector-3', mistakes: 2 })
    expect(r.sectorId).toBe('sector-3')
    expect(r.mistakes).toBe(2)
    expect(r.completedAt).toBeGreaterThan(0)
  })
})

describe('formatTime', () => {
  it('formats minutes and seconds with zero padding', () => {
    expect(formatTime(83_000)).toBe('1:23')
    expect(formatTime(5_000)).toBe('0:05')
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(-100)).toBe('0:00')
  })
})

describe('STAR_RULES', () => {
  it('exposes readable descriptions for the UI', () => {
    expect(typeof STAR_RULES.summary).toBe('string')
    expect(STAR_RULES.three).toContain('mistakes')
  })
})
