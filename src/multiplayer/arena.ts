/** Shared geometry + tuning for the multiplayer arena. */

/** Half-width of the square arena floor (world units). */
export const ARENA_HALF = 22

/** How many enemies the host keeps alive at once (round 1 baseline). */
export const TARGET_ALIVE = 16

/** Seconds between enemy spawns while under the target count (round 1). */
export const SPAWN_EVERY = 0.5

/** Enemy chase speed (m/s) and starting hit points. */
export const ENEMY_SPEED = 2.4
export const ENEMY_HP = 3

// --- Round-scaled horde --------------------------------------------------
// The arena gets dramatically busier every round: more enemies alive at once,
// spawning faster, and a touch tougher. This is what makes a strong loadout
// (and lessons-earned mastery) actually matter in the later rounds.
export const ALIVE_PER_ROUND = 9
export const MAX_ALIVE = 60
export const SPAWN_MIN = 0.16

/** Concurrent enemy cap for round `round` (1-based). */
export function aliveTargetForRound(round: number): number {
  return Math.min(MAX_ALIVE, TARGET_ALIVE + Math.max(0, round - 1) * ALIVE_PER_ROUND)
}
/** Spawn cadence (seconds) for round `round` — quickens as rounds climb. */
export function spawnEveryForRound(round: number): number {
  return Math.max(SPAWN_MIN, SPAWN_EVERY - Math.max(0, round - 1) * 0.06)
}
/** Enemy hit points for round `round` — creeps up slowly so guns must keep up. */
export function enemyHpForRound(round: number): number {
  return ENEMY_HP + Math.floor(Math.max(0, round - 1) / 2)
}

// --- Armed enemies (they shoot back) -------------------------------------
/** Fraction of spawned enemies that carry guns (30–50%). */
export const RANGED_FRACTION = 0.4
/** How far an armed enemy can open fire (world units). */
export const ENEMY_SHOOT_RANGE = 17
/** Below this distance, melee contact damage handles it — don't also shoot. */
export const ENEMY_MIN_SHOOT_DIST = 3.2
/** Seconds between an armed enemy's shots, plus up to JITTER extra. */
export const ENEMY_SHOOT_COOLDOWN = 2.4
export const ENEMY_SHOOT_JITTER = 1.3
/** Projectile travel speed (m/s) and the damage / hit radius on the player. */
export const ENEMY_PROJECTILE_SPEED = 13
export const ENEMY_PROJECTILE_DMG = 1
export const ENEMY_PROJECTILE_HIT_RADIUS = 0.85
/** Only the nearest N armed enemies actively shoot you (fairness + perf). */
export const ENEMY_MAX_SHOOTERS = 5

/** Host broadcasts enemy state at ~10Hz. */
export const ENEMY_NET_INTERVAL = 0.1

// --- Weapon (guns from the start in multiplayer) ---------------------------
export const SHOT_DAMAGE = 1
export const SHOT_RANGE = 18
export const SHOT_COOLDOWN_MS = 240
/** Auto-aim assist cone (radians) around the player's facing. */
export const AIM_CONE = Math.PI * 0.55

// --- Lives / respawn -------------------------------------------------------
/** Hits a player can take before going down. */
export const MAX_HP = 5
/** Contact range at which an enemy is "on" you. */
export const ENEMY_TOUCH_RANGE = 1.4
/** Seconds between contact-damage ticks per touching enemy. */
export const DAMAGE_INTERVAL = 0.7
/** Invulnerable window after (re)spawning, seconds. */
export const SPAWN_INVULN = 2
/** Base respawn delay, plus extra per prior death (slightly longer each time). */
export const RESPAWN_BASE_MS = 3000
export const RESPAWN_PER_DEATH_MS = 1500
export const RESPAWN_MAX_MS = 9000

export function respawnDelay(deaths: number): number {
  return Math.min(RESPAWN_MAX_MS, RESPAWN_BASE_MS + deaths * RESPAWN_PER_DEATH_MS)
}

// --- Rounds (first-to-N series) -------------------------------------------
export const ROUND_DURATION_MS = 75 * 1000
export const INTERMISSION_MS = 6 * 1000

/** Even spawn points around the arena center for up to 6 players. */
export function playerSpawn(index: number): { x: number; y: number; z: number } {
  const r = 9
  const a = (index / 6) * Math.PI * 2
  return { x: Math.sin(a) * r, y: 1.2, z: Math.cos(a) * r }
}
