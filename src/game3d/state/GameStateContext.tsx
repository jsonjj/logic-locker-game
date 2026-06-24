import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { GameStateValue, ObjectiveState, Vec3 } from '../contracts'
import { vec3 } from '../contracts'

const GameStateContext = createContext<GameStateValue | undefined>(undefined)

/**
 * Shared, cross-system game state for the 3D layer.
 *
 * Player position/heading are exposed as refs so high-frequency updates (every
 * animation frame) never trigger React re-renders — only discrete state like
 * the current objective, pause, and alarm level flow through useState.
 */
export function GameStateProvider({ children }: { children: ReactNode }) {
  const [objective, setObjective] = useState<ObjectiveState | null>(null)
  const [paused, setPaused] = useState(false)
  const [danger, setDanger] = useState(0)

  const playerPos = useRef<Vec3>(vec3(0, 0, 0))
  const playerHeading = useRef<number>(0)

  const value = useMemo<GameStateValue>(
    () => ({
      objective,
      setObjective,
      playerPos,
      playerHeading,
      paused,
      setPaused,
      danger,
      setDanger,
    }),
    [objective, paused, danger],
  )

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGameState(): GameStateValue {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error('useGameState must be used within a GameStateProvider')
  return ctx
}
