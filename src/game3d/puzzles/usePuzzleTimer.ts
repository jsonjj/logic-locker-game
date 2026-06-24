/**
 * [Agent 3] Tracks elapsed time for a puzzle run. The clock starts the first
 * time the hook mounts; call the returned getter to read milliseconds elapsed.
 */
import { useCallback, useRef } from 'react'

export function usePuzzleTimer(): () => number {
  const start = useRef(Date.now())
  return useCallback(() => Date.now() - start.current, [])
}
