import { useCallback, useEffect, useRef, useState } from 'react'
import type { PursuerState } from '../game/lockdown/contracts'

export interface PursuerControls {
  state: PursuerState
  start: () => void
  pause: () => void
  reset: () => void
  /**
   * Call when the player solves a step to push the pursuer back. `fraction`
   * is how much of the bar to relieve (defaults to a single-step nudge).
   */
  registerProgress: (fraction?: number) => void
}

export interface PursuerOptions {
  /** Soft time target; proximity reaches ~1 around here at difficulty 1. */
  parTimeSec: number
  /** Scales how fast the pursuer closes in. 1 = default. */
  difficulty?: number
}

/** Default relief applied per solved step when no fraction is supplied. */
const DEFAULT_STEP_RELIEF = 0.12

/**
 * Models a pursuer that closes in over time. Proximity rises with elapsed time
 * (scaled to reach ~1 at par time on difficulty 1) and is pushed back whenever
 * the player makes progress. Once proximity hits 1 the `caught` flag latches,
 * but gameplay is expected to continue (learning-safe pressure).
 */
export function usePursuer(opts: PursuerOptions): PursuerControls {
  const { parTimeSec, difficulty = 1 } = opts

  const [state, setState] = useState<PursuerState>({ proximity: 0, caught: false })

  // Total seconds-worth of "closing" pressure accrued so far.
  const baseProximityRef = useRef(0)
  const lastStampRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const caughtRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  // Proximity gained per second of elapsed time.
  const ratePerSec = (1 / Math.max(1, parTimeSec)) * Math.max(0.1, difficulty)

  const commit = useCallback((proximity: number) => {
    const clamped = Math.min(1, Math.max(0, proximity))
    if (clamped >= 1) caughtRef.current = true
    setState({ proximity: clamped, caught: caughtRef.current })
  }, [])

  const tick = useCallback(() => {
    if (!runningRef.current) return
    const now = performance.now()
    const last = lastStampRef.current ?? now
    const deltaSec = (now - last) / 1000
    lastStampRef.current = now
    baseProximityRef.current = Math.min(1.2, baseProximityRef.current + deltaSec * ratePerSec)
    commit(baseProximityRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [commit, ratePerSec])

  const start = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true
    lastStampRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const pause = useCallback(() => {
    runningRef.current = false
    lastStampRef.current = null
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    runningRef.current = false
    lastStampRef.current = null
    baseProximityRef.current = 0
    caughtRef.current = false
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setState({ proximity: 0, caught: false })
  }, [])

  const registerProgress = useCallback(
    (fraction: number = DEFAULT_STEP_RELIEF) => {
      baseProximityRef.current = Math.max(0, baseProximityRef.current - Math.abs(fraction))
      commit(baseProximityRef.current)
    },
    [commit],
  )

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { state, start, pause, reset, registerProgress }
}
