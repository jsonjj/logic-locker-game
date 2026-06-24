import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface RunValue {
  lives: number
  maxLives: number
  isGameOver: boolean
  /** Lose one life. Returns the remaining life count. */
  loseLife: () => number
  /** Heal up to maxLives. */
  gainLife: (n?: number) => void
  /** Start/refresh a run with a given maximum life count (also full-heals). */
  startRun: (maxLives: number) => void
}

const BASE_LIVES = 3

const RunContext = createContext<RunValue | undefined>(undefined)

export function RunProvider({ children }: { children: ReactNode }) {
  const [maxLives, setMaxLives] = useState(BASE_LIVES)
  const [lives, setLives] = useState(BASE_LIVES)

  const loseLife = useCallback((): number => {
    let remaining = 0
    setLives((l) => {
      remaining = Math.max(0, l - 1)
      return remaining
    })
    return remaining
  }, [])

  const gainLife = useCallback(
    (n = 1) => {
      setLives((l) => Math.min(maxLives, l + n))
    },
    [maxLives],
  )

  const startRun = useCallback((max: number) => {
    const m = Math.max(1, max)
    setMaxLives(m)
    setLives(m)
  }, [])

  const value = useMemo<RunValue>(
    () => ({ lives, maxLives, isGameOver: lives <= 0, loseLife, gainLife, startRun }),
    [lives, maxLives, loseLife, gainLife, startRun],
  )

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRun(): RunValue {
  const ctx = useContext(RunContext)
  if (!ctx) throw new Error('useRun must be used within a RunProvider')
  return ctx
}
