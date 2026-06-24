import { useCallback, useEffect, useState } from 'react'
import type { LeaderboardEntry, LeaderboardScope } from '../game/lockdown/contracts'
import { isFirebaseConfigured } from '../firebase/firebaseConfig'
import { getGlobalLeaderboard, getSectorLeaderboard } from '../firebase/leaderboard'

export interface UseLeaderboardResult {
  entries: LeaderboardEntry[]
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Load a leaderboard for the given scope (global or a single sector).
 * Resilient by design: when Firebase is not configured, or a fetch fails, it
 * returns an empty list plus a friendly message instead of throwing.
 */
export function useLeaderboard(scope: LeaderboardScope, top = 20): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Capture primitive scope values so the loader's identity is stable.
  const kind = scope.kind
  const sectorId = scope.kind === 'sector' ? scope.sectorId : null

  const load = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setEntries([])
      setError('Leaderboards are offline. Add Firebase keys to start competing.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data =
        kind === 'sector' && sectorId
          ? await getSectorLeaderboard(sectorId, top)
          : await getGlobalLeaderboard(top)
      setEntries(data)
    } catch (e) {
      // Surface the real cause (e.g. Firestore "permission-denied" => rules not
      // deployed) so it's debuggable, while keeping a friendly UI message.
      console.error('[leaderboard] load failed:', e)
      setEntries([])
      const code = (e as { code?: string })?.code
      if (code === 'permission-denied') {
        setError('Leaderboard access was denied. Deploy the Firestore rules (firestore.rules) to enable it.')
      } else {
        setError('Could not load the leaderboard. Check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [kind, sectorId, top])

  useEffect(() => {
    void load()
  }, [load])

  return { entries, loading, error, refresh: load }
}
