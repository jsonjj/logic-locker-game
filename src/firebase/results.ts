/**
 * Per-player best LevelResult per sector (powers map star ranks + leaderboards).
 *
 * Stored at users/{uid}/results/{sectorId}, keeping the higher-scoring run.
 * Mirrors the Firestore patterns in ./progress.ts. All writes/reads are guarded
 * by `isFirebaseConfigured` so the app degrades gracefully without keys.
 */
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebaseConfig'
import type { LevelResult, SectorId } from '../game/lockdown/contracts'

function resultRef(uid: string, sectorId: SectorId) {
  return doc(db, 'users', uid, 'results', sectorId)
}

/**
 * Persist a run result as the player's best-of for that sector. A run only
 * overwrites the stored one when it scores higher. No-op when Firebase is
 * not configured.
 */
export async function saveLevelResult(uid: string, result: LevelResult): Promise<void> {
  if (!isFirebaseConfigured) return

  const ref = resultRef(uid, result.sectorId)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const existing = snap.data() as LevelResult
    if (existing.score >= result.score) return
  }
  await setDoc(ref, result)
}

/** Read all of the player's best results, keyed by sector id. Returns {} when unconfigured. */
export async function getLevelResults(uid: string): Promise<Record<SectorId, LevelResult>> {
  if (!isFirebaseConfigured) return {}

  const snap = await getDocs(collection(db, 'users', uid, 'results'))
  const results: Record<SectorId, LevelResult> = {}
  for (const d of snap.docs) {
    results[d.id] = d.data() as LevelResult
  }
  return results
}

/**
 * Wipe every stored level result for a player. Used on PRESTIGE: replays start
 * from room 1 with all sectors re-locked, so you must clear them again before
 * the Warden re-opens. Gear/upgrades live elsewhere and are untouched.
 */
export async function clearLevelResults(uid: string): Promise<void> {
  if (!isFirebaseConfigured) return
  const snap = await getDocs(collection(db, 'users', uid, 'results'))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}
