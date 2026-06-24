import type { Sector, SectorId } from '../game/lockdown/contracts'

/**
 * The fortress, sector by sector. The player fights INWARD from the outer
 * exit toward the Warden's Antechamber where Akash is held. Each sector maps
 * 1:1 to a lesson (sector.id === sector.lessonId) and unlocks only once the
 * previous sector has been cleared.
 */
export const sectors: Sector[] = [
  {
    id: 'lesson-1',
    lessonId: 'lesson-1',
    order: 0,
    name: 'Sector 1 · Holding Cells',
    blurb: 'Where the Warden dumps new captures. Learn what a clue can actually prove and slip your cuffs.',
    unlockAfter: null,
    parTimeSec: 90,
  },
  {
    id: 'lesson-2',
    lessonId: 'lesson-2',
    order: 1,
    name: 'Sector 2 · Records Vault',
    blurb: 'Rows of cold case files. Read the deduction grid — X, check, and blank — to find the way through.',
    unlockAfter: 'lesson-1',
    parTimeSec: 110,
  },
  {
    id: 'lesson-3',
    lessonId: 'lesson-3',
    order: 2,
    name: 'Sector 3 · Surveillance Hub',
    blurb: 'Every camera lies a little. One confirmed match forces a cascade of eliminations.',
    unlockAfter: 'lesson-2',
    parTimeSec: 130,
  },
  {
    id: 'lesson-4',
    lessonId: 'lesson-4',
    order: 3,
    name: 'Sector 4 · Interrogation Wing',
    blurb: "Test the Warden's story. When a guess breaks a clue, reject it and move on.",
    unlockAfter: 'lesson-3',
    parTimeSec: 150,
  },
  {
    id: 'lesson-5',
    lessonId: 'lesson-5',
    order: 4,
    name: 'Sector 5 · Power Grid',
    blurb: 'Sealed blast doors run on logic gates. Bend AND, OR, and NOT to cut the locks.',
    unlockAfter: 'lesson-4',
    parTimeSec: 170,
  },
  {
    id: 'lesson-6',
    lessonId: 'lesson-6',
    order: 5,
    name: 'Sector 6 · Control Spire',
    blurb: 'The fortress brain. Stack every reasoning step in a valid order to seize control.',
    unlockAfter: 'lesson-5',
    parTimeSec: 190,
  },
  {
    id: 'lesson-7',
    lessonId: 'lesson-7',
    order: 6,
    name: "Sector 7 · Warden's Antechamber",
    blurb: 'The last door before Akash. Combine every skill you have to break the Warden and walk him out.',
    unlockAfter: 'lesson-6',
    parTimeSec: 210,
  },
]

/** Look up a sector by its id. */
export function getSector(id: SectorId): Sector | undefined {
  return sectors.find((s) => s.id === id)
}

/** The sector immediately deeper in the fortress, or undefined if at the end. */
export function nextSector(id: SectorId): Sector | undefined {
  const current = getSector(id)
  if (!current) return undefined
  return sectors.find((s) => s.order === current.order + 1)
}

/** The outermost sector (nearest the exit), where every run begins. */
export const firstSector: Sector = sectors[0]
