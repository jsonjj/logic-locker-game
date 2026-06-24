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
  /** If set, the shot detonates and damages every enemy within this radius (m). */
  aoe?: number
  // --- passive effects ---
  /** Extra lives granted while equipped (armor). */
  bonusLives?: number
  /** Movement speed multiplier while equipped (utility). */
  speedMult?: number
}

export const GEAR: Record<string, GearItem> = {
  popgun: {
    id: 'popgun',
    name: 'Popgun',
    slot: 'weapon',
    icon: '🫧',
    color: '#9aa3ad',
    desc: 'A toy-grade pop pistol. It fires, but barely — tiny range and a weak pop. Roll for something real.',
    weaponKind: 'ranged',
    damage: 1,
    range: 6.5,
    cooldownMs: 520,
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
  'plasma-pistol': {
    id: 'plasma-pistol',
    name: 'Scrap Pistol',
    slot: 'weapon',
    icon: '✨',
    color: '#46e0c0',
    desc: 'A cobbled-together sidearm. Ranged, but weak — chip away and keep moving.',
    weaponKind: 'ranged',
    damage: 1,
    range: 13,
    cooldownMs: 360,
  },
  'laser-rifle': {
    id: 'laser-rifle',
    name: 'Laser Rifle',
    slot: 'weapon',
    icon: '🔫',
    color: '#ff6a52',
    desc: 'Long-range beam that hits hard. Drop guards before they reach you.',
    weaponKind: 'ranged',
    damage: 3,
    range: 24,
    cooldownMs: 460,
  },
  'shock-emitter': {
    id: 'shock-emitter',
    name: 'Shock Emitter',
    slot: 'weapon',
    icon: '💥',
    color: '#b07cff',
    desc: 'Lobs a pulse that jolts every guard in a small blast. Crowd control — not a one-shot.',
    weaponKind: 'ranged',
    damage: 2,
    range: 16,
    cooldownMs: 950,
    aoe: 4.2,
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

/** The starting loadout (always owned) — a guaranteed but feeble gun. */
export const STARTER_WEAPON = 'popgun'

// Each sector's "signature" reward, indexed by order. You start with a weak
// gun and every cleared lesson spins the wheel below for a real upgrade; this
// list just gives each lesson a thematic headline prize weighted onto its wheel.
const REWARD_BY_ORDER = [
  'dagger', // 0 — fast melee
  'plasma-pistol', // 1 — a proper ranged sidearm
  'riot-armor', // 2 — survivability
  'stun-baton', // 3 — heavy melee
  'laser-rifle', // 4 — the real ranged payoff
  'energy-shield', // 5 — heavy armor
  'shock-emitter', // 6 — last block: the AoE crowd-clearer
]

export function rewardForSector(sectorId: string): GearItem | undefined {
  const s = sectors.find((x) => x.id === sectorId)
  if (!s) return undefined
  const id = REWARD_BY_ORDER[s.order]
  return id ? GEAR[id] : undefined
}

/**
 * Extra "mastery" gear, only handed out for a FLAWLESS (zero-mistake) clear.
 * Clean play literally makes you stronger/faster sooner than sloppy play does.
 */
const FLAWLESS_BONUS_BY_ORDER = [
  'combat-boots', // 0 — early speed for the deft
  'medkit', // 1 — a heal for the sharp
  // Later blocks: a flawless clear still grants +1 life (handled by the caller).
]

export function flawlessBonusForSector(sectorId: string): GearItem | undefined {
  const s = sectors.find((x) => x.id === sectorId)
  if (!s) return undefined
  const id = FLAWLESS_BONUS_BY_ORDER[s.order]
  return id ? GEAR[id] : undefined
}

/** Loose items the player can stumble on while exploring. No free guns. */
export const SCATTERED_PICKUPS = ['medkit', 'combat-boots'] as const

export function gear(id: string): GearItem | undefined {
  return GEAR[id]
}

// --- Reward wheel ----------------------------------------------------------
// Instead of a fixed drop, a clear spins a wheel of possible upgrades. Your
// performance bends the odds: a flawless run weights the wheel toward the
// stronger gear (and the block's signature reward), while a messy clear leans
// toward consolation utility. You still always KEEP whatever the wheel lands on.

export interface WheelEntry {
  item: GearItem
  weight: number
}

export function rewardWheel(
  sectorId: string,
  flawless: boolean,
  mistakes: number,
  owned: string[] = [],
): WheelEntry[] {
  const s = sectors.find((x) => x.id === sectorId)
  const tier = s?.order ?? 0 // 0..6 — later lessons roll better gear.
  const ownedSet = new Set(owned)
  const entries: WheelEntry[] = []
  const add = (id: string, weight: number) => {
    const it = GEAR[id]
    if (!it || weight <= 0 || entries.some((e) => e.item.id === id)) return
    // Heavily favor NEW unlocks so each lesson tends to hand you something you
    // don't already have — owned gear can still appear, just rarely.
    entries.push({ item: it, weight: ownedSet.has(id) ? weight * 0.12 : weight })
  }

  // The lesson's signature prize, weighted up (more so for a flawless clear).
  const base = rewardForSector(sectorId)
  if (base) add(base.id, flawless ? 6 : 5)

  // A generous spread of upgrades, with the strong gear scaling up by tier so
  // later lessons are "better or more" rewarding.
  add('plasma-pistol', 3) // easy early gun upgrade from the popgun
  add('dagger', 2)
  add('combat-boots', 2)
  add('riot-armor', 2 + tier * 0.4)
  add('medkit', mistakes > 0 ? 3 : 1.5)
  add('stun-baton', 1.5 + tier * 0.4)
  add('laser-rifle', (flawless ? 3 : 1.2) + tier * 0.7) // the payoff gun, likelier late
  add('energy-shield', 0.6 + tier * 0.6)
  add('shock-emitter', (flawless ? 1.5 : 0.5) + tier * 0.6)

  return entries
}

/** Pick a winning index from weighted entries. */
export function pickWeightedIndex(entries: WheelEntry[]): number {
  const total = entries.reduce((s, e) => s + e.weight, 0)
  let r = Math.random() * total
  for (let i = 0; i < entries.length; i++) {
    r -= entries[i].weight
    if (r <= 0) return i
  }
  return entries.length - 1
}
