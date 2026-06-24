import type { DialogueLine, ReviewDeck, ReviewTopic, SectorId } from '../contracts'
import { getSector } from '../../data/sectors'
import { getLesson } from '../../data/lessons'

/**
 * [Agent 4] Review "decks" shown on the classroom chalkboard after a block is
 * cleared. Each deck is curated from that sector's lesson concepts (see
 * src/data/lessons.ts) — cleaned up into tight term/detail/example cards — plus
 * a handful of Akash "teacher" lines that frame the review as a debrief between
 * escape attempts. `getReviewDeck(sectorId)` keeps a stable signature; unknown
 * sectors fall back to auto-extracted lesson concepts so nothing ever breaks.
 */

function akash(text: string, mood: DialogueLine['mood'] = 'warm'): DialogueLine {
  return { speaker: 'akash', name: 'Akash', text, mood }
}

interface DeckSpec {
  title: string
  topics: ReviewTopic[]
  teacherLines: DialogueLine[]
}

const DECKS: Record<string, DeckSpec> = {
  'lesson-1': {
    title: 'Four Kinds of Clues',
    topics: [
      {
        term: 'Fact',
        detail: 'Something a clue states directly. You can trust it without guessing.',
        example: 'The clue says the pass was on the front desk — that is a fact.',
      },
      {
        term: 'Possibility',
        detail: 'Something that could be true, but no clue has proven yet. Hold it loosely.',
        example: '"It could still be there" is only a possibility.',
      },
      {
        term: 'Contradiction',
        detail: 'When two things cannot both be true. It tells you a guess is wrong.',
        example: 'If the pass was on the desk, "it was never there" is a contradiction.',
      },
      {
        term: 'Unknown',
        detail: "Something no clue covers yet. Leave it open instead of guessing.",
        example: 'If no clue mentions it, it stays unknown.',
      },
    ],
    teacherLines: [
      akash("Sit down, kid. Before the next block, let's make sure the basics stuck."),
      akash('Learn these four and you stop guessing. Guessing is what got you captured.'),
      akash('A fact you can lean on. A possibility you test. Never mix them up.'),
    ],
  },

  'lesson-2': {
    title: 'Reading a Deduction Grid',
    topics: [
      { term: '\u2713 Check', detail: 'A confirmed match. This pairing is true.' },
      { term: '\u2715 X', detail: 'Impossible. A clue has ruled this pairing out.' },
      { term: 'Blank', detail: 'Unknown. You do not know yet, so leave the box empty.' },
      {
        term: 'The big rule',
        detail: 'Each person gets exactly one answer, and each answer belongs to exactly one person.',
      },
    ],
    teacherLines: [
      akash('The vault grid is just three marks: check, X, blank. That is the whole language.'),
      akash('Every box you fill in honestly is one the Warden can\u2019t use against you.'),
      akash('Keep that grid clean and the way out reads itself.'),
    ],
  },

  'lesson-3': {
    title: "One Check, Many X\u2019s",
    topics: [
      {
        term: 'Clear the row and column',
        detail: 'When a box earns a \u2713, the rest of that row and column become \u2715.',
      },
      {
        term: 'Why it works',
        detail: 'Each answer belongs to only one person. Once it is taken, nobody else can have it.',
      },
      {
        term: 'Work in order',
        detail: 'Mark the \u2713 first, then cross out everything it just made impossible.',
      },
    ],
    teacherLines: [
      akash('That cascade you ran in surveillance? That\u2019s the whole trick. One check, many X\u2019s.'),
      akash('Follow the chain every time, or the grid starts lying to you.'),
      akash('Confirm, then eliminate. Confirm, then eliminate. Down we go.'),
    ],
  },

  'lesson-4': {
    title: 'Testing a Guess',
    topics: [
      {
        term: 'If-then clue',
        detail: 'A rule like "If it is in the Gym, then the coach saw it." It forces what must follow.',
      },
      {
        term: 'Contradiction',
        detail: 'When your guess leads to something a clue says is false.',
        example: 'Your guess needs the coach to have seen it, but a clue says he did not.',
      },
      {
        term: 'Eliminate',
        detail: 'A guess that causes a contradiction is impossible. Cross it off and move on.',
      },
    ],
    teacherLines: [
      akash('You broke the Warden\u2019s story in there. A contradiction isn\u2019t a problem — it\u2019s a gift.'),
      akash('Assume the guess. Follow the rule. If it crashes into a clue, throw it out.'),
      akash('Every guess you eliminate is one less door between us.'),
    ],
  },

  'lesson-5': {
    title: 'AND, OR, NOT',
    topics: [
      { term: 'AND', detail: 'True only when BOTH parts are true.', example: 'Keycard AND code — you need both on.' },
      { term: 'OR', detail: 'True when AT LEAST ONE part is true.', example: 'Badge OR pass — either one works.' },
      { term: 'NOT', detail: 'Flips it. "NOT active" is true only when the switch is OFF.' },
      { term: 'Parentheses first', detail: 'Solve the part inside ( ) before the rest, just like in math.' },
    ],
    teacherLines: [
      akash('The blast doors run on logic gates, and you bent them. Nicely done.'),
      akash('AND is greedy, OR is easygoing, NOT is a contrarian. Remember that before you flip anything.'),
      akash('Inside the parentheses first. Always. The grid above us depends on it.'),
    ],
  },

  'lesson-6': {
    title: 'Building an Explanation',
    topics: [
      { term: 'Start with the rule', detail: 'Lead with the if-then statement or clue you are leaning on.' },
      { term: 'Add the evidence', detail: 'Bring in the fact that triggers the rule.' },
      { term: 'Then conclude', detail: 'The answer follows from the rule plus the evidence.' },
      {
        term: 'Order matters',
        detail: 'Go clue \u2192 elimination \u2192 conclusion. Never start with the conclusion.',
      },
    ],
    teacherLines: [
      akash('You took the Control Spire by stacking your reasoning in order. That\u2019s mastery.'),
      akash('Anyone can shout an answer. A detective can explain it, in order, without flinching.'),
      akash('One door left after this. Keep your reasoning tight and we both walk out.'),
    ],
  },

  'lesson-7': {
    title: 'Your Detective Toolkit',
    topics: [
      { term: 'Sort the clues', detail: 'Separate facts, eliminations, and if-then rules before you start.' },
      { term: 'Use the grid', detail: 'One \u2713 forces many \u2715\u2019s across its row and column.' },
      { term: 'Catch contradictions', detail: 'Throw out any guess that breaks a clue.' },
      {
        term: 'Order your reasoning',
        detail: 'Build the case step by step: clue \u2192 elimination \u2192 conclusion.',
      },
    ],
    teacherLines: [
      akash('You reached the Antechamber and used everything at once. I knew you would.'),
      akash('Every skill from the academy, in one room. That\u2019s how you broke the last lock.'),
      akash('You came all this way for me. Let\u2019s review it once, then go home.'),
    ],
  },
}

/**
 * Fallback deck built directly from a lesson's concept steps, for any sector
 * that doesn't have a hand-curated deck above.
 */
function fallbackDeck(sectorId: SectorId): ReviewDeck | undefined {
  const sector = getSector(sectorId)
  if (!sector) return undefined
  const lesson = getLesson(sector.lessonId)
  if (!lesson) return undefined

  const topics: ReviewTopic[] = []
  for (const step of lesson.steps) {
    if (step.type === 'concept') {
      for (const p of step.points) {
        topics.push({
          term: p.term,
          detail: p.detail,
          example: p.example?.replace(/^Example:\s*/i, ''),
        })
      }
    }
  }
  if (topics.length === 0) {
    topics.push({ term: lesson.title, detail: lesson.subtitle })
  }

  return {
    sectorId,
    title: lesson.title,
    topics,
    teacherLines: [akash(`Let's go back over ${sector.name}.`)],
  }
}

export function getReviewDeck(sectorId: SectorId): ReviewDeck | undefined {
  const spec = DECKS[sectorId]
  if (!spec) return fallbackDeck(sectorId)
  return {
    sectorId,
    title: spec.title,
    topics: spec.topics,
    teacherLines: spec.teacherLines,
  }
}
