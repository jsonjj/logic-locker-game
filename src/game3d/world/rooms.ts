import type { HubDef, RoomDef, RoomTheme, SectorId } from '../contracts'
import { vec3 } from '../contracts'
import { sectors } from '../../data/sectors'

/**
 * [Agent 2 owns this file] Layout DATA for the prison hub and each sector room.
 * Pure data — no three.js — so it can be consumed by the 3D scenes AND the DOM
 * minimap. `getRoomDef` and `hubDef` shapes are part of the cross-agent contract
 * and must stay stable.
 *
 * World units are meters. Rooms are centered on the origin: +z is the (sealed)
 * entrance side the player arrives on, -z is the far wall holding the exit door,
 * ±x are the side walls lined with themed dressing.
 */

// Theme per sector order (see src/data/sectors.ts for the narrative).
const THEMES: Record<number, RoomTheme> = {
  0: 'cellblock', // Holding Cells
  1: 'vault', // Records Vault
  2: 'surveillance', // Surveillance Hub
  3: 'cellblock', // Interrogation Wing (barred)
  4: 'power', // Power Grid
  5: 'control', // Control Spire
  6: 'control', // Warden's Antechamber
}

// Footprint [width, depth] per theme — all comfortably walkable (>= 20x18).
const THEME_SIZE: Record<RoomTheme, [number, number]> = {
  yard: [56, 56],
  cellblock: [24, 20],
  vault: [26, 20],
  surveillance: [22, 20],
  power: [26, 22],
  control: [24, 22],
  classroom: [24, 20],
}

function themeOf(order: number): RoomTheme {
  return THEMES[order] ?? 'cellblock'
}

function nextOf(id: SectorId): SectorId | 'hub' {
  const cur = sectors.find((s) => s.id === id)
  if (!cur) return 'hub'
  const next = sectors.find((s) => s.order === cur.order + 1)
  return next ? next.id : 'hub'
}

const roomDefs: Record<SectorId, RoomDef> = Object.fromEntries(
  sectors.map((s) => {
    const theme = themeOf(s.order)
    const [, d] = THEME_SIZE[theme]
    return [
      s.id,
      {
        sectorId: s.id,
        name: s.name,
        theme,
        size: THEME_SIZE[theme],
        // Spawn just inside the sealed entrance on the +z wall, facing the room.
        spawn: vec3(0, 1, d / 2 - 4),
        // Puzzle device sits in the middle, slightly toward the far wall.
        puzzleAnchor: vec3(0, 0, -1),
        // Exit/objective door centered on the far (-z) wall.
        exitDoor: {
          to: nextOf(s.id),
          position: vec3(0, 1.5, -d / 2 + 0.4),
          rotationY: 0,
          label: nextOf(s.id) === 'hub' ? 'Escape' : 'Exit',
        },
      } satisfies RoomDef,
    ]
  }),
) as Record<SectorId, RoomDef>

export function getRoomDef(sectorId: SectorId): RoomDef | undefined {
  return roomDefs[sectorId]
}

/** All room defs in sector order (handy for previews / integrator tooling). */
export const roomDefList: RoomDef[] = sectors.map((s) => roomDefs[s.id])

// ---------------------------------------------------------------------------
// Hub (the yard)
// ---------------------------------------------------------------------------

const HUB_SIZE: [number, number] = THEME_SIZE.yard
const [HUB_W, HUB_D] = HUB_SIZE
const HX = HUB_W / 2
const HZ = HUB_D / 2

/**
 * Seven sector entrances set against the inner faces of the perimeter wall so
 * the player can walk right up to each: three across the back, two per side.
 * Slots are assigned to sectors by order.
 */
const HUB_DOOR_SLOTS: { position: ReturnType<typeof vec3>; rotationY: number }[] = [
  { position: vec3(-15, 1.5, -HZ + 0.6), rotationY: 0 }, // back-left
  { position: vec3(0, 1.5, -HZ + 0.6), rotationY: 0 }, // back-center
  { position: vec3(15, 1.5, -HZ + 0.6), rotationY: 0 }, // back-right
  { position: vec3(-HX + 0.6, 1.5, -9), rotationY: Math.PI / 2 }, // left-back
  { position: vec3(-HX + 0.6, 1.5, 9), rotationY: Math.PI / 2 }, // left-front
  { position: vec3(HX - 0.6, 1.5, -9), rotationY: -Math.PI / 2 }, // right-back
  { position: vec3(HX - 0.6, 1.5, 9), rotationY: -Math.PI / 2 }, // right-front
]

/** The open-world hub: a yard with one walkable door per sector. */
export const hubDef: HubDef = {
  size: HUB_SIZE,
  // Spawn inside the hall so the fixed camera (on the +z side) stays within the
  // walls while the player faces the sector doors on the far wall.
  spawn: vec3(0, 1, HZ - 12),
  doors: sectors.map((s, i) => {
    const slot = HUB_DOOR_SLOTS[i % HUB_DOOR_SLOTS.length]
    return {
      to: s.id,
      position: slot.position,
      rotationY: slot.rotationY,
      label: s.name,
    }
  }),
}
