import { PLAYER_COLORS, type NetPlayer } from './types'

/**
 * Resolve each player's display color. Players may pick their own from the
 * palette in the lobby; if two collide (or someone hasn't picked), we fall back
 * to the first free palette color by join order so every avatar stays distinct.
 */
export function resolveColors(players: Record<string, NetPlayer>): Record<string, string> {
  const order = Object.values(players).sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
  const out: Record<string, string> = {}
  const taken = new Set<string>()

  // First pass: honor unique valid picks.
  for (const p of order) {
    if (p.color && PLAYER_COLORS.includes(p.color) && !taken.has(p.color)) {
      out[p.uid] = p.color
      taken.add(p.color)
    }
  }
  // Second pass: assign the next free palette color to everyone else.
  for (const p of order) {
    if (out[p.uid]) continue
    const free = PLAYER_COLORS.find((c) => !taken.has(c)) ?? PLAYER_COLORS[0]
    out[p.uid] = free
    taken.add(free)
  }
  return out
}

/** Backwards-compatible alias (join-order coloring is now pick-aware). */
export const colorByJoinOrder = resolveColors
