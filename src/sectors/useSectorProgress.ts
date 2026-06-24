import { useCallback, useEffect, useState } from 'react'
import type { LevelResult, SectorView } from '../game/lockdown/contracts'
import { sectors } from '../data/sectors'
import { getLevelResults } from '../firebase/results'
import { useAuth } from '../context/AuthContext'

interface SectorProgress {
  views: SectorView[]
  loading: boolean
  refresh: () => void
}

/** Derive SectorView[] from the static sector list + the player's best results. */
function buildViews(results: Record<string, LevelResult>): SectorView[] {
  return sectors.map((sector) => {
    const bestResult = results[sector.id] ?? null
    const unlockedByPrev =
      sector.unlockAfter !== null && Boolean(results[sector.unlockAfter])
    const isUnlocked = sector.order === 0 || unlockedByPrev

    const state: SectorView['state'] = bestResult
      ? 'cleared'
      : isUnlocked
        ? 'unlocked'
        : 'locked'

    return { ...sector, state, bestResult }
  })
}

/**
 * Loads the signed-in player's best results and projects them onto the fortress
 * sectors as locked / unlocked / cleared views. With no user (or before results
 * load) only the first sector is unlocked.
 */
export function useSectorProgress(): SectorProgress {
  const { user } = useAuth()
  const [views, setViews] = useState<SectorView[]>(() => buildViews({}))
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false

    if (!user) {
      setViews(buildViews({}))
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    setLoading(true)
    getLevelResults(user.uid)
      .then((results) => {
        if (cancelled) return
        setViews(buildViews(results))
      })
      .catch(() => {
        if (cancelled) return
        setViews(buildViews({}))
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, nonce])

  return { views, loading, refresh }
}
