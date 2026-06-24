/**
 * Competitive leaderboards for "Logic Locker: Lockdown" (Agent E).
 *
 * Two Firestore collections back the boards:
 *   - 'leaderboard'        per-sector best run, one doc per (sector, player)
 *                          with id `${sectorId}__${uid}`. sectorId is set.
 *   - 'leaderboardGlobal'  one aggregate doc per player, id `${uid}`, whose
 *                          score is the sum of that player's best per-sector
 *                          scores. sectorId is null.
 *
 * Every doc satisfies the shared LeaderboardEntry contract. All Firestore
 * access is guarded by isFirebaseConfigured so the game still runs (with empty
 * boards) when keys are absent.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebaseConfig'
import type { LeaderboardEntry, SectorId, StarRank } from '../game/lockdown/contracts'

const SECTOR_COLLECTION = 'leaderboard'
const GLOBAL_COLLECTION = 'leaderboardGlobal'

/** Per-sector doc id keeps exactly one best run per (sector, player). */
function sectorDocId(sectorId: SectorId, uid: string): string {
  return `${sectorId}__${uid}`
}

/** Keep an aggregated star value inside the StarRank (0..3) contract. */
function clampStars(value: number): StarRank {
  const rounded = Math.round(value)
  if (rounded <= 0) return 0
  if (rounded >= 3) return 3
  return rounded as StarRank
}

export interface SubmitScoreInput {
  uid: string
  displayName: string
  avatarId: string
  sectorId: SectorId
  score: number
  stars: StarRank
  timeMs: number
}

/**
 * Record a finished run. The per-sector entry is only overwritten when the new
 * run beats the stored best score; the global aggregate is then recomputed from
 * the player's best per-sector entries so it always stays correct.
 */
export async function submitScore(input: SubmitScoreInput): Promise<void> {
  if (!isFirebaseConfigured) return

  const { uid, displayName, avatarId, sectorId, score, stars, timeMs } = input
  const sectorRef = doc(db, SECTOR_COLLECTION, sectorDocId(sectorId, uid))

  const existingSnap = await getDoc(sectorRef)
  const existing = existingSnap.exists() ? (existingSnap.data() as LeaderboardEntry) : null

  if (!existing || score > existing.score) {
    const entry: LeaderboardEntry = {
      uid,
      displayName,
      avatarId,
      sectorId,
      score,
      stars,
      timeMs,
      updatedAt: Date.now(),
    }
    await setDoc(sectorRef, entry)
  } else if (existing.displayName !== displayName || existing.avatarId !== avatarId) {
    // Keep the better score but refresh the player's identity if it changed.
    await setDoc(sectorRef, { displayName, avatarId, updatedAt: Date.now() }, { merge: true })
  }

  await recomputeGlobal(uid, displayName, avatarId)
}

/** Rebuild the player's global aggregate from all their per-sector best runs. */
async function recomputeGlobal(
  uid: string,
  displayName: string,
  avatarId: string,
): Promise<void> {
  const snap = await getDocs(query(collection(db, SECTOR_COLLECTION), where('uid', '==', uid)))

  let totalScore = 0
  let totalStars = 0
  let totalTimeMs = 0
  snap.forEach((d) => {
    const entry = d.data() as LeaderboardEntry
    totalScore += entry.score ?? 0
    totalStars += entry.stars ?? 0
    totalTimeMs += entry.timeMs ?? 0
  })

  const globalEntry: LeaderboardEntry = {
    uid,
    displayName,
    avatarId,
    sectorId: null,
    score: totalScore,
    // Average rank across cleared sectors, so the row's star display stays meaningful.
    stars: clampStars(snap.size ? totalStars / snap.size : 0),
    // Total clear time across all cleared sectors.
    timeMs: totalTimeMs,
    updatedAt: Date.now(),
  }
  await setDoc(doc(db, GLOBAL_COLLECTION, uid), globalEntry)
}

/**
 * Top runs for a single sector, highest score first.
 *
 * Uses an equality filter and sorts/limits client-side so no composite
 * Firestore index is required (board sizes here are small).
 */
export async function getSectorLeaderboard(
  sectorId: SectorId,
  top = 20,
): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured) return []
  const snap = await getDocs(
    query(collection(db, SECTOR_COLLECTION), where('sectorId', '==', sectorId)),
  )
  return snap.docs
    .map((d) => d.data() as LeaderboardEntry)
    .sort(rankComparator)
    .slice(0, top)
}

/**
 * Top players across every sector, highest total score first.
 *
 * Sorts/limits client-side (no orderBy) so it never depends on a Firestore
 * index being present — boards here are small.
 */
export async function getGlobalLeaderboard(top = 20): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured) return []
  const snap = await getDocs(collection(db, GLOBAL_COLLECTION))
  return snap.docs
    .map((d) => d.data() as LeaderboardEntry)
    .sort(rankComparator)
    .slice(0, top)
}

/** Higher score wins; ties broken by faster time, then earlier update. */
function rankComparator(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.score !== a.score) return b.score - a.score
  if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs
  return a.updatedAt - b.updatedAt
}
