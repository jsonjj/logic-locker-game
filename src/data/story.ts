/**
 * Story layer for "Logic Locker: Lockdown" (Agent B).
 *
 * The arc: you and your mentor Akash are captured by the Warden and locked
 * inside her fortress. You break free near the outer wall and have to fight
 * INWARD through seven sectors to reach the deepest cell where Akash is held.
 * The Warden taunts you over the comms; Akash coaches you on a stolen channel;
 * a fellow prisoner named Wren feeds you intel from the inside.
 *
 * Sectors map 1:1 to the seven lessons, so a beat's `sectorId` is a lessonId
 * ('lesson-1' is the outermost sector, 'lesson-7' is the final room with Akash).
 *
 * Types come from the shared, read-only contracts file.
 */
import type {
  DialogueLine,
  SectorId,
  StoryBeat,
  StoryBeatTrigger,
} from '../game/lockdown/contracts'

/** Speaker display names, kept consistent across every beat. */
const NAME = {
  self: 'You',
  akash: 'Akash',
  warden: 'The Warden',
  wren: 'Wren',
} as const

/** Small helpers so each line stays readable below. */
const you = (text: string, mood: DialogueLine['mood'] = 'neutral'): DialogueLine => ({
  speaker: 'self',
  name: NAME.self,
  text,
  mood,
})

const akash = (text: string, mood: DialogueLine['mood'] = 'warm'): DialogueLine => ({
  speaker: 'akash',
  name: NAME.akash,
  text,
  mood,
})

const warden = (text: string, mood: DialogueLine['mood'] = 'taunt'): DialogueLine => ({
  speaker: 'warden',
  name: NAME.warden,
  text,
  mood,
})

const wren = (text: string, mood: DialogueLine['mood'] = 'tense'): DialogueLine => ({
  speaker: 'ally',
  name: NAME.wren,
  text,
  mood,
})

/**
 * Per-sector flavor. Each sector borrows the *idea* of its lesson without
 * turning the dialogue into a quiz: clues, grids, eliminations, contradictions,
 * logic gates, ordering, and finally the master lock.
 */
interface SectorFlavor {
  /** Fortress name shown in the taunts/coaching. */
  place: string
  before: DialogueLine[]
  after: DialogueLine[]
}

const SECTOR_FLAVOR: Record<SectorId, SectorFlavor> = {
  'lesson-1': {
    place: 'the Holding Cells',
    before: [
      warden('Awake already? The Holding Cells were built to keep little minds confused.'),
      akash("Don't let her rattle you. Start with what you can actually see — read every clue before you move."),
      you('A clue only proves what it proves. Got it. Opening the first door.', 'neutral'),
    ],
    after: [
      you('Cells are clear. The clues lined up just like you said.', 'neutral'),
      akash("That's it. You're thinking like a detective now. Keep going — I'm one sector deeper than I look.", 'warm'),
      warden('Beginner luck. The walls get smarter from here.', 'taunt'),
    ],
  },
  'lesson-2': {
    place: 'the Records Vault',
    before: [
      wren("Psst — Wren. I'm a prisoner too. The Vault locks use a grid: a check means yes, an X means no."),
      akash('Mark what you know for certain, leave the rest blank. A clean grid does half the work for you.'),
      warden('Snooping through my records? How rude.', 'taunt'),
    ],
    after: [
      you('Grid solved. Every cell marked, no guessing.', 'neutral'),
      wren('Nice. The patrol just rerouted away from you — keep moving while it lasts.', 'tense'),
      akash("Two sectors down. I can almost hear you through the wall.", 'warm'),
    ],
  },
  'lesson-3': {
    place: 'the Switchback Stairs',
    before: [
      akash("Remember the chain rule: one confirmed match forces a whole row and column of X's."),
      you('So one yes can knock out a dozen maybes. That speeds things up.', 'neutral'),
      warden('You think one right answer saves you? It only tightens the net.', 'taunt'),
    ],
    after: [
      you('One lock opened the rest. The whole stairwell fell into place.', 'neutral'),
      akash("Beautiful. You're not just guessing — you're proving.", 'warm'),
      warden('...Reset the inner alarms. Now.', 'tense'),
    ],
  },
  'lesson-4': {
    place: 'the Mirror Gallery',
    before: [
      wren('Careful — the Gallery feeds you lies on purpose. Some paths look right and aren\'t.'),
      akash("When a guess breaks even one clue, throw it out. A contradiction is proof you were wrong."),
      warden('Welcome to my favorite room. Pick the wrong door and we both have a laugh.', 'taunt'),
    ],
    after: [
      you('Found the lie. The wrong path clashed with the clues, so I dropped it.', 'neutral'),
      akash('You tested it instead of trusting it. That is exactly the skill.', 'warm'),
      wren('Halfway in now. Stay sharp — she\'s watching the deep sectors herself.', 'tense'),
    ],
  },
  'lesson-5': {
    place: 'the Power Spine',
    before: [
      akash('The Spine runs on logic gates. AND needs both. OR needs at least one. NOT flips it.'),
      you('So I have to feed each gate the right signal to open the way.', 'neutral'),
      warden('Touch my power and the whole sector goes dark — with you inside it.', 'urgent'),
    ],
    after: [
      you('Gates aligned. AND, OR, NOT — power rerouted, door open.', 'neutral'),
      wren('The lights flickered fortress-wide! You just shook her whole operation.', 'tense'),
      akash("Two more sectors. Don't slow down now.", 'urgent'),
    ],
  },
  'lesson-6': {
    place: 'the Command Bridge',
    before: [
      warden("So you reached my Bridge. Impressive. It won't matter.", 'tense'),
      akash('This lock wants your reasoning in order. Lay the steps out so each one earns the next.'),
      you("Build the case, step by step. No skipping. I can do that.", 'neutral'),
    ],
    after: [
      you('Bridge is mine. Every step in the right order, start to finish.', 'urgent'),
      akash("You're right outside, I can feel it. One door left.", 'warm'),
      warden('Guards — fall back to the master lock. We end this where I keep him.', 'urgent'),
    ],
  },
  'lesson-7': {
    place: 'the Master Lock',
    before: [
      warden('The Master Lock holds everything I value — including your precious mentor.', 'tense'),
      akash("I'm right here. Use every skill at once: read, mark, eliminate, test, gate, order. You've got this."),
      you("All of it, together. Hang on, Akash — I'm coming through.", 'urgent'),
    ],
    after: [
      you('The lock just gave. The cell door is swinging open!', 'urgent'),
      akash('You did it. You actually did it.', 'warm'),
      warden('...This fortress was supposed to be unbeatable.', 'tense'),
    ],
  },
}

/** The capture cutscene that plays before the first sector. */
const introBeat: StoryBeat = {
  id: 'beat-intro',
  trigger: { kind: 'intro' },
  lines: [
    akash("Stay close. This place feels wrong — too quiet, too clean.", 'tense'),
    you('Akash, the doors behind us just locked. All of them.', 'urgent'),
    warden('Welcome to my fortress. I am the Warden, and you walked right in.', 'taunt'),
    warden('Take the old one to the deepest cell. The young one can watch.', 'tense'),
    akash("Don't follow them! Get out while you — let go of me!", 'urgent'),
    you('No! Akash!', 'urgent'),
    you('...They left me in the outer dark. Big mistake.', 'tense'),
    you("I'm coming for you, Akash. Sector by sector, lock by lock.", 'urgent'),
  ],
}

/** The ending beat that plays after the final sector is cleared. */
const endingBeat: StoryBeat = {
  id: 'beat-ending',
  trigger: { kind: 'ending' },
  lines: [
    you('I found you. You\'re okay.', 'warm'),
    akash("Took you long enough, detective.", 'warm'),
    akash('Seven sectors. Every lock she built, you out-reasoned. I always knew you could.', 'warm'),
    wren('The other cells are open too — everyone\'s walking out because of you.', 'warm'),
    warden('You may have my fortress. But there are bigger locks out there...', 'tense'),
    you("Then we'll be ready for them. Together. Let's go home.", 'warm'),
  ],
}

/** Build the before/after beats for each sector from the flavor table. */
const sectorBeats: StoryBeat[] = (Object.keys(SECTOR_FLAVOR) as SectorId[]).flatMap(
  (sectorId) => {
    const flavor = SECTOR_FLAVOR[sectorId]
    return [
      {
        id: `beat-before-${sectorId}`,
        trigger: { kind: 'before-sector', sectorId },
        lines: flavor.before,
      },
      {
        id: `beat-after-${sectorId}`,
        trigger: { kind: 'after-sector', sectorId },
        lines: flavor.after,
      },
    ]
  },
)

/** All story beats, in roughly the order the player encounters them. */
export const storyBeats: StoryBeat[] = [introBeat, ...sectorBeats, endingBeat]

/** Find the beat whose trigger matches the given trigger, if any. */
export function getBeat(trigger: StoryBeatTrigger): StoryBeat | undefined {
  return storyBeats.find((beat) => triggersMatch(beat.trigger, trigger))
}

/** Find a beat by its stable id (e.g. 'beat-intro'). */
export function getBeatById(id: string): StoryBeat | undefined {
  return storyBeats.find((beat) => beat.id === id)
}

function triggersMatch(a: StoryBeatTrigger, b: StoryBeatTrigger): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'before-sector' && b.kind === 'before-sector') {
    return a.sectorId === b.sectorId
  }
  if (a.kind === 'after-sector' && b.kind === 'after-sector') {
    return a.sectorId === b.sectorId
  }
  // 'intro' and 'ending' carry no extra fields.
  return true
}
