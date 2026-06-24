import { useCallback, useEffect, useRef, useState } from 'react'

export interface RunTimer {
  /** Elapsed run time in milliseconds. */
  timeMs: number
  running: boolean
  start: () => void
  stop: () => void
  reset: () => void
}

/**
 * A cheap run timer driven by requestAnimationFrame + performance.now().
 * Accumulates elapsed time across start/stop cycles so pausing is supported.
 */
export function useRunTimer(): RunTimer {
  const [timeMs, setTimeMs] = useState(0)
  const [running, setRunning] = useState(false)

  // Persisted across renders without retriggering effects.
  const accumulatedRef = useRef(0)
  const startStampRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    if (startStampRef.current == null) return
    const now = performance.now()
    setTimeMs(accumulatedRef.current + (now - startStampRef.current))
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    if (startStampRef.current != null) return // already running
    startStampRef.current = performance.now()
    setRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    if (startStampRef.current == null) return
    accumulatedRef.current += performance.now() - startStampRef.current
    startStampRef.current = null
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setRunning(false)
    setTimeMs(accumulatedRef.current)
  }, [])

  const reset = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    accumulatedRef.current = 0
    startStampRef.current = null
    setRunning(false)
    setTimeMs(0)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { timeMs, running, start, stop, reset }
}
