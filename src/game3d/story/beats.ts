import type { DialogueLine, SectorId } from '../contracts'
import { sectors } from '../../data/sectors'

/**
 * [Agent 4] Narrative source-of-truth for "Logic Locker: Breakout".
 *
 * The player is a captured agent. Their mentor AKASH is held in the deepest
 * cell block of a prison run by the Warden. Every locked block is a reasoning
 * puzzle; cracking it opens the door one step deeper toward Akash. This file
 * holds the story text (capture intro, ending, and per-sector flavor) and a few
 * small helpers. `objectives.ts` composes HUD one-liners from this data, and the
 * integrator/HUD may optionally surface the intro/ending lines in a cutscene.
 *
 * Keep tone adventurous, hopeful, and middle-school appropriate.
 */

/** The deepest sector index — that's where the Warden keeps Akash. */
const deepestOrder = sectors.reduce((max, s) => Math.max(max, s.order), 0)

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

function spellOut(n: number): string {
  return numberWords[n] ?? String(n)
}

/**
 * How far Akash is from the block you're about to break into. `order` is the
 * order of the sector you're entering; Akash sits in the deepest sector.
 */
export function akashDistancePhrase(order: number): string {
  const doors = deepestOrder - order
  if (doors <= 0) return 'Akash is right behind this door'
  if (doors === 1) return 'Akash is one door deeper'
  return `Akash is ${spellOut(doors)} doors deeper`
}

/** Per-sector flavor used to vary the HUD objective text. */
export interface SectorBeat {
  sectorId: SectorId
  /** Imperative used when approaching this block from the yard. */
  breach: string
  /** Shown while the lock is still uncracked, inside the room. */
  solve: string
  /** Shown once the lock cracks and the door swings open. */
  exit: string
  /** A short Akash radio whisper after the block is cleared. */
  whisper: string
}

const SECTOR_BEATS: Record<string, SectorBeat> = {
  'lesson-1': {
    sectorId: 'lesson-1',
    breach: 'Break out of Sector 1 · Holding Cells',
    solve: 'Sort fact from guess and pop the cuff lock',
    exit: 'Cuffs off — slip out of holding before roll call',
    whisper: 'Akash: "Good. You can tell a fact from a hunch. Keep moving."',
  },
  'lesson-2': {
    sectorId: 'lesson-2',
    breach: 'Break into Sector 2 · Records Vault',
    solve: "Read the case grid — ✓, ✕, blank — to release the vault",
    exit: 'Vault open — get out before the files relock',
    whisper: 'Akash: "You read the grid like I taught you. One door closer."',
  },
  'lesson-3': {
    sectorId: 'lesson-3',
    breach: 'Break into Sector 3 · Surveillance Hub',
    solve: 'Lock one camera match and let the X cascade run',
    exit: 'Cameras blind — move before the feed resets',
    whisper: 'Akash: "One confirmed match, a wave of eliminations. Sharp."',
  },
  'lesson-4': {
    sectorId: 'lesson-4',
    breach: 'Break into Sector 4 · Interrogation Wing',
    solve: "Test the Warden's story and reject every contradiction",
    exit: 'Story broken — push through before the guards regroup',
    whisper: 'Akash: "You caught the lie in his story. We\u2019re getting close."',
  },
  'lesson-5': {
    sectorId: 'lesson-5',
    breach: 'Break into Sector 5 · Power Grid',
    solve: 'Bend AND, OR, and NOT to cut the blast-door locks',
    exit: 'Power rerouted — run while the doors hang open',
    whisper: 'Akash: "Logic gates bent to your will. Almost there, kid."',
  },
  'lesson-6': {
    sectorId: 'lesson-6',
    breach: 'Break into Sector 6 · Control Spire',
    solve: 'Stack every reasoning step in order to seize control',
    exit: 'Spire is yours — take the last stairs down to Akash',
    whisper: 'Akash: "You built the whole case in order. One door left."',
  },
  'lesson-7': {
    sectorId: 'lesson-7',
    breach: "Reach Sector 7 · Warden's Antechamber",
    solve: 'Use every skill at once to break the Warden\u2019s last lock',
    exit: 'The final lock is open — walk Akash out the front gate',
    whisper: 'Akash: "You came all this way for me. Let\u2019s go home."',
  },
}

/** Per-sector narrative flavor, or undefined for an unknown sector. */
export function getSectorBeat(sectorId: SectorId): SectorBeat | undefined {
  return SECTOR_BEATS[sectorId]
}

/** The capture cutscene shown before the first block. */
export const INTRO_LINES: DialogueLine[] = [
  {
    speaker: 'self',
    name: 'You',
    text: 'Cuffs. Cold concrete. A door that only opens for the right answer.',
    mood: 'tense',
  },
  {
    speaker: 'warden',
    name: 'The Warden',
    text: 'Welcome to my prison, agent. Your mentor is seven blocks down, and every lock is a puzzle you will never solve.',
    mood: 'taunt',
  },
  {
    speaker: 'akash',
    name: 'Akash',
    text: "I'm still here, kid — keep your head. Every door is just a question. Answer it and walk through. One block at a time.",
    mood: 'warm',
  },
  {
    speaker: 'self',
    name: 'You',
    text: 'Seven blocks between me and Akash. Time to start reasoning my way down.',
    mood: 'urgent',
  },
]

/** The ending cutscene shown after the deepest block is cleared. */
export const ENDING_LINES: DialogueLine[] = [
  { speaker: 'self', name: 'You', text: 'Last lock. Last door.', mood: 'urgent' },
  {
    speaker: 'akash',
    name: 'Akash',
    text: "...You actually did it. Reasoned your way through the whole fortress. I taught you well — don't let it go to your head.",
    mood: 'warm',
  },
  { speaker: 'warden', name: 'The Warden', text: 'This is not over—', mood: 'tense' },
  {
    speaker: 'self',
    name: 'You',
    text: "It is. We're walking out the front gate, together.",
    mood: 'neutral',
  },
]

/** Optional helper: a one-line mission framing for menus/loading screens. */
export const MISSION_TAGLINE =
  'Reason your way through seven locked blocks and free Akash from the Warden.'
