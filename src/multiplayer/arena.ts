/** Shared geometry + tuning for the multiplayer arena. */

/** Half-width of the square arena floor (world units). */
export const ARENA_HALF = 22

/** How many enemies the host keeps alive at once. */
export const TARGET_ALIVE = 10

/** Seconds between enemy spawns while under the target count. */
export const SPAWN_EVERY = 1.0

/** Enemy chase speed (m/s) and starting hit points. */
export const ENEMY_SPEED = 2.4
export const ENEMY_HP = 3

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
