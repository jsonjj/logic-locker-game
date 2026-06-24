import { sectors } from '../../data/sectors'

export type GearSlot = 'weapon' | 'armor' | 'utility'
export type WeaponKind = 'ranged' | 'melee'

export interface GearItem {
  id: string
  name: string
  slot: GearSlot
  /** Emoji icon used in the inventory UI / pickups. */
  icon: string
  desc: string
  color: string
  // --- weapon stats (slot === 'weapon') ---
  weaponKind?: WeaponKind
  damage?: number
  /** Reach in meters. */
  range?: number
  cooldownMs?: number
  // --- passive effects ---
  /** Extra lives granted while equipped (armor). */
  bonusLives?: number
  /** Movement speed multiplier while equipped (utility). */
  speedMult?: number
}

export const GEAR: Record<string, GearItem> = {
  fists: {
    id: 'fists',
    name: 'Bare Fists',
    slot: 'weapon',
    icon: '👊',
    color: '#c7cdd6',
    desc: 'No gear. Short reach, slow swings — better than nothing.',
    weaponKind: 'melee',
    damage: 1,
    range: 2.2,
    cooldownMs: 600,
  },
  dagger: {
    id: 'dagger',
    name: 'Shiv Dagger',
    slot: 'weapon',
    icon: '🗡️',
    color: '#9fe0ff',
    desc: 'Fast, quiet melee. Great for close guards.',
    weaponKind: 'melee',
    damage: 2,
    range: 2.6,
    cooldownMs: 360,
  },
  'stun-baton': {
    id: 'stun-baton',
    name: 'Stun Baton',
    slot: 'weapon',
    icon: '🔋',
    color: '#ffe08a',
    desc: 'Heavy melee with a wide arc — staggers tougher guards.',
    weaponKind: 'melee',
    damage: 3,
    range: 3,
    cooldownMs: 480,
  },
  'laser-rifle': {
    id: 'laser-rifle',
    name: 'Laser Rifle',
    slot: 'weapon',
    icon: '🔫',
    color: '#ff6a52',
    desc: 'Long-range beam. Drop guards before they reach you.',
    weaponKind: 'ranged',
    damage: 3,
    range: 24,
    cooldownMs: 520,
  },
  'plasma-pistol': {
    id: 'plasma-pistol',
    name: 'Plasma Pistol',
    slot: 'weapon',
    icon: '✨',
    color: '#46e0c0',
    desc: 'Quick ranged shots at medium range.',
    weaponKind: 'ranged',
    damage: 2,
    range: 16,
    cooldownMs: 320,
  },
  'riot-armor': {
    id: 'riot-armor',
    name: 'Riot Armor',
    slot: 'armor',
    icon: '🛡️',
    color: '#8fb6ff',
    desc: 'Plated vest. Soak one extra hit before you go down.',
    bonusLives: 1,
  },
  'energy-shield': {
    id: 'energy-shield',
    name: 'Energy Shield',
    slot: 'armor',
    icon: '🟦',
    color: '#7fd2ff',
    desc: 'Personal barrier. Grants two extra hits.',
    bonusLives: 2,
  },
  'combat-boots': {
    id: 'combat-boots',
    name: 'Combat Boots',
    slot: 'utility',
    icon: '🥾',
    color: '#c2741f',
    desc: 'Sprint hardware. Move noticeably faster.',
    speedMult: 1.3,
  },
  medkit: {
    id: 'medkit',
    name: 'Field Medkit',
    slot: 'utility',
    icon: '🩹',
    color: '#5ee0a8',
    desc: 'Auto-stabilizer. Restores one life at the start of each room.',
    bonusLives: 1,
  },
}

/** The starting loadout (always owned). */
export const STARTER_WEAPON = 'fists'

// Reward handed out for clearing each sector, indexed by sector order.
const REWARD_BY_ORDER = [
  'dagger',
  'laser-rifle',
  'riot-armor',
  'stun-baton',
  'plasma-pistol',
  'combat-boots',
  'energy-shield',
]

export function rewardForSector(sectorId: string): GearItem | undefined {
  const s = sectors.find((x) => x.id === sectorId)
  if (!s) return undefined
  const id = REWARD_BY_ORDER[s.order]
  return id ? GEAR[id] : undefined
}

/** Loose items the player can stumble on while exploring. */
export const SCATTERED_PICKUPS = ['medkit', 'plasma-pistol', 'combat-boots'] as const

export function gear(id: string): GearItem | undefined {
  return GEAR[id]
}
