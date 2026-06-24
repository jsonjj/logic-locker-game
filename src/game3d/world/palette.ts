import type { RoomTheme } from '../contracts'

/**
 * [Agent 2] Shared low-poly color palette per theme. Used by the hub, room
 * shells, decor, and the minimap so a sector reads the same in 3D and on the
 * schematic. Kept as plain data (no three.js imports) so the DOM minimap can use
 * it too.
 */
export interface ThemePalette {
  /** Floor slab color. */
  floor: string
  /** Structural wall color. */
  wall: string
  /** Trim / furniture accent. */
  accent: string
  /** Emissive highlight (lights, screens, hazard glow). */
  glow: string
}

export const THEME_PALETTES: Record<RoomTheme, ThemePalette> = {
  yard: { floor: '#3d4550', wall: '#4d5765', accent: '#8893a4', glow: '#bcd0ff' },
  cellblock: { floor: '#363d47', wall: '#4b5562', accent: '#8a94a3', glow: '#ffd98f' },
  vault: { floor: '#343a43', wall: '#46505d', accent: '#c9a23a', glow: '#ffe89a' },
  surveillance: { floor: '#2c323b', wall: '#3e4753', accent: '#566270', glow: '#5ef0d0' },
  power: { floor: '#343a42', wall: '#47505b', accent: '#d2841f', glow: '#ffbe52' },
  control: { floor: '#2d343f', wall: '#3f4857', accent: '#5aa0e9', glow: '#9fe0ff' },
  classroom: { floor: '#3c434f', wall: '#505a69', accent: '#d8b25a', glow: '#ffeebb' },
}

export function paletteFor(theme: RoomTheme): ThemePalette {
  return THEME_PALETTES[theme] ?? THEME_PALETTES.cellblock
}
