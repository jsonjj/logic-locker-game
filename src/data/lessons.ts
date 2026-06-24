import type { Lesson } from '../types'

/**
 * All lesson content is hand-authored and stored locally (never generated,
 * never fetched from Firestore). Each lesson is a multi-step interactive
 * sequence: intro -> tiny actions -> guided practice -> final challenge ->
 * reflection -> completion.
 */

const lesson1: Lesson = {
  id: 'lesson-1',
  title: 'Case File Basics',
  subtitle: 'Learn what clues can and cannot prove.',
  doorLabel: 'Room 1',
  estimatedMinutes: 4,
  conceptTags: ['facts', 'possibilities', 'contradictions', 'unknowns'],
  unlockAfter: null,
  badgeId: 'case-file-basics',
  steps: [
    {
      id: 'l1-step-1',
      type: 'dialogue',
      phase: 'intro',
      speaker: 'Akash',
      prompt: '',
      text: "Welcome to Logic Locker, rookie. I'm Akash. I've solved more cases than you've had lunch periods. Around here, guessing gets you eliminated. Reasoning gets you through the door. Today's case: The Missing Hall Pass.",
      correctAnswer: null,
    },
    {
      id: 'l1-concept',
      type: 'concept',
      phase: 'intro',
      prompt: '',
      title: 'Four Kinds of Clues',
      intro: 'Every case is built from clues. Before you solve anything, you need to know what each clue is really telling you. There are four kinds:',
      points: [
        {
          term: 'Fact',
          detail: 'Something a clue states directly. You can trust it without guessing.',
          example: 'Example: the clue says the pass was on the front desk — that is a fact.',
        },
        {
          term: 'Possibility',
          detail: 'Something that could be true, but no clue has proven yet.',
          example: 'Example: "it could still be there" is only a possibility.',
        },
        {
          term: 'Contradiction',
          detail: 'When two things cannot both be true. It tells you a guess is wrong.',
          example: 'Example: if the pass was on the desk, "it was never there" is a contradiction.',
        },
        {
          term: 'Unknown',
          detail: "Something you don't have enough information about yet. Leave it open.",
          example: 'Example: if no clue mentions it, it stays unknown.',
        },
      ],
      akashLine: 'Learn these four and you stop guessing. Ignore them and you stay a rookie.',
      correctAnswer: null,
    },
    {
      id: 'l1-step-2',
      type: 'multipleChoice',
      phase: 'micro-practice',
      prompt: 'Statement: "Mina was in the classroom after lunch." Is this a fact or a guess?',
      choices: [
        { id: 'fact', label: 'A fact — it is directly stated' },
        { id: 'guess', label: 'A guess — I am adding my own idea' },
      ],
      correctAnswer: 'fact',
      feedback: {
        correct: 'Right. It is stated directly, so it is a fact.',
        firstWrong: 'Look again. Did you read it in the clue, or did you imagine it?',
        secondWrong: 'A fact is information the clue states directly. This one is stated, so it is a fact.',
      },
      guidedReasoning: [
        'A fact is something the clue tells you directly.',
        'The clue literally says Mina was in the classroom after lunch.',
        'You did not add anything, so it is a fact.',
      ],
      variants: [
        {
          prompt: 'Statement: "Theo probably forgot his pass at home." Is this a fact or a guess?',
          choices: [
            { id: 'fact', label: 'A fact — it is directly stated' },
            { id: 'guess', label: 'A guess — I am adding my own idea' },
          ],
          correctAnswer: 'guess',
          feedback: {
            correct: 'Right. "Probably" means you are adding your own idea — that is a guess.',
            firstWrong: 'Did a clue actually state this, or are you assuming it?',
            secondWrong: 'No clue says Theo forgot his pass. "Probably" makes it a guess, not a fact.',
          },
          guidedReasoning: [
            'A fact is stated directly by a clue.',
            'Nothing states that Theo forgot his pass.',
            'The word "probably" means you are guessing.',
          ],
        },
        {
          prompt: 'Statement: "Coach Diaz blew the whistle to start the drill." Is this a fact or a guess?',
          choices: [
            { id: 'fact', label: 'A fact — it is directly stated' },
            { id: 'guess', label: 'A guess — I am adding my own idea' },
          ],
          correctAnswer: 'fact',
          feedback: {
            correct: 'Right. It is stated directly, so it is a fact.',
            firstWrong: 'Did you read it, or imagine it?',
            secondWrong: 'The statement says it directly, so it is a fact.',
          },
          guidedReasoning: [
            'A fact is stated directly.',
            'The statement says the coach blew the whistle.',
            'Nothing was added, so it is a fact.',
          ],
        },
      ],
    },
    {
      id: 'l1-step-3',
      type: 'multipleChoice',
      phase: 'micro-practice',
      prompt:
        'Statement: "If the pass was last seen on the front desk, it could still be there." Is this proven, or just possible?',
      choices: [
        { id: 'proven', label: 'Proven — it must be there' },
        { id: 'possible', label: 'Possible — it could be there, but it is not proven' },
      ],
      correctAnswer: 'possible',
      feedback: {
        correct: 'Yes. "Could still be" means possible, not proven.',
        firstWrong: 'The words "could still be" are a hint. That is not certainty.',
        secondWrong: 'Proven means it must be true. "Could be there" only says it is possible.',
      },
      guidedReasoning: [
        'A possibility could be true but is not guaranteed.',
        'The statement says the pass "could still be there."',
        '"Could" means possible, not proven.',
      ],
      variants: [
        {
          prompt:
            'Statement: "The pass might be in the gym, since Theo had practice there." Is this proven, or just possible?',
          choices: [
            { id: 'proven', label: 'Proven — it must be there' },
            { id: 'possible', label: 'Possible — it could be there, but it is not proven' },
          ],
          correctAnswer: 'possible',
          feedback: {
            correct: 'Yes. "Might be" is a possibility, not proof.',
            firstWrong: 'The words "might be" are a hint. That is not certainty.',
            secondWrong: 'Proven means it must be true. "Might be" only says it is possible.',
          },
          guidedReasoning: [
            'A possibility could be true but is not guaranteed.',
            'The statement says the pass "might be" in the gym.',
            '"Might" means possible, not proven.',
          ],
        },
        {
          prompt:
            'Statement: "The keys must be in the locker, since that is where Sam usually keeps them." Is this proven, or just possible?',
          choices: [
            { id: 'proven', label: 'Proven — it must be there' },
            { id: 'possible', label: 'Possible — it could be there, but it is not proven' },
          ],
          correctAnswer: 'possible',
          feedback: {
            correct: 'Yes. "Usually" is a habit, not a guarantee — that is only possible.',
            firstWrong: 'Does "usually" promise it is there this time?',
            secondWrong: 'Proven means it must be true. "Usually" only makes it possible.',
          },
          guidedReasoning: [
            'A possibility could be true but is not guaranteed.',
            '"Usually" describes a habit, not a certainty.',
            'So it is possible, not proven.',
          ],
        },
      ],
    },
    {
      id: 'l1-step-4',
      type: 'multipleChoice',
      phase: 'micro-practice',
      prompt:
        'Clue: the hall pass was last seen on the front desk. Statement: "The hall pass was never on the front desk." What is this?',
      choices: [
        { id: 'fact', label: 'A fact' },
        { id: 'possibility', label: 'A possibility' },
        { id: 'contradiction', label: 'A contradiction' },
        { id: 'unknown', label: 'Not enough information' },
      ],
      correctAnswer: 'contradiction',
      feedback: {
        correct: 'Correct. It fights the clue, so it is a contradiction.',
        firstWrong: 'Compare it to the clue. They cannot both be true.',
        secondWrong:
          'The clue says the pass WAS on the desk. This statement says it was NEVER there. Both cannot be true — that is a contradiction.',
      },
      guidedReasoning: [
        'A contradiction is a statement that fights a known clue.',
        'The clue says the pass was last seen on the front desk.',
        'This statement says it was never there — both cannot be true.',
        'That makes it a contradiction.',
      ],
      variants: [
        {
          prompt:
            'Clue: the hall pass was last seen on the front desk. Statement: "A teacher moved the pass to the office." What is this?',
          choices: [
            { id: 'fact', label: 'A fact' },
            { id: 'possibility', label: 'A possibility' },
            { id: 'contradiction', label: 'A contradiction' },
            { id: 'unknown', label: 'Not enough information' },
          ],
          correctAnswer: 'unknown',
          feedback: {
            correct: 'Correct. No clue proves this, so it is not enough information.',
            firstWrong: 'Does any clue mention a teacher moving the pass?',
            secondWrong:
              'The clues never mention a teacher moving it. With no proof either way, it is "not enough information".',
          },
          guidedReasoning: [
            'The clue only tells us where the pass was last seen.',
            'No clue mentions a teacher moving it to the office.',
            'With no proof either way, it is unknown.',
          ],
        },
        {
          prompt:
            'Clue: the hall pass was last seen on the front desk. Statement: "The pass could still be on the front desk." What is this?',
          choices: [
            { id: 'fact', label: 'A fact' },
            { id: 'possibility', label: 'A possibility' },
            { id: 'contradiction', label: 'A contradiction' },
            { id: 'unknown', label: 'Not enough information' },
          ],
          correctAnswer: 'possibility',
          feedback: {
            correct: 'Right. "Could still be" fits the clue but is not proven — a possibility.',
            firstWrong: 'It does not fight the clue, and it is not proven. What does that leave?',
            secondWrong: 'The clue allows it, but nothing proves it is still there. That is a possibility.',
          },
          guidedReasoning: [
            'The clue says where the pass was last seen.',
            '"Could still be there" agrees with the clue but is not proven.',
            'So it is a possibility.',
          ],
        },
      ],
    },
    {
      id: 'l1-step-5',
      type: 'clueSort',
      phase: 'challenge',
      prompt: 'The hall pass is missing. Sort each statement into the right case file.',
      categories: ['Fact', 'Possibility', 'Contradiction', 'Not Enough Information'],
      cards: [
        { id: 'c1', text: 'The hall pass was last seen on the front desk.' },
        { id: 'c2', text: 'Mina was in the classroom after lunch.' },
        { id: 'c3', text: "The hall pass must be in Mina's backpack." },
        { id: 'c4', text: 'If the pass was last seen on the front desk, it could still be there.' },
        { id: 'c5', text: 'The hall pass was never on the front desk.' },
        { id: 'c6', text: 'Someone moved the pass before lunch.' },
      ],
      correctAnswer: {
        c1: 'Fact',
        c2: 'Fact',
        c3: 'Not Enough Information',
        c4: 'Possibility',
        c5: 'Contradiction',
        c6: 'Not Enough Information',
      },
      feedback: {
        correct: 'Fine. That was actual reasoning. Try not to look too proud.',
        firstWrong:
          'Bold guess. Terrible, but bold. Ask yourself: does the clue prove this, or are you adding your own idea?',
        secondWrong:
          'Slow down. A fact is directly stated. A possibility could be true but is not proven. A contradiction fights the clue. Unknown means we do not have enough evidence.',
      },
      guidedReasoning: [
        'A Fact is stated directly by a clue.',
        'A Possibility could be true but is not proven.',
        'A Contradiction fights a known clue.',
        'Not Enough Information means no clue proves it either way.',
      ],
      variants: [
        {
          prompt: 'The gym whistle is missing. Sort each statement into the right case file.',
          categories: ['Fact', 'Possibility', 'Contradiction', 'Not Enough Information'],
          cards: [
            { id: 'c1', text: "The whistle was last seen in the coach's office." },
            { id: 'c2', text: 'Practice ended at 4 p.m.' },
            { id: 'c3', text: "The whistle must be in a student's bag." },
            { id: 'c4', text: 'If it was in the office, it could still be there.' },
            { id: 'c5', text: 'The whistle was never in the office.' },
            { id: 'c6', text: 'Someone borrowed the whistle yesterday.' },
          ],
          correctAnswer: {
            c1: 'Fact',
            c2: 'Fact',
            c3: 'Not Enough Information',
            c4: 'Possibility',
            c5: 'Contradiction',
            c6: 'Not Enough Information',
          },
          feedback: {
            correct: 'Fine. That was actual reasoning. Try not to look too proud.',
            firstWrong: 'Ask yourself: does a clue prove this, or are you adding your own idea?',
            secondWrong:
              'A fact is directly stated. A possibility could be true but is not proven. A contradiction fights the clue. Unknown means no clue proves it.',
          },
          guidedReasoning: [
            'A Fact is stated directly by a clue.',
            'A Possibility could be true but is not proven.',
            'A Contradiction fights a known clue.',
            'Not Enough Information means no clue proves it either way.',
          ],
        },
      ],
    },
    {
      id: 'l1-step-6',
      type: 'multipleChoice',
      phase: 'pattern-check',
      prompt: 'Which statement is safest to conclude?',
      choices: [
        { id: 'a', label: 'Mina took the pass.' },
        { id: 'b', label: 'The pass was last seen on the front desk.' },
        { id: 'c', label: 'The pass is definitely still on the desk.' },
        { id: 'd', label: 'Nobody moved the pass.' },
      ],
      correctAnswer: 'b',
      feedback: {
        correct: 'Yes. A safe conclusion stays inside the evidence.',
        firstWrong:
          'The safest conclusion is the one directly supported by the clue. Do not add extra details.',
        secondWrong:
          'The clue only tells us where the pass was last seen. Anything more is a guess. Choose the statement that adds nothing extra.',
      },
      guidedReasoning: [
        'A safe conclusion only uses what the clue proves.',
        'The clue tells us the pass was last seen on the front desk.',
        'The other choices add ideas the clue never proved.',
      ],
      variants: [
        {
          prompt: 'Clue: the hall pass was last seen on the front desk. Which conclusion is safest?',
          choices: [
            { id: 'a', label: 'Mina took the pass.' },
            { id: 'b', label: 'The pass is definitely still on the desk.' },
            { id: 'c', label: 'The pass was last seen on the front desk.' },
            { id: 'd', label: 'Nobody moved the pass.' },
          ],
          correctAnswer: 'c',
          feedback: {
            correct: 'Yes. A safe conclusion only repeats what the clue already proved.',
            firstWrong: 'Pick the choice that adds nothing beyond the clue.',
            secondWrong: 'The clue only says where the pass was last seen. Choice C adds nothing extra.',
          },
          guidedReasoning: [
            'A safe conclusion only uses what the clue proves.',
            'The clue says the pass was last seen on the front desk.',
            'Choice C repeats only that, so it is the safest.',
          ],
        },
        {
          prompt: 'Clue: "Mina was in the classroom after lunch." Which conclusion is safest?',
          choices: [
            { id: 'a', label: 'Mina took the hall pass.' },
            { id: 'b', label: 'Mina was in the classroom after lunch.' },
            { id: 'c', label: 'Mina skipped class.' },
            { id: 'd', label: 'Mina was alone.' },
          ],
          correctAnswer: 'b',
          feedback: {
            correct: 'Yes. The safe conclusion only repeats what the clue proved.',
            firstWrong: 'Pick the choice that adds nothing beyond the clue.',
            secondWrong: 'The clue only places Mina in the classroom after lunch. Choice B adds nothing extra.',
          },
          guidedReasoning: [
            'A safe conclusion only uses what the clue proves.',
            'The clue places Mina in the classroom after lunch.',
            'Choice B repeats only that, so it is safest.',
          ],
        },
      ],
    },
    {
      id: 'l1-step-7',
      type: 'caseSummary',
      phase: 'completion',
      prompt: '',
      text: 'In this room, you learned that clues can show facts, possibilities, contradictions, or unknowns. Good detectives do not guess past the evidence.',
      akashLine:
        'Room 1 complete. You now know the difference between a clue and a wild guess. A low bar, but we cleared it.',
      correctAnswer: null,
    },
  ],
}

const lesson2: Lesson = {
  id: 'lesson-2',
  title: 'Mark the Grid',
  subtitle: 'Learn X, checkmark, and blank in a deduction grid.',
  doorLabel: 'Room 2',
  estimatedMinutes: 5,
  conceptTags: ['deduction grid', 'elimination'],
  unlockAfter: 'lesson-1',
  badgeId: 'mark-the-grid',
  steps: [
    {
      id: 'l2-step-1',
      type: 'dialogue',
      phase: 'intro',
      speaker: 'Akash',
      prompt: '',
      text: 'Welcome to the grid room. This is where guesses go to be crushed. Case: The Locker Color Mix-Up. A deduction grid tracks what is possible — checkmark means confirmed, X means impossible, blank means unknown.',
      correctAnswer: null,
    },
    {
      id: 'l2-concept',
      type: 'concept',
      phase: 'intro',
      prompt: '',
      title: 'Reading a Deduction Grid',
      intro: 'A deduction grid is a detective\u2019s map of what is possible. Every box gets exactly one of three marks:',
      points: [
        {
          term: '\u2713 Check',
          detail: 'A confirmed match. This one is true.',
        },
        {
          term: '\u2715 X',
          detail: 'Impossible. A clue has ruled this out.',
        },
        {
          term: 'Blank',
          detail: 'Unknown. You do not know yet, so leave it empty.',
        },
        {
          term: 'The big rule',
          detail: 'Each person gets exactly one answer, and each answer belongs to exactly one person.',
        },
      ],
      akashLine: 'Three marks. That is the whole language of the grid. Try to keep up.',
      correctAnswer: null,
    },
    {
      id: 'l2-step-2',
      type: 'symbolTap',
      phase: 'micro-practice',
      prompt: 'Clue: "Ava does not have the red locker." What symbol belongs in Ava / Red?',
      visual: {
        kind: 'grid',
        rows: ['Ava', 'Ben', 'Cruz'],
        cols: ['Red', 'Blue', 'Green'],
        highlight: [['Ava', 'Red']],
        caption: 'The highlighted cell is Ava / Red.',
      },
      choices: [
        { id: 'X', label: 'Impossible' },
        { id: 'check', label: 'Confirmed' },
        { id: 'blank', label: 'Unknown' },
      ],
      correctAnswer: 'X',
      feedback: {
        correct: "Correct. 'Does not have' means this match is impossible.",
        firstWrong: 'Not quite. The clue rules this option out.',
        secondWrong: 'If Ava does not have red, Ava / Red must be X.',
      },
      guidedReasoning: [
        'The clue says Ava does not have the red locker.',
        'That means Ava and Red cannot match.',
        'In a deduction grid, impossible matches get an X.',
      ],
      variants: [
        {
          prompt: 'Clue: "Cruz does not have the green locker." What symbol belongs in Cruz / Green?',
          visual: {
            kind: 'grid',
            rows: ['Ava', 'Ben', 'Cruz'],
            cols: ['Red', 'Blue', 'Green'],
            highlight: [['Cruz', 'Green']],
            caption: 'The highlighted cell is Cruz / Green.',
          },
          correctAnswer: 'X',
          feedback: {
            correct: "Correct. 'Does not have' means this match is impossible.",
            firstWrong: 'Not quite. The clue rules this option out.',
            secondWrong: 'If Cruz does not have green, Cruz / Green must be X.',
          },
          guidedReasoning: [
            'The clue says Cruz does not have the green locker.',
            'That means Cruz and Green cannot match.',
            'In a deduction grid, impossible matches get an X.',
          ],
        },
      ],
    },
    {
      id: 'l2-step-3',
      type: 'symbolTap',
      phase: 'micro-practice',
      prompt: 'Clue: "Ben has the blue locker." What symbol belongs in Ben / Blue?',
      visual: {
        kind: 'grid',
        rows: ['Ava', 'Ben', 'Cruz'],
        cols: ['Red', 'Blue', 'Green'],
        highlight: [['Ben', 'Blue']],
        caption: 'The highlighted cell is Ben / Blue.',
      },
      choices: [
        { id: 'X', label: 'Impossible' },
        { id: 'check', label: 'Confirmed' },
        { id: 'blank', label: 'Unknown' },
      ],
      correctAnswer: 'check',
      feedback: {
        correct: 'Correct. A confirmed match gets a checkmark.',
        firstWrong: 'The clue confirms this match. What symbol means "yes"?',
        secondWrong: 'Ben HAS the blue locker, so Ben / Blue is a confirmed match: a check.',
      },
      guidedReasoning: [
        'The clue says Ben has the blue locker.',
        'That is a confirmed match.',
        'Confirmed matches get a checkmark.',
      ],
      variants: [
        {
          prompt: 'Clue: "Cruz has the blue locker." What symbol belongs in Cruz / Blue?',
          visual: {
            kind: 'grid',
            rows: ['Ava', 'Ben', 'Cruz'],
            cols: ['Red', 'Blue', 'Green'],
            highlight: [['Cruz', 'Blue']],
            caption: 'The highlighted cell is Cruz / Blue.',
          },
          correctAnswer: 'check',
          feedback: {
            correct: 'Correct. A confirmed match gets a checkmark.',
            firstWrong: 'The clue confirms this match. What symbol means "yes"?',
            secondWrong: 'Cruz HAS the blue locker, so Cruz / Blue is a confirmed match: a check.',
          },
          guidedReasoning: [
            'The clue says Cruz has the blue locker.',
            'That is a confirmed match.',
            'Confirmed matches get a checkmark.',
          ],
        },
      ],
    },
    {
      id: 'l2-step-4',
      type: 'multipleChoice',
      phase: 'pattern-check',
      prompt: 'What does a blank cell mean?',
      visual: {
        kind: 'legend',
        caption: 'Each cell is one of these three.',
      },
      choices: [
        { id: 'a', label: 'This option is impossible.' },
        { id: 'b', label: 'This option is confirmed.' },
        { id: 'c', label: 'We do not know yet.' },
        { id: 'd', label: 'The answer is wrong.' },
      ],
      correctAnswer: 'c',
      feedback: {
        correct: 'Blank means unknown. Do not turn unknown into impossible unless a clue tells you to.',
        firstWrong: 'Blank is not the same as X. Think about what you have not figured out yet.',
        secondWrong: 'A blank cell just means you do not have enough information yet.',
      },
      guidedReasoning: [
        'X means impossible. Check means confirmed.',
        'Blank is neither — it means you still do not know.',
      ],
      variants: [
        {
          prompt: 'What does an X in a cell mean?',
          choices: [
            { id: 'a', label: 'This match is impossible.' },
            { id: 'b', label: 'This match is confirmed.' },
            { id: 'c', label: 'We do not know yet.' },
            { id: 'd', label: 'The puzzle is finished.' },
          ],
          correctAnswer: 'a',
          feedback: {
            correct: 'Right. An X means a clue ruled this match out.',
            firstWrong: 'An X is not the same as a checkmark. Think about what a clue ruled out.',
            secondWrong: 'An X means a clue proved this match is impossible.',
          },
          guidedReasoning: [
            'Check means confirmed. Blank means unknown.',
            'X means a clue ruled it out — the match is impossible.',
          ],
        },
        {
          prompt: 'What does a checkmark in a cell mean?',
          choices: [
            { id: 'a', label: 'This match is impossible.' },
            { id: 'b', label: 'This match is confirmed.' },
            { id: 'c', label: 'We do not know yet.' },
            { id: 'd', label: 'The puzzle is finished.' },
          ],
          correctAnswer: 'b',
          feedback: {
            correct: 'Right. A checkmark means a clue confirmed this match.',
            firstWrong: 'A checkmark is not an X. Think about what a clue confirmed.',
            secondWrong: 'A checkmark means a clue proved this match is true.',
          },
          guidedReasoning: [
            'X means impossible. Blank means unknown.',
            'A checkmark means the match is confirmed.',
          ],
        },
      ],
    },
    {
      id: 'l2-step-5',
      type: 'miniGrid',
      phase: 'guided-practice',
      prompt: "Ben has the Blue locker. Mark Ben's whole row.",
      rows: ['Ben'],
      cols: ['Red', 'Blue', 'Green'],
      clues: ['Ben has the blue locker.'],
      correctAnswer: {
        Ben: { Red: 'X', Blue: 'check', Green: 'X' },
      },
      feedback: {
        correct: "Right. Ben is Blue, so Red and Green are impossible for Ben.",
        firstWrong: 'If Ben is confirmed Blue, his other colors must be impossible.',
        secondWrong: 'Ben / Blue = check. Then Ben / Red = X and Ben / Green = X.',
      },
      guidedReasoning: [
        'Ben has Blue, so Ben / Blue is a check.',
        'Each person has only one color.',
        'So Ben / Red and Ben / Green must both be X.',
      ],
      variants: [
        {
          prompt: "Cruz has the Blue locker. Mark Cruz's whole row.",
          rows: ['Cruz'],
          cols: ['Red', 'Blue', 'Green'],
          clues: ['Cruz has the blue locker.'],
          correctAnswer: {
            Cruz: { Red: 'X', Blue: 'check', Green: 'X' },
          },
          feedback: {
            correct: 'Right. Cruz is Blue, so Red and Green are impossible for Cruz.',
            firstWrong: 'If Cruz is confirmed Blue, his other colors must be impossible.',
            secondWrong: 'Cruz / Blue = check. Then Cruz / Red = X and Cruz / Green = X.',
          },
          guidedReasoning: [
            'Cruz has Blue, so Cruz / Blue is a check.',
            'Each person has only one color.',
            'So Cruz / Red and Cruz / Green must both be X.',
          ],
        },
      ],
    },
    {
      id: 'l2-step-6',
      type: 'prediction',
      phase: 'guided-practice',
      prompt: 'Ben has Blue. What happens to Ava and Cruz in the Blue column?',
      visual: {
        kind: 'grid',
        rows: ['Ava', 'Ben', 'Cruz'],
        cols: ['Red', 'Blue', 'Green'],
        marks: { Ben: { Blue: 'check' } },
        highlight: [
          ['Ava', 'Blue'],
          ['Cruz', 'Blue'],
        ],
        caption: 'Ben / Blue is confirmed. What about the rest of the Blue column?',
      },
      choices: [
        { id: 'still', label: 'They could still be Blue' },
        { id: 'x', label: 'They both become X (cannot be Blue)' },
        { id: 'nothing', label: 'Nothing changes' },
      ],
      correctAnswer: 'x',
      feedback: {
        correct: 'Correct. One color belongs to one person, so the rest of the Blue column is X.',
        firstWrong: 'Only one person can have Blue. Ben already has it.',
        secondWrong: 'If Ben has Blue, nobody else can. Ava / Blue and Cruz / Blue both become X.',
      },
      guidedReasoning: [
        'Each color belongs to exactly one person.',
        'Ben already has Blue.',
        'So Ava and Cruz cannot be Blue — both get an X.',
      ],
      variants: [
        {
          prompt: 'Cruz has Blue. What happens to Ava and Ben in the Blue column?',
          visual: {
            kind: 'grid',
            rows: ['Ava', 'Ben', 'Cruz'],
            cols: ['Red', 'Blue', 'Green'],
            marks: { Cruz: { Blue: 'check' } },
            highlight: [
              ['Ava', 'Blue'],
              ['Ben', 'Blue'],
            ],
            caption: 'Cruz / Blue is confirmed. What about the rest of the Blue column?',
          },
          choices: [
            { id: 'still', label: 'They could still be Blue' },
            { id: 'x', label: 'They both become X (cannot be Blue)' },
            { id: 'nothing', label: 'Nothing changes' },
          ],
          correctAnswer: 'x',
          feedback: {
            correct: 'Correct. One color belongs to one person, so the rest of the Blue column is X.',
            firstWrong: 'Only one person can have Blue. Cruz already has it.',
            secondWrong: 'If Cruz has Blue, nobody else can. Ava / Blue and Ben / Blue both become X.',
          },
          guidedReasoning: [
            'Each color belongs to exactly one person.',
            'Cruz already has Blue.',
            'So Ava and Ben cannot be Blue — both get an X.',
          ],
        },
        {
          prompt: 'Ava has Green. What happens to Ben and Cruz in the Green column?',
          visual: {
            kind: 'grid',
            rows: ['Ava', 'Ben', 'Cruz'],
            cols: ['Red', 'Blue', 'Green'],
            marks: { Ava: { Green: 'check' } },
            highlight: [
              ['Ben', 'Green'],
              ['Cruz', 'Green'],
            ],
            caption: 'Ava / Green is confirmed. What about the rest of the Green column?',
          },
          choices: [
            { id: 'still', label: 'They could still be Green' },
            { id: 'x', label: 'They both become X (cannot be Green)' },
            { id: 'nothing', label: 'Nothing changes' },
          ],
          correctAnswer: 'x',
          feedback: {
            correct: 'Correct. One color belongs to one person, so the rest of the Green column is X.',
            firstWrong: 'Only one person can have Green. Ava already has it.',
            secondWrong: 'If Ava has Green, nobody else can. Ben / Green and Cruz / Green both become X.',
          },
          guidedReasoning: [
            'Each color belongs to exactly one person.',
            'Ava already has Green.',
            'So Ben and Cruz cannot be Green — both get an X.',
          ],
        },
      ],
    },
    {
      id: 'l2-step-7',
      type: 'deductionGrid',
      phase: 'challenge',
      prompt: 'Three students each have one locker color. Use the clues to match each student to a color.',
      rows: ['Ava', 'Ben', 'Cruz'],
      cols: ['Red', 'Blue', 'Green'],
      clues: [
        'Ava does not have the red locker.',
        'Ben has the blue locker.',
        'Cruz does not have the green locker.',
      ],
      correctAnswer: {
        Ava: { Red: 'X', Blue: 'X', Green: 'check' },
        Ben: { Red: 'X', Blue: 'check', Green: 'X' },
        Cruz: { Red: 'check', Blue: 'X', Green: 'X' },
      },
      feedback: {
        correct: 'Correct. The grid did its job. Amazing what happens when you listen to it.',
        firstWrong: 'Not quite. Remember: once Ben gets Blue, nobody else can have Blue.',
        secondWrong:
          "Let's walk it. Ben is Blue. Ava is not Red and cannot be Blue, so Ava must be Green. That leaves Red for Cruz.",
      },
      guidedReasoning: [
        'Ben has Blue, so Ben / Blue is a check and the rest of that row and column are X.',
        'Ava is not Red and cannot be Blue, so Ava must be Green.',
        'That leaves Red for Cruz.',
      ],
      variants: [
        {
          prompt: 'Three students each have one locker color. Use the clues to match each student to a color.',
          rows: ['Ava', 'Ben', 'Cruz'],
          cols: ['Red', 'Blue', 'Green'],
          clues: [
            'Cruz has the blue locker.',
            'Ben does not have the red locker.',
            'Ava does not have the green locker.',
          ],
          correctAnswer: {
            Ava: { Red: 'check', Blue: 'X', Green: 'X' },
            Ben: { Red: 'X', Blue: 'X', Green: 'check' },
            Cruz: { Red: 'X', Blue: 'check', Green: 'X' },
          },
          feedback: {
            correct: 'Correct. The grid did its job. Amazing what happens when you listen to it.',
            firstWrong: 'Not quite. Remember: once Cruz gets Blue, nobody else can have Blue.',
            secondWrong:
              "Let's walk it. Cruz is Blue. Ben is not Red and cannot be Blue, so Ben must be Green. That leaves Red for Ava.",
          },
          guidedReasoning: [
            'Cruz has Blue, so Cruz / Blue is a check and the rest of that row and column are X.',
            'Ben is not Red and cannot be Blue, so Ben must be Green.',
            'That leaves Red for Ava.',
          ],
        },
      ],
    },
    {
      id: 'l2-step-8',
      type: 'caseSummary',
      phase: 'completion',
      prompt: '',
      text: 'You survived the grid. X means no. Check means yes. Blank means stop pretending you know.',
      akashLine: 'Room 2 complete. You can read a grid now. Slowly. Like a toddler reading a menu. But you can read it.',
      correctAnswer: null,
    },
  ],
}

const lesson3: Lesson = {
  id: 'lesson-3',
  title: "One Check Creates Many X's",
  subtitle: 'Learn how one confirmed match forces eliminations.',
  doorLabel: 'Room 3',
  estimatedMinutes: 5,
  conceptTags: ['constraint propagation', 'deduction grid'],
  unlockAfter: 'lesson-2',
  badgeId: 'one-check-many-x',
  steps: [
    {
      id: 'l3-step-1',
      type: 'dialogue',
      phase: 'intro',
      speaker: 'Akash',
      prompt: '',
      text: "Here's where rookies usually trip. A checkmark is not lonely. One confirmed match creates other eliminations. Case: Club Signup Chaos. Each person gets exactly one club, and each club goes to exactly one person.",
      correctAnswer: null,
    },
    {
      id: 'l3-concept',
      type: 'concept',
      phase: 'intro',
      prompt: '',
      title: 'One Check, Many X\u2019s',
      intro: 'A checkmark is never alone. The moment you confirm one answer, other boxes are forced to change. This is the most important habit in grid solving:',
      points: [
        {
          term: 'Clear the row and column',
          detail: 'When a box gets a \u2713, the rest of that row and that column become \u2715.',
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
      akashLine: 'Follow the chain every time. One check, then the X\u2019s it forces. Miss that and the grid lies to you.',
      correctAnswer: null,
    },
    {
      id: 'l3-step-2',
      type: 'prediction',
      phase: 'micro-practice',
      prompt: 'If Priya is Art, what happens to everyone else in the Art column?',
      visual: {
        kind: 'grid',
        rows: ['Imani', 'Jalen', 'Priya'],
        cols: ['Robotics', 'Chess', 'Art'],
        marks: { Priya: { Art: 'check' } },
        highlight: [
          ['Imani', 'Art'],
          ['Jalen', 'Art'],
        ],
        caption: 'Priya / Art is confirmed. Look at the rest of the Art column.',
      },
      choices: [
        { id: 'cannot', label: 'They cannot be Art' },
        { id: 'maybe', label: 'They might still be Art' },
        { id: 'nothing', label: 'Nothing changes' },
      ],
      correctAnswer: 'cannot',
      feedback: {
        correct: 'Right. One club goes to one person, so the rest of the Art column is impossible.',
        firstWrong: 'Each club belongs to only one person. Priya already took Art.',
        secondWrong: 'If Priya is Art, nobody else can be Art. The rest of the column becomes X.',
      },
      guidedReasoning: [
        'Each club goes to exactly one person.',
        'Priya is confirmed for Art.',
        'So everyone else in the Art column must be X.',
      ],
      variants: [
        {
          prompt: 'If Imani is Robotics, what happens to everyone else in the Robotics column?',
          visual: {
            kind: 'grid',
            rows: ['Imani', 'Jalen', 'Priya'],
            cols: ['Robotics', 'Chess', 'Art'],
            marks: { Imani: { Robotics: 'check' } },
            highlight: [
              ['Jalen', 'Robotics'],
              ['Priya', 'Robotics'],
            ],
            caption: 'Imani / Robotics is confirmed. Look at the rest of the Robotics column.',
          },
          choices: [
            { id: 'cannot', label: 'They cannot be Robotics' },
            { id: 'maybe', label: 'They might still be Robotics' },
            { id: 'nothing', label: 'Nothing changes' },
          ],
          correctAnswer: 'cannot',
          feedback: {
            correct: 'Right. One club goes to one person, so the rest of the Robotics column is impossible.',
            firstWrong: 'Each club belongs to only one person. Imani already took Robotics.',
            secondWrong: 'If Imani is Robotics, nobody else can be Robotics. The rest of the column becomes X.',
          },
          guidedReasoning: [
            'Each club goes to exactly one person.',
            'Imani is confirmed for Robotics.',
            'So everyone else in the Robotics column must be X.',
          ],
        },
        {
          prompt: 'If Jalen is Chess, what happens to everyone else in the Chess column?',
          visual: {
            kind: 'grid',
            rows: ['Imani', 'Jalen', 'Priya'],
            cols: ['Robotics', 'Chess', 'Art'],
            marks: { Jalen: { Chess: 'check' } },
            highlight: [
              ['Imani', 'Chess'],
              ['Priya', 'Chess'],
            ],
            caption: 'Jalen / Chess is confirmed. Look at the rest of the Chess column.',
          },
          choices: [
            { id: 'cannot', label: 'They cannot be Chess' },
            { id: 'maybe', label: 'They might still be Chess' },
            { id: 'nothing', label: 'Nothing changes' },
          ],
          correctAnswer: 'cannot',
          feedback: {
            correct: 'Right. One club goes to one person, so the rest of the Chess column is impossible.',
            firstWrong: 'Each club belongs to only one person. Jalen already took Chess.',
            secondWrong: 'If Jalen is Chess, nobody else can be Chess. The rest of the column becomes X.',
          },
          guidedReasoning: [
            'Each club goes to exactly one person.',
            'Jalen is confirmed for Chess.',
            'So everyone else in the Chess column must be X.',
          ],
        },
      ],
    },
    {
      id: 'l3-step-3',
      type: 'singleCellGrid',
      phase: 'micro-practice',
      prompt: 'Clue: "Priya joined Art." Mark the confirmed cell: Priya / Art.',
      rows: ['Imani', 'Jalen', 'Priya'],
      cols: ['Robotics', 'Chess', 'Art'],
      clues: ['Priya joined Art.'],
      targetRow: 'Priya',
      targetCol: 'Art',
      correctAnswer: 'check',
      feedback: {
        correct: 'Confirmed. Priya / Art is a check.',
        firstWrong: 'The clue confirms this match. What symbol means "yes"?',
        secondWrong: 'Priya joined Art — that is a confirmed match, so it gets a check.',
      },
      guidedReasoning: [
        'The clue directly says Priya joined Art.',
        'A directly confirmed match gets a checkmark.',
      ],
      variants: [
        {
          prompt: 'Clue: "Jalen joined Robotics." Mark the confirmed cell: Jalen / Robotics.',
          clues: ['Jalen joined Robotics.'],
          targetRow: 'Jalen',
          targetCol: 'Robotics',
          correctAnswer: 'check',
          feedback: {
            correct: 'Confirmed. Jalen / Robotics is a check.',
            firstWrong: 'The clue confirms this match. What symbol means "yes"?',
            secondWrong: 'Jalen joined Robotics — that is a confirmed match, so it gets a check.',
          },
          guidedReasoning: [
            'The clue directly says Jalen joined Robotics.',
            'A directly confirmed match gets a checkmark.',
          ],
        },
      ],
    },
    {
      id: 'l3-step-4',
      type: 'miniGrid',
      phase: 'guided-practice',
      prompt:
        'Priya is Art. Tap the cells that MUST become X because of it (the rest of Priya\'s row and the rest of the Art column). Leave Priya / Art as a check.',
      rows: ['Imani', 'Jalen', 'Priya'],
      cols: ['Robotics', 'Chess', 'Art'],
      clues: ['Priya joined Art.'],
      showConsequences: true,
      correctAnswer: {
        Priya: { Robotics: 'X', Chess: 'X', Art: 'check' },
        Imani: { Art: 'X' },
        Jalen: { Art: 'X' },
      },
      feedback: {
        correct: 'Good. You let the checkmark do the heavy lifting.',
        firstWrong: 'One checkmark changes the whole row and column. Priya has Art, so Art is taken.',
        secondWrong:
          'Mark Priya / Robotics and Priya / Chess as X (her row), and Imani / Art and Jalen / Art as X (the Art column).',
      },
      guidedReasoning: [
        'Priya has Art, so the rest of her row (Robotics, Chess) is impossible.',
        'Art is taken, so the rest of the Art column (Imani, Jalen) is impossible.',
        'All four of those cells become X.',
      ],
      variants: [
        {
          prompt:
            "Imani is Chess. Tap the cells that MUST become X because of it (the rest of Imani's row and the rest of the Chess column). Leave Imani / Chess as a check.",
          clues: ['Imani joined Chess.'],
          correctAnswer: {
            Imani: { Robotics: 'X', Chess: 'check', Art: 'X' },
            Jalen: { Chess: 'X' },
            Priya: { Chess: 'X' },
          },
          feedback: {
            correct: 'Good. You let the checkmark do the heavy lifting.',
            firstWrong: 'One checkmark changes the whole row and column. Imani has Chess, so Chess is taken.',
            secondWrong:
              'Mark Imani / Robotics and Imani / Art as X (her row), and Jalen / Chess and Priya / Chess as X (the Chess column).',
          },
          guidedReasoning: [
            'Imani has Chess, so the rest of her row (Robotics, Art) is impossible.',
            'Chess is taken, so the rest of the Chess column (Jalen, Priya) is impossible.',
            'All four of those cells become X.',
          ],
        },
      ],
    },
    {
      id: 'l3-step-5',
      type: 'miniGrid',
      phase: 'pattern-check',
      prompt: 'Quick 2x2 practice. Clue: "Ada joined Music." Complete the grid.',
      rows: ['Ada', 'Bo'],
      cols: ['Music', 'Drama'],
      clues: ['Ada joined Music.', 'Each person joins one club; each club has one person.'],
      correctAnswer: {
        Ada: { Music: 'check', Drama: 'X' },
        Bo: { Music: 'X', Drama: 'check' },
      },
      feedback: {
        correct: 'Nice. One check forced the other three cells.',
        firstWrong: 'Start with the confirmed cell, then eliminate across the row and column.',
        secondWrong: 'Ada / Music = check. So Ada / Drama = X, Bo / Music = X, and Bo / Drama = check.',
      },
      guidedReasoning: [
        'Ada joined Music, so Ada / Music is a check.',
        'Ada cannot also be Drama, and Bo cannot be Music — both X.',
        'That leaves Drama for Bo.',
      ],
      variants: [
        {
          prompt: 'Quick 2x2 practice. Clue: "Cole joined Coding." Complete the grid.',
          rows: ['Cole', 'Dee'],
          cols: ['Coding', 'Art'],
          clues: ['Cole joined Coding.', 'Each person joins one club; each club has one person.'],
          correctAnswer: {
            Cole: { Coding: 'check', Art: 'X' },
            Dee: { Coding: 'X', Art: 'check' },
          },
          feedback: {
            correct: 'Nice. One check forced the other three cells.',
            firstWrong: 'Start with the confirmed cell, then eliminate across the row and column.',
            secondWrong: 'Cole / Coding = check. So Cole / Art = X, Dee / Coding = X, and Dee / Art = check.',
          },
          guidedReasoning: [
            'Cole joined Coding, so Cole / Coding is a check.',
            'Cole cannot also be Art, and Dee cannot be Coding — both X.',
            'That leaves Art for Dee.',
          ],
        },
      ],
    },
    {
      id: 'l3-step-6',
      type: 'deductionGrid',
      phase: 'challenge',
      prompt: 'Three students joined three different clubs. Use the clues to complete the grid.',
      rows: ['Imani', 'Jalen', 'Priya'],
      cols: ['Robotics', 'Chess', 'Art'],
      clues: ['Priya joined Art.', 'Imani did not join Robotics.', 'Jalen did not join Chess.'],
      showConsequences: true,
      correctAnswer: {
        Imani: { Robotics: 'X', Chess: 'check', Art: 'X' },
        Jalen: { Robotics: 'check', Chess: 'X', Art: 'X' },
        Priya: { Robotics: 'X', Chess: 'X', Art: 'check' },
      },
      feedback: {
        correct: 'Good. You let the checkmark do the heavy lifting.',
        firstWrong: 'One checkmark changes the whole row and column. Priya has Art, so Art is taken.',
        secondWrong:
          'Priya is Art. Imani is not Robotics and cannot be Art, so Imani is Chess. That leaves Robotics for Jalen.',
      },
      guidedReasoning: [
        'Priya is Art, so the Art column is X for Imani and Jalen.',
        'Imani is not Robotics and not Art, so Imani is Chess.',
        'That leaves Robotics for Jalen.',
      ],
      variants: [
        {
          prompt: 'Three students joined three different clubs. Use the clues to complete the grid.',
          clues: ['Jalen joined Art.', 'Imani did not join Chess.', 'Priya did not join Robotics.'],
          correctAnswer: {
            Imani: { Robotics: 'check', Chess: 'X', Art: 'X' },
            Jalen: { Robotics: 'X', Chess: 'X', Art: 'check' },
            Priya: { Robotics: 'X', Chess: 'check', Art: 'X' },
          },
          feedback: {
            correct: 'Good. You let the checkmark do the heavy lifting.',
            firstWrong: 'One checkmark changes the whole row and column. Jalen has Art, so Art is taken.',
            secondWrong:
              'Jalen is Art. Imani is not Chess and cannot be Art, so Imani is Robotics. That leaves Chess for Priya.',
          },
          guidedReasoning: [
            'Jalen is Art, so the Art column is X for Imani and Priya.',
            'Imani is not Chess and not Art, so Imani is Robotics.',
            'That leaves Chess for Priya.',
          ],
        },
      ],
    },
    {
      id: 'l3-step-7',
      type: 'multipleChoice',
      phase: 'reflection',
      prompt: 'If Priya is Art, what else must be true?',
      visual: {
        kind: 'grid',
        rows: ['Imani', 'Jalen', 'Priya'],
        cols: ['Robotics', 'Chess', 'Art'],
        marks: { Priya: { Art: 'check' } },
        caption: 'Priya is confirmed for Art.',
      },
      choices: [
        { id: 'a', label: 'Jalen is Art.' },
        { id: 'b', label: 'Imani might still be Art.' },
        { id: 'c', label: 'Nobody else is Art.' },
        { id: 'd', label: 'Priya is also Chess.' },
      ],
      correctAnswer: 'c',
      feedback: {
        correct: 'One club can only belong to one person. If Priya is Art, Art is taken.',
        firstWrong: 'Remember the rule: one club, one person.',
        secondWrong: 'If Priya is Art, nobody else can be Art. That is the consequence.',
      },
      guidedReasoning: [
        'Each club goes to exactly one person.',
        'Priya took Art.',
        'So no one else can be Art.',
      ],
      variants: [
        {
          prompt: 'If Jalen is Robotics, what else must be true?',
          visual: {
            kind: 'grid',
            rows: ['Imani', 'Jalen', 'Priya'],
            cols: ['Robotics', 'Chess', 'Art'],
            marks: { Jalen: { Robotics: 'check' } },
            caption: 'Jalen is confirmed for Robotics.',
          },
          choices: [
            { id: 'a', label: 'Imani is also Robotics.' },
            { id: 'b', label: 'Priya might still be Robotics.' },
            { id: 'c', label: 'Nobody else is Robotics.' },
            { id: 'd', label: 'Jalen is also Chess.' },
          ],
          correctAnswer: 'c',
          feedback: {
            correct: 'One club can only belong to one person. If Jalen is Robotics, Robotics is taken.',
            firstWrong: 'Remember the rule: one club, one person.',
            secondWrong: 'If Jalen is Robotics, nobody else can be Robotics. That is the consequence.',
          },
          guidedReasoning: [
            'Each club goes to exactly one person.',
            'Jalen took Robotics.',
            'So no one else can be Robotics.',
          ],
        },
        {
          prompt: 'If Imani is Chess, what else must be true?',
          visual: {
            kind: 'grid',
            rows: ['Imani', 'Jalen', 'Priya'],
            cols: ['Robotics', 'Chess', 'Art'],
            marks: { Imani: { Chess: 'check' } },
            caption: 'Imani is confirmed for Chess.',
          },
          choices: [
            { id: 'a', label: 'Priya is also Chess.' },
            { id: 'b', label: 'Jalen might still be Chess.' },
            { id: 'c', label: 'Nobody else is Chess.' },
            { id: 'd', label: 'Imani is also Art.' },
          ],
          correctAnswer: 'c',
          feedback: {
            correct: 'One club can only belong to one person. If Imani is Chess, Chess is taken.',
            firstWrong: 'Remember the rule: one club, one person.',
            secondWrong: 'If Imani is Chess, nobody else can be Chess. That is the consequence.',
          },
          guidedReasoning: [
            'Each club goes to exactly one person.',
            'Imani took Chess.',
            'So no one else can be Chess.',
          ],
        },
      ],
    },
    {
      id: 'l3-step-8',
      type: 'caseSummary',
      phase: 'completion',
      prompt: '',
      text: 'Every checkmark has consequences. Ignore them and the grid becomes decoration.',
      akashLine: 'Room 3 complete. You finally see that one check sets off a chain. Took you long enough.',
      correctAnswer: null,
    },
  ],
}

const lesson4: Lesson = {
  id: 'lesson-4',
  title: 'Catch the Contradiction',
  subtitle: 'Test a guess and reject it when it breaks a clue.',
  doorLabel: 'Room 4',
  estimatedMinutes: 4,
  conceptTags: ['contradiction', 'elimination'],
  unlockAfter: 'lesson-3',
  badgeId: 'catch-the-contradiction',
  steps: [
    {
      id: 'l4-step-1',
      type: 'dialogue',
      phase: 'intro',
      speaker: 'Akash',
      prompt: '',
      text: 'Sometimes you do not know the answer right away. So you test a guess. If it crashes into a clue, toss it out. Case: The Missing Mascot Badge. It is in the Gym, the Library, or the Cafeteria.',
      correctAnswer: null,
    },
    {
      id: 'l4-concept',
      type: 'concept',
      phase: 'intro',
      prompt: '',
      title: 'Testing a Guess',
      intro: 'When no clue gives you the answer directly, you can test a guess. If the guess breaks a clue, you know it is wrong. Here is the toolkit:',
      points: [
        {
          term: 'If-then clue',
          detail: 'A rule like "If it is in the Gym, then the coach saw it." It forces what must be true.',
        },
        {
          term: 'Contradiction',
          detail: 'When your guess leads to something a clue says is false.',
          example: 'Example: the guess says the coach saw it, but a clue says he did not.',
        },
        {
          term: 'Eliminate',
          detail: 'A guess that causes a contradiction is impossible. Cross it off and move on.',
        },
      ],
      akashLine: 'A contradiction is not a problem. It is a gift. It tells you exactly what to throw away.',
      correctAnswer: null,
    },
    {
      id: 'l4-step-2',
      type: 'prediction',
      phase: 'micro-practice',
      prompt: 'Clue 1: "If the badge is in the Gym, then the coach saw it." If the badge IS in the Gym, what must be true?',
      visual: {
        kind: 'clues',
        title: 'Case Clues',
        items: ['If the badge is in the Gym, then the coach saw it.'],
      },
      choices: [
        { id: 'saw', label: 'The coach saw the badge' },
        { id: 'notsaw', label: 'The coach did not see the badge' },
        { id: 'nothing', label: 'Nothing has to be true' },
      ],
      correctAnswer: 'saw',
      feedback: {
        correct: 'Right. The "if-then" clue forces it: Gym means the coach saw it.',
        firstWrong: 'Read the clue as a rule: IF Gym, THEN the coach saw it.',
        secondWrong: 'The clue says if it is in the Gym, then the coach saw it. So Gym forces "coach saw it".',
      },
      guidedReasoning: [
        'Clue 1 is a rule: if Gym, then the coach saw it.',
        'So assuming Gym forces the coach to have seen it.',
      ],
      variants: [
        {
          prompt:
            'Clue 1: "If the badge is in the Library, then it is on a shelf." If the badge IS in the Library, what must be true?',
          visual: {
            kind: 'clues',
            title: 'Case Clues',
            items: ['If the badge is in the Library, then it is on a shelf.'],
          },
          choices: [
            { id: 'on', label: 'The badge is on a shelf' },
            { id: 'off', label: 'The badge is not on a shelf' },
            { id: 'nothing', label: 'Nothing has to be true' },
          ],
          correctAnswer: 'on',
          feedback: {
            correct: 'Right. The "if-then" clue forces it: Library means it is on a shelf.',
            firstWrong: 'Read the clue as a rule: IF Library, THEN on a shelf.',
            secondWrong:
              'The clue says if it is in the Library, then it is on a shelf. So Library forces "on a shelf".',
          },
          guidedReasoning: [
            'Clue 1 is a rule: if Library, then on a shelf.',
            'So assuming Library forces the badge to be on a shelf.',
          ],
        },
        {
          prompt:
            'Clue 1: "If the badge is in the Office, then the principal logged it." If the badge IS in the Office, what must be true?',
          visual: {
            kind: 'clues',
            title: 'Case Clues',
            items: ['If the badge is in the Office, then the principal logged it.'],
          },
          choices: [
            { id: 'logged', label: 'The principal logged the badge' },
            { id: 'notlogged', label: 'The principal did not log the badge' },
            { id: 'nothing', label: 'Nothing has to be true' },
          ],
          correctAnswer: 'logged',
          feedback: {
            correct: 'Right. The "if-then" clue forces it: Office means the principal logged it.',
            firstWrong: 'Read the clue as a rule: IF Office, THEN logged.',
            secondWrong: 'The clue says if it is in the Office, then the principal logged it. So Office forces "logged".',
          },
          guidedReasoning: [
            'Clue 1 is a rule: if Office, then logged.',
            'So assuming Office forces the principal to have logged it.',
          ],
        },
      ],
    },
    {
      id: 'l4-step-3',
      type: 'multipleChoice',
      phase: 'micro-practice',
      prompt: 'Clue 2 says: "The coach did not see the badge." Did the coach see the badge?',
      visual: {
        kind: 'clues',
        title: 'Case Clues',
        items: [
          'If the badge is in the Gym, then the coach saw it.',
          'The coach did not see the badge.',
        ],
      },
      choices: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
      correctAnswer: 'no',
      feedback: {
        correct: 'Correct. Clue 2 states the coach did not see it.',
        firstWrong: 'Reread clue 2 carefully.',
        secondWrong: 'Clue 2 says directly: the coach did NOT see the badge.',
      },
      guidedReasoning: ['Clue 2 states it plainly: the coach did not see the badge.'],
      variants: [
        {
          prompt: 'Clue 2 says: "The badge is not on a shelf." Is the badge on a shelf?',
          visual: {
            kind: 'clues',
            title: 'Case Clues',
            items: [
              'If the badge is in the Library, then it is on a shelf.',
              'The badge is not on a shelf.',
            ],
          },
          choices: [
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
          ],
          correctAnswer: 'no',
          feedback: {
            correct: 'Correct. Clue 2 states the badge is not on a shelf.',
            firstWrong: 'Reread clue 2 carefully.',
            secondWrong: 'Clue 2 says directly: the badge is NOT on a shelf.',
          },
          guidedReasoning: ['Clue 2 states it plainly: the badge is not on a shelf.'],
        },
        {
          prompt: 'Clue 2 says: "The principal did not log the badge." Did the principal log the badge?',
          visual: {
            kind: 'clues',
            title: 'Case Clues',
            items: [
              'If the badge is in the Office, then the principal logged it.',
              'The principal did not log the badge.',
            ],
          },
          choices: [
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
          ],
          correctAnswer: 'no',
          feedback: {
            correct: 'Correct. Clue 2 states the principal did not log it.',
            firstWrong: 'Reread clue 2 carefully.',
            secondWrong: 'Clue 2 says directly: the principal did NOT log the badge.',
          },
          guidedReasoning: ['Clue 2 states it plainly: the principal did not log the badge.'],
        },
      ],
    },
    {
      id: 'l4-step-4',
      type: 'multipleChoice',
      phase: 'guided-practice',
      prompt: 'Gym would mean the coach saw it. But the coach did not see it. Can the badge still be in the Gym?',
      visual: {
        kind: 'clues',
        title: 'Clash to check',
        items: [
          'Assume Gym → the coach saw the badge.',
          'But clue 2: the coach did NOT see the badge.',
        ],
      },
      choices: [
        { id: 'yes', label: 'Yes, it can still be the Gym' },
        { id: 'no', label: 'No, the Gym is impossible' },
      ],
      correctAnswer: 'no',
      feedback: {
        correct: 'Yes. The Gym guess collapses under its own nonsense.',
        firstWrong: 'Careful. The clue says Gym would mean the coach saw it. But the coach did not.',
        secondWrong:
          'Assume Gym. Then the coach saw the badge. But clue 2 says the coach did not see it. That breaks. Gym is impossible.',
      },
      guidedReasoning: [
        'Assume the badge is in the Gym.',
        'Then clue 1 forces: the coach saw it.',
        'But clue 2 says the coach did not see it.',
        'Both cannot be true — a contradiction. So the Gym is impossible.',
      ],
      variants: [
        {
          prompt:
            'The Library would mean the badge is on a shelf. But it is not on a shelf. Can the badge still be in the Library?',
          visual: {
            kind: 'clues',
            title: 'Clash to check',
            items: [
              'Assume Library → the badge is on a shelf.',
              'But clue 2: the badge is NOT on a shelf.',
            ],
          },
          choices: [
            { id: 'yes', label: 'Yes, it can still be the Library' },
            { id: 'no', label: 'No, the Library is impossible' },
          ],
          correctAnswer: 'no',
          feedback: {
            correct: 'Yes. The Library guess collapses under its own nonsense.',
            firstWrong: 'Careful. The Library would mean on a shelf. But it is not on a shelf.',
            secondWrong:
              'Assume Library. Then the badge is on a shelf. But clue 2 says it is not. That breaks. The Library is impossible.',
          },
          guidedReasoning: [
            'Assume the badge is in the Library.',
            'Then clue 1 forces: it is on a shelf.',
            'But clue 2 says it is not on a shelf.',
            'Both cannot be true — a contradiction. So the Library is impossible.',
          ],
        },
        {
          prompt:
            'The Office would mean the principal logged it. But the principal did not log it. Can the badge still be in the Office?',
          visual: {
            kind: 'clues',
            title: 'Clash to check',
            items: [
              'Assume Office → the principal logged the badge.',
              'But clue 2: the principal did NOT log the badge.',
            ],
          },
          choices: [
            { id: 'yes', label: 'Yes, it can still be the Office' },
            { id: 'no', label: 'No, the Office is impossible' },
          ],
          correctAnswer: 'no',
          feedback: {
            correct: 'Yes. The Office guess collapses under its own nonsense.',
            firstWrong: 'Careful. The Office would mean logged. But it was not logged.',
            secondWrong:
              'Assume Office. Then the principal logged it. But clue 2 says they did not. That breaks. The Office is impossible.',
          },
          guidedReasoning: [
            'Assume the badge is in the Office.',
            'Then clue 1 forces: the principal logged it.',
            'But clue 2 says they did not log it.',
            'Both cannot be true — a contradiction. So the Office is impossible.',
          ],
        },
      ],
    },
    {
      id: 'l4-step-5',
      type: 'miniGrid',
      phase: 'pattern-check',
      prompt:
        'Cross out the impossible locations. Gym breaks a clue, and clue 3 says it is not in the Cafeteria. Mark the badge\'s location row.',
      rows: ['Badge'],
      cols: ['Gym', 'Library', 'Cafeteria'],
      clues: [
        'If the badge is in the Gym, then the coach saw it.',
        'The coach did not see the badge.',
        'The badge is not in the Cafeteria.',
      ],
      correctAnswer: {
        Badge: { Gym: 'X', Library: 'check', Cafeteria: 'X' },
      },
      feedback: {
        correct: 'Clean elimination. Gym and Cafeteria are out, so Library stands.',
        firstWrong: 'Gym is impossible (contradiction) and the Cafeteria is ruled out by clue 3.',
        secondWrong: 'Mark Gym = X and Cafeteria = X. The only one left, Library, is a check.',
      },
      guidedReasoning: [
        'Gym creates a contradiction, so Gym = X.',
        'Clue 3 says not the Cafeteria, so Cafeteria = X.',
        'Only the Library is left, so it gets a check.',
      ],
      variants: [
        {
          prompt:
            "Cross out the impossible locations. The Library breaks a clue, and clue 3 says it is not in the Gym. Mark the badge's location row.",
          clues: [
            'If the badge is in the Library, then it is on a shelf.',
            'The badge is not on a shelf.',
            'The badge is not in the Gym.',
          ],
          correctAnswer: {
            Badge: { Gym: 'X', Library: 'X', Cafeteria: 'check' },
          },
          feedback: {
            correct: 'Clean elimination. Library and Gym are out, so the Cafeteria stands.',
            firstWrong: 'The Library is impossible (contradiction) and the Gym is ruled out by clue 3.',
            secondWrong: 'Mark Library = X and Gym = X. The only one left, Cafeteria, is a check.',
          },
          guidedReasoning: [
            'The Library creates a contradiction, so Library = X.',
            'Clue 3 says not the Gym, so Gym = X.',
            'Only the Cafeteria is left, so it gets a check.',
          ],
        },
      ],
    },
    {
      id: 'l4-step-6',
      type: 'multipleChoice',
      phase: 'challenge',
      prompt: 'Where is the badge?',
      visual: {
        kind: 'options',
        title: 'What we ruled out',
        items: [
          { label: 'Gym', mark: 'X' },
          { label: 'Library', mark: 'unknown' },
          { label: 'Cafeteria', mark: 'X' },
        ],
      },
      choices: [
        { id: 'a', label: 'Gym' },
        { id: 'b', label: 'Library' },
        { id: 'c', label: 'Cafeteria' },
        { id: 'd', label: 'Cannot be determined' },
      ],
      correctAnswer: 'b',
      feedback: {
        correct: 'Correct. The Library survives because the other two locations fail.',
        firstWrong: 'Cross out Gym and Cafeteria. What location survives?',
        secondWrong: 'Gym is impossible (contradiction) and the Cafeteria is ruled out. Only the Library remains.',
      },
      guidedReasoning: [
        'Gym is impossible because of the contradiction.',
        'The Cafeteria is impossible by clue 3.',
        'The Library is the only place left.',
      ],
      variants: [
        {
          prompt: 'Where is the badge?',
          visual: {
            kind: 'options',
            title: 'What we ruled out',
            items: [
              { label: 'Gym', mark: 'X' },
              { label: 'Library', mark: 'X' },
              { label: 'Cafeteria', mark: 'unknown' },
            ],
          },
          choices: [
            { id: 'a', label: 'Gym' },
            { id: 'b', label: 'Library' },
            { id: 'c', label: 'Cafeteria' },
            { id: 'd', label: 'Cannot be determined' },
          ],
          correctAnswer: 'c',
          feedback: {
            correct: 'Correct. The Cafeteria survives because the other two locations fail.',
            firstWrong: 'Cross out the Library and the Gym. What location survives?',
            secondWrong:
              'The Library is impossible (contradiction) and the Gym is ruled out. Only the Cafeteria remains.',
          },
          guidedReasoning: [
            'The Library is impossible because of the contradiction.',
            'The Gym is impossible by clue 3.',
            'The Cafeteria is the only place left.',
          ],
        },
        {
          prompt: 'Where is the badge?',
          visual: {
            kind: 'options',
            title: 'What we ruled out',
            items: [
              { label: 'Gym', mark: 'unknown' },
              { label: 'Library', mark: 'X' },
              { label: 'Cafeteria', mark: 'X' },
            ],
          },
          choices: [
            { id: 'a', label: 'Gym' },
            { id: 'b', label: 'Library' },
            { id: 'c', label: 'Cafeteria' },
            { id: 'd', label: 'Cannot be determined' },
          ],
          correctAnswer: 'a',
          feedback: {
            correct: 'Correct. The Gym survives because the other two locations fail.',
            firstWrong: 'Cross out the Library and the Cafeteria. What location survives?',
            secondWrong: 'The Library and the Cafeteria are ruled out. Only the Gym remains.',
          },
          guidedReasoning: [
            'The Library is ruled out.',
            'The Cafeteria is ruled out.',
            'The Gym is the only place left.',
          ],
        },
      ],
    },
    {
      id: 'l4-step-7',
      type: 'caseSummary',
      phase: 'completion',
      prompt: '',
      text: 'Contradictions are not mistakes to ignore. They are alarms. When a guess breaks a clue, throw the guess out.',
      akashLine: 'Room 4 complete. You can spot a contradiction now. The badge thanks you. I do not.',
      correctAnswer: null,
    },
  ],
}

const lesson5: Lesson = {
  id: 'lesson-5',
  title: 'Logic Switches',
  subtitle: 'Learn AND, OR, and NOT through switches.',
  doorLabel: 'Room 5',
  estimatedMinutes: 6,
  conceptTags: ['AND', 'OR', 'NOT'],
  unlockAfter: 'lesson-4',
  badgeId: 'logic-switches',
  steps: [
    {
      id: 'l5-step-1',
      type: 'dialogue',
      phase: 'intro',
      speaker: 'Akash',
      prompt: '',
      text: 'Welcome to the switch room. Finally, a room where the lights are smarter than some recruits. Case: The Three Security Doors. AND means both. OR means at least one. NOT flips true and false.',
      correctAnswer: null,
    },
    {
      id: 'l5-concept',
      type: 'concept',
      phase: 'intro',
      prompt: '',
      title: 'AND, OR, NOT',
      intro: 'Some doors open only with the right combination of switches. Three small words decide everything:',
      points: [
        {
          term: 'AND',
          detail: 'True only when BOTH parts are true.',
          example: 'Example: keycard AND code — you need both on.',
        },
        {
          term: 'OR',
          detail: 'True when AT LEAST ONE part is true.',
          example: 'Example: badge OR pass — either one works.',
        },
        {
          term: 'NOT',
          detail: 'Flips it. "NOT active" is true only when the switch is OFF.',
        },
        {
          term: 'Parentheses first',
          detail: 'Solve the part inside ( ) before the rest, just like in math.',
        },
      ],
      akashLine: 'AND is greedy, OR is easygoing, NOT is a contrarian. Remember that before you flip anything.',
      correctAnswer: null,
    },
    {
      id: 'l5-step-2',
      type: 'prediction',
      phase: 'micro-practice',
      prompt: 'For AND, is one true switch enough?',
      visual: {
        kind: 'switches',
        title: 'AND needs both',
        op: 'AND',
        items: [
          { label: 'Keycard', on: true },
          { label: 'Code', on: false },
        ],
        result: { label: 'Door locked', open: false },
      },
      choices: [
        { id: 'yes', label: 'Yes, one is enough' },
        { id: 'no', label: 'No, you need both' },
      ],
      correctAnswer: 'no',
      feedback: {
        correct: 'Right. AND demands both parts.',
        firstWrong: 'AND is greedy. It wants both.',
        secondWrong: 'AND only succeeds when both parts are true. One is not enough.',
      },
      guidedReasoning: ['AND means both parts must be true.', 'So a single true switch is not enough.'],
      variants: [
        {
          prompt: 'For AND, if BOTH switches are ON, does the door open?',
          visual: {
            kind: 'switches',
            title: 'AND needs both',
            op: 'AND',
            items: [
              { label: 'Keycard', on: true },
              { label: 'Code', on: true },
            ],
            result: { label: 'Door open', open: true },
          },
          choices: [
            { id: 'yes', label: 'Yes, both ON opens it' },
            { id: 'no', label: 'No, both ON is still not enough' },
          ],
          correctAnswer: 'yes',
          feedback: {
            correct: 'Right. AND opens only when both parts are true — and here both are.',
            firstWrong: 'AND wants both parts. Here you have both.',
            secondWrong: 'AND succeeds when both parts are true. Both are ON, so the door opens.',
          },
          guidedReasoning: ['AND means both parts must be true.', 'Both switches are ON, so AND is satisfied.'],
        },
        {
          prompt: 'For AND, if one switch is ON and one is OFF, does the door open?',
          visual: {
            kind: 'switches',
            title: 'AND needs both',
            op: 'AND',
            items: [
              { label: 'Keycard', on: false },
              { label: 'Code', on: true },
            ],
            result: { label: 'Door locked', open: false },
          },
          choices: [
            { id: 'yes', label: 'Yes, one ON is enough' },
            { id: 'no', label: 'No, it stays locked' },
          ],
          correctAnswer: 'no',
          feedback: {
            correct: 'Right. AND needs both ON. One ON and one OFF stays locked.',
            firstWrong: 'AND wants both parts true. One is OFF.',
            secondWrong: 'AND opens only when both are ON. One OFF keeps it locked.',
          },
          guidedReasoning: ['AND means both parts must be true.', 'One switch is OFF, so AND fails.'],
        },
      ],
    },
    {
      id: 'l5-step-3',
      type: 'logicSwitches',
      phase: 'guided-practice',
      prompt: 'Door 1 opens only if the keycard is active AND the code is correct. Open the door.',
      switches: [
        { id: 'keycard', label: 'Keycard active' },
        { id: 'code', label: 'Code correct' },
      ],
      rule: { kind: 'and', operands: [{ kind: 'var', id: 'keycard' }, { kind: 'var', id: 'code' }] },
      expectedSolution: { keycard: true, code: true },
      correctAnswer: true,
      feedback: {
        correct: 'Yes. AND means both switches must be true.',
        firstWrong: 'AND is greedy. It wants both. One true part is not enough.',
        secondWrong: 'AND means both switches must be ON. Turn on the keycard and the code.',
      },
      guidedReasoning: [
        'The door uses AND.',
        'AND needs both parts true.',
        'Turn ON both the keycard and the code.',
      ],
      variants: [
        {
          prompt: 'Door 1 opens only if the power is on AND the key is turned. Open the door.',
          switches: [
            { id: 'power', label: 'Power on' },
            { id: 'key', label: 'Key turned' },
          ],
          rule: { kind: 'and', operands: [{ kind: 'var', id: 'power' }, { kind: 'var', id: 'key' }] },
          expectedSolution: { power: true, key: true },
          correctAnswer: true,
          feedback: {
            correct: 'Yes. AND means both switches must be true.',
            firstWrong: 'AND is greedy. It wants both. One true part is not enough.',
            secondWrong: 'AND means both switches must be ON. Turn on the power and the key.',
          },
          guidedReasoning: [
            'The door uses AND.',
            'AND needs both parts true.',
            'Turn ON both the power and the key.',
          ],
        },
      ],
    },
    {
      id: 'l5-step-4',
      type: 'prediction',
      phase: 'micro-practice',
      prompt: 'For OR, how many true switches do you need?',
      visual: {
        kind: 'switches',
        title: 'OR needs at least one',
        op: 'OR',
        items: [
          { label: 'Badge', on: true },
          { label: 'Pass', on: false },
        ],
        result: { label: 'Door open', open: true },
      },
      choices: [
        { id: 'both', label: 'Both switches' },
        { id: 'one', label: 'At least one' },
        { id: 'none', label: 'None' },
      ],
      correctAnswer: 'one',
      feedback: {
        correct: 'Right. OR is happy with at least one.',
        firstWrong: 'OR is not as greedy as AND.',
        secondWrong: 'OR needs at least one true part. Both also works, but one is enough.',
      },
      guidedReasoning: ['OR means at least one part must be true.', 'One true switch already satisfies OR.'],
      variants: [
        {
          prompt: 'For OR, if both switches are OFF, does the door open?',
          visual: {
            kind: 'switches',
            title: 'OR needs at least one',
            op: 'OR',
            items: [
              { label: 'Badge', on: false },
              { label: 'Pass', on: false },
            ],
            result: { label: 'Door locked', open: false },
          },
          choices: [
            { id: 'yes', label: 'Yes, it opens' },
            { id: 'no', label: 'No, it stays closed' },
          ],
          correctAnswer: 'no',
          feedback: {
            correct: 'Right. OR needs at least one ON. Both OFF means it stays closed.',
            firstWrong: 'OR needs at least one true part. You have none.',
            secondWrong: 'OR opens with at least one ON. With both OFF, it stays closed.',
          },
          guidedReasoning: [
            'OR means at least one part must be true.',
            'Both switches are OFF, so OR is not satisfied.',
          ],
        },
        {
          prompt: 'For OR, if both switches are ON, does the door open?',
          visual: {
            kind: 'switches',
            title: 'OR needs at least one',
            op: 'OR',
            items: [
              { label: 'Badge', on: true },
              { label: 'Pass', on: true },
            ],
            result: { label: 'Door open', open: true },
          },
          choices: [
            { id: 'yes', label: 'Yes, it opens' },
            { id: 'no', label: 'No, both ON is too many' },
          ],
          correctAnswer: 'yes',
          feedback: {
            correct: 'Right. OR needs at least one ON — both ON certainly works.',
            firstWrong: 'OR is happy with one or more. Both ON is fine.',
            secondWrong: 'OR opens with at least one ON. Both ON still opens it.',
          },
          guidedReasoning: ['OR means at least one part must be true.', 'Both are ON, so OR is satisfied.'],
        },
      ],
    },
    {
      id: 'l5-step-5',
      type: 'logicSwitches',
      phase: 'guided-practice',
      prompt: 'Door 2 opens if the recruit has a badge OR a temporary pass. Open the door.',
      switches: [
        { id: 'badge', label: 'Badge' },
        { id: 'pass', label: 'Temporary pass' },
      ],
      rule: { kind: 'or', operands: [{ kind: 'var', id: 'badge' }, { kind: 'var', id: 'pass' }] },
      correctAnswer: true,
      feedback: {
        correct: 'Correct. OR is satisfied when at least one option is true.',
        firstWrong: 'OR needs at least one true part. You gave it nothing.',
        secondWrong: 'Flip at least one switch ON — badge or temporary pass.',
      },
      guidedReasoning: [
        'The door uses OR.',
        'OR needs at least one part true.',
        'Turn ON the badge, the pass, or both.',
      ],
      variants: [
        {
          prompt: 'Door 2 opens if you have a ticket OR a wristband. Open the door.',
          switches: [
            { id: 'ticket', label: 'Ticket' },
            { id: 'wristband', label: 'Wristband' },
          ],
          rule: { kind: 'or', operands: [{ kind: 'var', id: 'ticket' }, { kind: 'var', id: 'wristband' }] },
          correctAnswer: true,
          feedback: {
            correct: 'Correct. OR is satisfied when at least one option is true.',
            firstWrong: 'OR needs at least one true part. You gave it nothing.',
            secondWrong: 'Flip at least one switch ON — ticket or wristband.',
          },
          guidedReasoning: [
            'The door uses OR.',
            'OR needs at least one part true.',
            'Turn ON the ticket, the wristband, or both.',
          ],
        },
      ],
    },
    {
      id: 'l5-step-6',
      type: 'logicSwitches',
      phase: 'guided-practice',
      prompt: 'Door 3 opens if the alarm is NOT active. Open the door.',
      switches: [{ id: 'alarm', label: 'Alarm active' }],
      rule: { kind: 'not', operand: { kind: 'var', id: 'alarm' } },
      expectedSolution: { alarm: false },
      correctAnswer: true,
      feedback: {
        correct: 'Correct. NOT active means the alarm must be off.',
        firstWrong: 'NOT flips the statement. If the alarm is active, "NOT active" is false.',
        secondWrong: 'Turn the alarm OFF. NOT active means the alarm must be off.',
      },
      guidedReasoning: [
        'The door uses NOT.',
        'NOT flips true and false.',
        'For "NOT active" to be true, the alarm must be OFF.',
      ],
      variants: [
        {
          prompt: 'Door 3 opens if the lockdown is NOT on. Open the door.',
          switches: [{ id: 'lockdown', label: 'Lockdown on' }],
          rule: { kind: 'not', operand: { kind: 'var', id: 'lockdown' } },
          expectedSolution: { lockdown: false },
          correctAnswer: true,
          feedback: {
            correct: 'Correct. NOT on means the lockdown must be off.',
            firstWrong: 'NOT flips the statement. If the lockdown is on, "NOT on" is false.',
            secondWrong: 'Turn the lockdown OFF. NOT on means the lockdown must be off.',
          },
          guidedReasoning: [
            'The door uses NOT.',
            'NOT flips true and false.',
            'For "NOT on" to be true, the lockdown must be OFF.',
          ],
        },
      ],
    },
    {
      id: 'l5-step-7',
      type: 'prediction',
      phase: 'pattern-check',
      prompt: 'In (Keycard active AND Code correct) OR Emergency override, what should you check first?',
      choices: [
        { id: 'pair', label: 'The AND pair (keycard and code)' },
        { id: 'override', label: 'The override switch' },
        { id: 'random', label: 'Random switches' },
      ],
      correctAnswer: 'pair',
      feedback: {
        correct: 'Right. Handle the parentheses (the AND pair) first.',
        firstWrong: 'Parentheses come first in logic, just like in math.',
        secondWrong: 'The AND pair is inside parentheses, so it is evaluated first.',
      },
      guidedReasoning: [
        'Parentheses are evaluated first.',
        'The AND pair is inside the parentheses.',
        'So you handle the AND pair before the OR.',
      ],
      variants: [
        {
          prompt: 'In (Power on AND Key turned) OR Master switch, what should you check first?',
          choices: [
            { id: 'pair', label: 'The AND pair (power and key)' },
            { id: 'override', label: 'The master switch' },
            { id: 'random', label: 'Random switches' },
          ],
          correctAnswer: 'pair',
          feedback: {
            correct: 'Right. Handle the parentheses (the AND pair) first.',
            firstWrong: 'Parentheses come first in logic, just like in math.',
            secondWrong: 'The AND pair is inside parentheses, so it is evaluated first.',
          },
          guidedReasoning: [
            'Parentheses are evaluated first.',
            'The AND pair is inside the parentheses.',
            'So you handle the AND pair before the OR.',
          ],
        },
        {
          prompt: 'In (Badge OR Pass) AND Override, what should you check first?',
          choices: [
            { id: 'pair', label: 'The OR pair (badge and pass)' },
            { id: 'override', label: 'The override switch' },
            { id: 'random', label: 'Random switches' },
          ],
          correctAnswer: 'pair',
          feedback: {
            correct: 'Right. Handle the parentheses (the OR pair) first.',
            firstWrong: 'Parentheses come first in logic, just like in math.',
            secondWrong: 'The OR pair is inside parentheses, so it is evaluated first.',
          },
          guidedReasoning: [
            'Parentheses are evaluated first.',
            'The OR pair is inside the parentheses.',
            'So you handle the OR pair before the AND.',
          ],
        },
      ],
    },
    {
      id: 'l5-step-8',
      type: 'logicSwitches',
      phase: 'challenge',
      prompt: 'The final panel opens if: (Keycard active AND Code correct) OR Emergency override. Open it.',
      switches: [
        { id: 'keycard', label: 'Keycard active' },
        { id: 'code', label: 'Code correct' },
        { id: 'override', label: 'Emergency override' },
      ],
      rule: {
        kind: 'or',
        operands: [
          { kind: 'and', operands: [{ kind: 'var', id: 'keycard' }, { kind: 'var', id: 'code' }] },
          { kind: 'var', id: 'override' },
        ],
      },
      expectedSolution: { keycard: true, code: true, override: false },
      correctAnswer: true,
      feedback: {
        correct: 'Good. You handled AND before OR. Maybe the lights taught you something.',
        firstWrong: 'Handle the parentheses first. The keycard and code work as a pair. The override is a separate way through.',
        secondWrong: 'Turn on keycard AND code (the pair), or turn on the override by itself.',
      },
      guidedReasoning: [
        'The panel opens if the AND pair is true, OR if the override is on.',
        'Turn on BOTH the keycard and the code to satisfy the AND pair.',
        'Or just flip the override on by itself.',
      ],
      variants: [
        {
          prompt: 'The final panel opens if: (Power on AND Key turned) OR Master switch. Open it.',
          switches: [
            { id: 'power', label: 'Power on' },
            { id: 'key', label: 'Key turned' },
            { id: 'master', label: 'Master switch' },
          ],
          rule: {
            kind: 'or',
            operands: [
              { kind: 'and', operands: [{ kind: 'var', id: 'power' }, { kind: 'var', id: 'key' }] },
              { kind: 'var', id: 'master' },
            ],
          },
          expectedSolution: { power: true, key: true, master: false },
          correctAnswer: true,
          feedback: {
            correct: 'Good. You handled AND before OR. Maybe the lights taught you something.',
            firstWrong:
              'Handle the parentheses first. Power and key work as a pair. The master switch is a separate way through.',
            secondWrong: 'Turn on power AND key (the pair), or turn on the master switch by itself.',
          },
          guidedReasoning: [
            'The panel opens if the AND pair is true, OR if the master switch is on.',
            'Turn on BOTH power and key to satisfy the AND pair.',
            'Or just flip the master switch on by itself.',
          ],
        },
      ],
    },
    {
      id: 'l5-step-9',
      type: 'caseSummary',
      phase: 'completion',
      prompt: '',
      text: 'AND demands everything. OR accepts at least one. NOT flips the truth. Try remembering that before poking random switches.',
      akashLine: 'Room 5 complete. The lights are proud. I am merely not disappointed.',
      correctAnswer: null,
    },
  ],
}

const lesson6: Lesson = {
  id: 'lesson-6',
  title: 'Build the Case',
  subtitle: 'Put reasoning steps in a valid order.',
  doorLabel: 'Room 6',
  estimatedMinutes: 5,
  conceptTags: ['reasoning order', 'explanation'],
  unlockAfter: 'lesson-5',
  badgeId: 'build-the-case',
  steps: [
    {
      id: 'l6-step-1',
      type: 'dialogue',
      phase: 'intro',
      speaker: 'Akash',
      prompt: '',
      text: 'A correct answer without reasoning is just a lucky noise. Build the case. Case: The Science Fair Trophy. It is in the Lab, the Auditorium, or the Office.',
      correctAnswer: null,
    },
    {
      id: 'l6-concept',
      type: 'concept',
      phase: 'intro',
      prompt: '',
      title: 'Building an Explanation',
      intro: 'A right answer is not enough — you have to show how you got there. Strong reasoning is built in order:',
      points: [
        {
          term: '1. Start with the rule',
          detail: 'The if-then statement or the clue you are leaning on.',
        },
        {
          term: '2. Add the evidence',
          detail: 'The fact that triggers the rule.',
        },
        {
          term: '3. Then conclude',
          detail: 'The answer follows from the rule plus the evidence.',
        },
        {
          term: 'Order matters',
          detail: 'Go clue \u2192 elimination \u2192 conclusion. Never start with the conclusion.',
        },
      ],
      akashLine: 'Anyone can shout an answer. A detective can explain it, in order, without flinching.',
      correctAnswer: null,
    },
    {
      id: 'l6-step-2',
      type: 'ordering',
      phase: 'micro-practice',
      prompt: 'Put these two steps in the right order.',
      items: [
        { id: 'look', text: 'Look at the clues.' },
        { id: 'conclude', text: 'State your conclusion.' },
      ],
      correctAnswer: ['look', 'conclude'],
      feedback: {
        correct: 'Right. Clues first, conclusion last.',
        firstWrong: 'You cannot conclude before you read the clues.',
        secondWrong: 'First look at the clues. Then state the conclusion.',
      },
      guidedReasoning: ['Reasoning starts with the clues.', 'The conclusion comes at the end.'],
      variants: [
        {
          prompt: 'Put these two steps in the right order.',
          items: [
            { id: 'look', text: 'Read the evidence first.' },
            { id: 'conclude', text: 'Then decide the answer.' },
          ],
          correctAnswer: ['look', 'conclude'],
          feedback: {
            correct: 'Right. Evidence first, decision last.',
            firstWrong: 'You cannot decide before you read the evidence.',
            secondWrong: 'First read the evidence. Then decide the answer.',
          },
          guidedReasoning: ['Reasoning starts with the evidence.', 'The decision comes at the end.'],
        },
      ],
    },
    {
      id: 'l6-step-3',
      type: 'ordering',
      phase: 'micro-practice',
      prompt: 'Order these three reasoning steps: rule, evidence, conclusion.',
      items: [
        { id: 'rule', text: 'If the trophy were in the Lab, the camera would have recorded it.' },
        { id: 'evidence', text: 'The camera did not record it.' },
        { id: 'concl', text: 'So the trophy is not in the Lab.' },
      ],
      correctAnswer: ['rule', 'evidence', 'concl'],
      feedback: {
        correct: 'Yes. Rule, then evidence, then conclusion.',
        firstWrong: 'Start with the rule, then bring in the evidence, then conclude.',
        secondWrong: 'Order: the "if-then" rule, then "the camera did not record it", then "not the Lab".',
      },
      guidedReasoning: [
        'Start with the rule (the if-then statement).',
        'Then add the evidence (the camera did not record it).',
        'Then the conclusion follows (not the Lab).',
      ],
      variants: [
        {
          prompt: 'Order these three reasoning steps: rule, evidence, conclusion.',
          items: [
            { id: 'rule', text: 'If the trophy were in the Office, the door log would show it.' },
            { id: 'evidence', text: 'The door log shows nothing.' },
            { id: 'concl', text: 'So the trophy is not in the Office.' },
          ],
          correctAnswer: ['rule', 'evidence', 'concl'],
          feedback: {
            correct: 'Yes. Rule, then evidence, then conclusion.',
            firstWrong: 'Start with the rule, then bring in the evidence, then conclude.',
            secondWrong: 'Order: the "if-then" rule, then "the door log shows nothing", then "not the Office".',
          },
          guidedReasoning: [
            'Start with the rule (the if-then statement).',
            'Then add the evidence (the door log shows nothing).',
            'Then the conclusion follows (not the Office).',
          ],
        },
      ],
    },
    {
      id: 'l6-step-4',
      type: 'highlightChoice',
      phase: 'guided-practice',
      prompt: 'Which clue lets you eliminate the Lab?',
      choices: [
        { id: 'c1', label: 'If the trophy is in the Lab, the security camera recorded it.' },
        { id: 'c2', label: 'The security camera did not record the trophy.' },
        { id: 'c3', label: 'The trophy is not in the Office.' },
      ],
      correctAnswer: 'c2',
      feedback: {
        correct: 'Right. The camera clue collides with the Lab rule, eliminating the Lab.',
        firstWrong: 'Which clue contradicts what the Lab would require?',
        secondWrong: 'The Lab rule says the camera WOULD record it. "The camera did not record it" breaks that — so it eliminates the Lab.',
      },
      guidedReasoning: [
        'The Lab rule says: if Lab, then the camera recorded it.',
        'The clue "the camera did not record it" contradicts that.',
        'So that clue eliminates the Lab.',
      ],
      variants: [
        {
          prompt: 'Which clue lets you eliminate the Office?',
          choices: [
            { id: 'c1', label: 'If the trophy is in the Office, the door log records it.' },
            { id: 'c2', label: 'The door log recorded nothing.' },
            { id: 'c3', label: 'The trophy is not in the Lab.' },
          ],
          correctAnswer: 'c2',
          feedback: {
            correct: 'Right. The door-log clue collides with the Office rule, eliminating the Office.',
            firstWrong: 'Which clue contradicts what the Office would require?',
            secondWrong:
              'The Office rule says the door log WOULD record it. "The door log recorded nothing" breaks that — so it eliminates the Office.',
          },
          guidedReasoning: [
            'The Office rule says: if Office, then the door log records it.',
            'The clue "the door log recorded nothing" contradicts that.',
            'So that clue eliminates the Office.',
          ],
        },
        {
          prompt: 'Which clue lets you eliminate the Vault?',
          choices: [
            { id: 'c1', label: 'If the trophy is in the Vault, the motion sensor pings.' },
            { id: 'c2', label: 'The motion sensor never pinged.' },
            { id: 'c3', label: 'The trophy is not in the Office.' },
          ],
          correctAnswer: 'c2',
          feedback: {
            correct: 'Right. The motion-sensor clue collides with the Vault rule, eliminating the Vault.',
            firstWrong: 'Which clue contradicts what the Vault would require?',
            secondWrong:
              'The Vault rule says the sensor WOULD ping. "The sensor never pinged" breaks that — so it eliminates the Vault.',
          },
          guidedReasoning: [
            'The Vault rule says: if Vault, then the sensor pings.',
            'The clue "the sensor never pinged" contradicts that.',
            'So that clue eliminates the Vault.',
          ],
        },
      ],
    },
    {
      id: 'l6-step-5',
      type: 'ordering',
      phase: 'challenge',
      prompt:
        'The science fair trophy is in one of three rooms: Lab, Auditorium, or Office. Put the reasoning steps in the correct order.',
      items: [
        { id: 'A', text: 'The trophy cannot be in the Lab.' },
        { id: 'B', text: 'If the trophy were in the Lab, the camera would have recorded it.' },
        { id: 'C', text: 'The camera did not record it.' },
        { id: 'D', text: 'The trophy is not in the Office.' },
        { id: 'E', text: 'The only place left is the Auditorium.' },
      ],
      correctAnswer: ['B', 'C', 'A', 'D', 'E'],
      feedback: {
        correct: 'Yes. That is a case, not a pile of sentences.',
        firstWrong: 'Your conclusion came too early. Build from clue to elimination to answer.',
        secondWrong:
          'Start with the Lab rule, then use the camera clue to eliminate Lab. Then eliminate Office. Then choose what remains.',
      },
      guidedReasoning: [
        'Begin with the Lab rule (B).',
        'Add the camera evidence (C).',
        'Conclude the Lab is out (A).',
        'Eliminate the Office (D).',
        'Only the Auditorium remains (E).',
      ],
      variants: [
        {
          prompt:
            'The science fair trophy is in one of three rooms: Lab, Auditorium, or Office. Put the reasoning steps in the correct order.',
          items: [
            { id: 'A', text: 'The trophy cannot be in the Office.' },
            { id: 'B', text: 'If the trophy were in the Office, the door log would show it.' },
            { id: 'C', text: 'The door log shows nothing.' },
            { id: 'D', text: 'The trophy is not in the Lab.' },
            { id: 'E', text: 'The only place left is the Auditorium.' },
          ],
          correctAnswer: ['B', 'C', 'A', 'D', 'E'],
          feedback: {
            correct: 'Yes. That is a case, not a pile of sentences.',
            firstWrong: 'Your conclusion came too early. Build from clue to elimination to answer.',
            secondWrong:
              'Start with the Office rule, then use the door-log clue to eliminate the Office. Then eliminate the Lab. Then choose what remains.',
          },
          guidedReasoning: [
            'Begin with the Office rule (B).',
            'Add the door-log evidence (C).',
            'Conclude the Office is out (A).',
            'Eliminate the Lab (D).',
            'Only the Auditorium remains (E).',
          ],
        },
      ],
    },
    {
      id: 'l6-step-6',
      type: 'multipleChoice',
      phase: 'pattern-check',
      prompt: "Why can't the trophy be in the Lab?",
      choices: [
        { id: 'a', label: 'Because the Office is locked.' },
        { id: 'b', label: 'Because if it were in the Lab, the camera would have recorded it, but the camera did not.' },
        { id: 'c', label: 'Because the Auditorium is bigger.' },
        { id: 'd', label: 'Because trophies are never in labs.' },
      ],
      correctAnswer: 'b',
      feedback: {
        correct: 'The reason must connect directly to the clues. No random assumptions.',
        firstWrong: 'The reason must connect directly to the clues. No random assumptions.',
        secondWrong: 'The Lab rule plus the camera evidence is the only reason that uses the clues.',
      },
      guidedReasoning: [
        'A strong reason uses the clues directly.',
        'The Lab rule plus "the camera did not record it" rules out the Lab.',
      ],
      variants: [
        {
          prompt: "Why can't the trophy be in the Office?",
          choices: [
            { id: 'a', label: 'Because the Lab is locked.' },
            { id: 'b', label: 'Because if it were in the Office, the door log would show it, but it showed nothing.' },
            { id: 'c', label: 'Because the Auditorium is bigger.' },
            { id: 'd', label: 'Because trophies are never in offices.' },
          ],
          correctAnswer: 'b',
          feedback: {
            correct: 'The reason must connect directly to the clues. No random assumptions.',
            firstWrong: 'The reason must connect directly to the clues. No random assumptions.',
            secondWrong: 'The Office rule plus the door-log evidence is the only reason that uses the clues.',
          },
          guidedReasoning: [
            'A strong reason uses the clues directly.',
            'The Office rule plus "the door log showed nothing" rules out the Office.',
          ],
        },
        {
          prompt: "Why can't the trophy be in the Vault?",
          choices: [
            { id: 'a', label: 'Because the Office is locked.' },
            { id: 'b', label: 'Because if it were in the Vault, the motion sensor would ping, but it never pinged.' },
            { id: 'c', label: 'Because the Auditorium is bigger.' },
            { id: 'd', label: 'Because trophies are never in vaults.' },
          ],
          correctAnswer: 'b',
          feedback: {
            correct: 'The reason must connect directly to the clues. No random assumptions.',
            firstWrong: 'The reason must connect directly to the clues. No random assumptions.',
            secondWrong: 'The Vault rule plus the motion-sensor evidence is the only reason that uses the clues.',
          },
          guidedReasoning: [
            'A strong reason uses the clues directly.',
            'The Vault rule plus "the sensor never pinged" rules out the Vault.',
          ],
        },
      ],
    },
    {
      id: 'l6-step-7',
      type: 'multipleChoice',
      phase: 'reflection',
      prompt: 'What makes a strong explanation?',
      choices: [
        { id: 'a', label: 'It uses clues in order to reach a conclusion.' },
        { id: 'b', label: 'It is the longest answer.' },
        { id: 'c', label: 'It sounds confident.' },
        { id: 'd', label: 'It guesses quickly.' },
      ],
      correctAnswer: 'a',
      feedback: {
        correct: 'Exactly. Clue, clue, elimination, conclusion.',
        firstWrong: 'Length and confidence are not reasoning.',
        secondWrong: 'A strong explanation uses the clues in order to reach the conclusion.',
      },
      guidedReasoning: [
        'A strong explanation is built from the clues.',
        'It moves in order from clues to elimination to conclusion.',
      ],
      variants: [
        {
          prompt: 'What makes a strong explanation?',
          choices: [
            { id: 'a', label: 'It connects clues in order to reach the conclusion.' },
            { id: 'b', label: 'It uses the biggest words.' },
            { id: 'c', label: 'It states the answer first.' },
            { id: 'd', label: 'It skips the clues.' },
          ],
          correctAnswer: 'a',
          feedback: {
            correct: 'Exactly. Clue, clue, elimination, conclusion.',
            firstWrong: 'Big words and shortcuts are not reasoning.',
            secondWrong: 'A strong explanation connects the clues in order to reach the conclusion.',
          },
          guidedReasoning: [
            'A strong explanation is built from the clues.',
            'It moves in order from clues to elimination to conclusion.',
          ],
        },
        {
          prompt: 'Which is the best sign of strong reasoning?',
          choices: [
            { id: 'a', label: 'Each step follows from a clue.' },
            { id: 'b', label: 'It is said loudly.' },
            { id: 'c', label: 'It reaches the answer fastest.' },
            { id: 'd', label: 'It ignores clues that disagree.' },
          ],
          correctAnswer: 'a',
          feedback: {
            correct: 'Exactly. Every step should follow from a clue.',
            firstWrong: 'Volume and speed are not reasoning.',
            secondWrong: 'Strong reasoning means each step follows from a clue.',
          },
          guidedReasoning: [
            'Strong reasoning is built from the clues.',
            'Each step should follow from a clue, in order.',
          ],
        },
      ],
    },
    {
      id: 'l6-step-8',
      type: 'caseSummary',
      phase: 'completion',
      prompt: '',
      text: 'Good reasoning has a spine. Clue, clue, elimination, conclusion.',
      akashLine: 'Room 6 complete. You can explain yourself now. Briefly. Please keep it brief.',
      correctAnswer: null,
    },
  ],
}

const lesson7: Lesson = {
  id: 'lesson-7',
  title: 'Final Challenge Room',
  subtitle: 'Combine every skill to escape the Logic Locker.',
  doorLabel: 'Room 7',
  estimatedMinutes: 9,
  conceptTags: ['combined deduction', 'final'],
  unlockAfter: 'lesson-6',
  badgeId: 'final-challenge',
  steps: [
    {
      id: 'l7-step-1',
      type: 'dialogue',
      phase: 'intro',
      speaker: 'Akash',
      prompt: '',
      text: 'Final room, rookie. Solve this and you escape Logic Locker. Fail enough times and the spotlight shuts off. Dramatic? Yes. Necessary? Also yes.',
      correctAnswer: null,
    },
    {
      id: 'l7-concept',
      type: 'concept',
      phase: 'intro',
      prompt: '',
      title: 'Your Detective Toolkit',
      intro: 'This is the final case, so you will need every skill from the academy. Here is your toolkit before you walk in:',
      points: [
        {
          term: 'Sort the clues',
          detail: 'Separate facts, eliminations, and if-then rules before you start.',
        },
        {
          term: 'Use the grid',
          detail: 'One \u2713 forces many \u2715\u2019s across its row and column.',
        },
        {
          term: 'Catch contradictions',
          detail: 'Throw out any guess that breaks a clue.',
        },
        {
          term: 'Order your reasoning',
          detail: 'Build the case step by step: clue \u2192 elimination \u2192 conclusion.',
        },
      ],
      akashLine: 'Everything you learned, in one room. No pressure. Well — some pressure.',
      correctAnswer: null,
    },
    {
      id: 'l7-step-2',
      type: 'caseSummary',
      phase: 'intro',
      prompt: '',
      text: 'Three recruits — Nora, Malik, and Tess — each found one item and unlocked one door. Items: Keycard, Map, Flashlight. Doors: Red Door, Blue Door, Green Door. Figure out which item each recruit found and which door each unlocked.',
      correctAnswer: null,
    },
    {
      id: 'l7-step-3',
      type: 'clueSort',
      phase: 'guided-practice',
      prompt: 'Sort these clues before solving. A direct fact gives a match. An elimination removes a possibility. A conditional clue links two facts.',
      categories: ['Direct Fact', 'Elimination', 'Conditional Clue', 'Not Enough Information'],
      cards: [
        { id: 'c1', text: 'Malik did not find the Flashlight.' },
        { id: 'c2', text: 'The recruit with the Keycard opened the Blue Door.' },
        { id: 'c3', text: 'Tess opened the Green Door.' },
        { id: 'c4', text: 'Nora might have found the Map.' },
        { id: 'c5', text: 'Nora did not open the Blue Door.' },
        { id: 'c6', text: 'The Flashlight was not used on the Green Door.' },
      ],
      correctAnswer: {
        c1: 'Elimination',
        c2: 'Conditional Clue',
        c3: 'Direct Fact',
        c4: 'Not Enough Information',
        c5: 'Elimination',
        c6: 'Elimination',
      },
      feedback: {
        correct: 'Sorted. Now you know which clues give matches and which remove options.',
        firstWrong: 'Sort the clues by what they do, not by what they mention.',
        secondWrong:
          'A direct fact gives a match (Tess opened Green). An elimination removes a possibility ("did not"). A conditional clue links two facts ("the recruit with X did Y"). "Might have" is not enough information.',
      },
      guidedReasoning: [
        'Direct fact: states a match outright (Tess opened the Green Door).',
        'Elimination: removes an option ("did not...").',
        'Conditional clue: links two facts ("the recruit with the Keycard opened the Blue Door").',
        '"Nora might have found the Map" proves nothing — not enough information.',
      ],
      variants: [
        {
          prompt: 'Sort these clues before solving. A direct fact gives a match. An elimination removes a possibility. A conditional clue links two facts.',
          categories: ['Direct Fact', 'Elimination', 'Conditional Clue', 'Not Enough Information'],
          cards: [
            { id: 'c1', text: 'Nora did not find the Flashlight.' },
            { id: 'c2', text: 'The recruit with the Keycard opened the Blue Door.' },
            { id: 'c3', text: 'Tess opened the Blue Door.' },
            { id: 'c4', text: 'Malik might have found the Map.' },
            { id: 'c5', text: 'Malik did not open the Red Door.' },
            { id: 'c6', text: 'The Flashlight was not used on the Blue Door.' },
          ],
          correctAnswer: {
            c1: 'Elimination',
            c2: 'Conditional Clue',
            c3: 'Direct Fact',
            c4: 'Not Enough Information',
            c5: 'Elimination',
            c6: 'Elimination',
          },
          feedback: {
            correct: 'Sorted. Now you know which clues give matches and which remove options.',
            firstWrong: 'Sort the clues by what they do, not by what they mention.',
            secondWrong:
              'A direct fact gives a match (Tess opened Blue). An elimination removes a possibility ("did not"). A conditional clue links two facts ("the recruit with X did Y"). "Might have" is not enough information.',
          },
          guidedReasoning: [
            'Direct fact: states a match outright (Tess opened the Blue Door).',
            'Elimination: removes an option ("did not...").',
            'Conditional clue: links two facts ("the recruit with the Keycard opened the Blue Door").',
            '"Malik might have found the Map" proves nothing — not enough information.',
          ],
        },
      ],
    },
    {
      id: 'l7-step-4',
      type: 'highlightChoice',
      phase: 'guided-practice',
      prompt: 'Which clue is the most useful place to START?',
      visual: {
        kind: 'clues',
        title: 'Your clues',
        items: [
          'Malik did not find the Flashlight.',
          'The recruit with the Keycard opened the Blue Door.',
          'Tess opened the Green Door.',
          'Nora might have found the Map.',
          'Nora did not open the Blue Door.',
          'The Flashlight was not used on the Green Door.',
        ],
      },
      choices: [
        { id: 'a', label: 'Tess opened the Green Door.' },
        { id: 'b', label: 'Nora might have found the Map.' },
        { id: 'c', label: 'Malik did not find the Flashlight.' },
      ],
      correctAnswer: 'a',
      feedback: {
        correct: 'Right. A direct fact is the best starting point.',
        firstWrong: 'Start with a clue that gives you a definite match, not a maybe.',
        secondWrong: '"Tess opened the Green Door" is a direct fact — the strongest starting point.',
      },
      guidedReasoning: [
        'Start with the clue that gives a certain match.',
        '"Tess opened the Green Door" is a direct fact.',
        'Direct facts unlock the rest of the chain.',
      ],
      variants: [
        {
          prompt: 'Which clue is the most useful place to START?',
          visual: {
            kind: 'clues',
            title: 'Your clues',
            items: [
              'Nora did not find the Flashlight.',
              'The recruit with the Keycard opened the Blue Door.',
              'Tess opened the Blue Door.',
              'Malik might have found the Map.',
              'Malik did not open the Red Door.',
              'The Flashlight was not used on the Blue Door.',
            ],
          },
          choices: [
            { id: 'a', label: 'Tess opened the Blue Door.' },
            { id: 'b', label: 'Malik might have found the Map.' },
            { id: 'c', label: 'Nora did not find the Flashlight.' },
          ],
          correctAnswer: 'a',
          feedback: {
            correct: 'Right. A direct fact is the best starting point.',
            firstWrong: 'Start with a clue that gives you a definite match, not a maybe.',
            secondWrong: '"Tess opened the Blue Door" is a direct fact — the strongest starting point.',
          },
          guidedReasoning: [
            'Start with the clue that gives a certain match.',
            '"Tess opened the Blue Door" is a direct fact.',
            'Direct facts unlock the rest of the chain.',
          ],
        },
        {
          prompt: 'Which clue is the most useful place to START?',
          visual: {
            kind: 'clues',
            title: 'Your clues',
            items: [
              'Malik did not find the Map.',
              'The recruit with the Keycard opened the Red Door.',
              'Nora opened the Red Door.',
              'Tess might have found the Flashlight.',
              'Tess did not open the Green Door.',
              'The Map was not used on the Red Door.',
            ],
          },
          choices: [
            { id: 'a', label: 'Nora opened the Red Door.' },
            { id: 'b', label: 'Tess might have found the Flashlight.' },
            { id: 'c', label: 'Malik did not find the Map.' },
          ],
          correctAnswer: 'a',
          feedback: {
            correct: 'Right. A direct fact is the best starting point.',
            firstWrong: 'Start with a clue that gives you a definite match, not a maybe.',
            secondWrong: '"Nora opened the Red Door" is a direct fact — the strongest starting point.',
          },
          guidedReasoning: [
            'Start with the clue that gives a certain match.',
            '"Nora opened the Red Door" is a direct fact.',
            'Direct facts unlock the rest of the chain.',
          ],
        },
      ],
    },
    {
      id: 'l7-step-5',
      type: 'miniGrid',
      phase: 'guided-practice',
      prompt:
        "Item grid warmup. Three recruits — Nora, Malik, and Tess — each found one item: a Keycard, a Map, or a Flashlight. Tess opened the Green Door. The Flashlight was not used on the Green Door, and the Keycard opened the Blue Door. Mark Tess's item row.",
      rows: ['Nora', 'Malik', 'Tess'],
      cols: ['Keycard', 'Map', 'Flashlight'],
      clues: [
        'Tess opened the Green Door.',
        'The Flashlight was not used on the Green Door.',
        'The recruit with the Keycard opened the Blue Door.',
      ],
      correctAnswer: {
        Tess: { Keycard: 'X', Map: 'check', Flashlight: 'X' },
      },
      feedback: {
        correct: 'Good. You found the item chain. I nearly smiled. Nearly.',
        firstWrong: 'Check Tess first. Green Door tells you more than it looks like.',
        secondWrong:
          'Tess opened Green. Flashlight was not used on Green, and Keycard opens Blue. So Tess cannot be Flashlight or Keycard. Tess must be Map.',
      },
      guidedReasoning: [
        'Tess opened Green, but the Flashlight was not used on Green, so Tess is not Flashlight.',
        'The Keycard opened Blue, but Tess opened Green, so Tess is not Keycard.',
        'That leaves the Map for Tess.',
      ],
      variants: [
        {
          prompt:
            "Item grid warmup. Three recruits — Nora, Malik, and Tess — each found one item: a Keycard, a Map, or a Flashlight. Tess opened the Blue Door, and the recruit with the Keycard opened the Blue Door. Mark Tess's item row.",
          clues: [
            'Tess opened the Blue Door.',
            'The recruit with the Keycard opened the Blue Door.',
          ],
          correctAnswer: {
            Tess: { Keycard: 'check', Map: 'X', Flashlight: 'X' },
          },
          feedback: {
            correct: 'Good. You found the item chain. I nearly smiled. Nearly.',
            firstWrong: 'Check Tess first. The Blue Door tells you more than it looks like.',
            secondWrong:
              'Tess opened Blue, and the Keycard opened Blue. So Tess had the Keycard. Map and Flashlight are X.',
          },
          guidedReasoning: [
            'Tess opened the Blue Door.',
            'The Keycard opened the Blue Door, so Tess had the Keycard.',
            'So Tess is not the Map or the Flashlight.',
          ],
        },
      ],
    },
    {
      id: 'l7-step-6',
      type: 'deductionGrid',
      phase: 'challenge',
      prompt: 'Complete the full item grid. Three recruits — Nora, Malik, and Tess — each found one item: a Keycard, a Map, or a Flashlight. Use the clues to find who found each.',
      rows: ['Nora', 'Malik', 'Tess'],
      cols: ['Keycard', 'Map', 'Flashlight'],
      clues: [
        'Malik did not find the Flashlight.',
        'Tess opened the Green Door.',
        'The Flashlight was not used on the Green Door.',
        'The recruit with the Keycard opened the Blue Door.',
      ],
      showConsequences: true,
      correctAnswer: {
        Nora: { Keycard: 'X', Map: 'X', Flashlight: 'check' },
        Malik: { Keycard: 'check', Map: 'X', Flashlight: 'X' },
        Tess: { Keycard: 'X', Map: 'check', Flashlight: 'X' },
      },
      feedback: {
        correct: 'Good. You found the item chain. I nearly smiled. Nearly.',
        firstWrong: 'Check Tess first. Green Door tells you more than it looks like.',
        secondWrong:
          'Tess has the Map. Malik did not have the Flashlight and cannot have the Map, so Malik has the Keycard. That leaves the Flashlight for Nora.',
      },
      guidedReasoning: [
        'Tess opened Green, the Flashlight was not used on Green, and the Keycard opened Blue, so Tess has the Map.',
        'Malik did not have the Flashlight, and the Map is taken, so Malik has the Keycard.',
        'That leaves the Flashlight for Nora.',
      ],
      variants: [
        {
          prompt: 'Complete the full item grid. Three recruits — Nora, Malik, and Tess — each found one item: a Keycard, a Map, or a Flashlight. Use the clues to find who found each.',
          clues: [
            'Nora did not find the Flashlight.',
            'Tess opened the Blue Door.',
            'The recruit with the Keycard opened the Blue Door.',
          ],
          correctAnswer: {
            Nora: { Keycard: 'X', Map: 'check', Flashlight: 'X' },
            Malik: { Keycard: 'X', Map: 'X', Flashlight: 'check' },
            Tess: { Keycard: 'check', Map: 'X', Flashlight: 'X' },
          },
          feedback: {
            correct: 'Good. You found the item chain. I nearly smiled. Nearly.',
            firstWrong: 'Check Tess first. The Blue Door tells you more than it looks like.',
            secondWrong:
              'Tess had the Keycard. Nora did not have the Flashlight and cannot have the Keycard, so Nora has the Map. That leaves the Flashlight for Malik.',
          },
          guidedReasoning: [
            'Tess opened Blue and the Keycard opened Blue, so Tess has the Keycard.',
            'Nora did not have the Flashlight, and the Keycard is taken, so Nora has the Map.',
            'That leaves the Flashlight for Malik.',
          ],
        },
      ],
    },
    {
      id: 'l7-step-7',
      type: 'miniGrid',
      phase: 'guided-practice',
      prompt: "Door grid warmup. The same three recruits — Nora, Malik, and Tess — each opened one door: the Red Door, the Blue Door, or the Green Door. Malik had the Keycard, and the Keycard opened the Blue Door. Mark Malik's door row.",
      rows: ['Nora', 'Malik', 'Tess'],
      cols: ['Red Door', 'Blue Door', 'Green Door'],
      clues: ['The recruit with the Keycard opened the Blue Door.', 'Malik had the Keycard.'],
      correctAnswer: {
        Malik: { 'Red Door': 'X', 'Blue Door': 'check', 'Green Door': 'X' },
      },
      feedback: {
        correct: 'Right. Keycard opens Blue, and Malik had the Keycard.',
        firstWrong: 'The Keycard opens Blue, and Malik had the Keycard. That gives you Malik\'s door.',
        secondWrong: 'Malik had the Keycard, so Malik opened the Blue Door. His other doors are X.',
      },
      guidedReasoning: [
        'The Keycard opened the Blue Door.',
        'Malik had the Keycard.',
        'So Malik opened the Blue Door — Red and Green are X for him.',
      ],
      variants: [
        {
          prompt: "Door grid warmup. The same three recruits — Nora, Malik, and Tess — each opened one door: the Red Door, the Blue Door, or the Green Door. Tess had the Keycard, and the Keycard opened the Blue Door. Mark Tess's door row.",
          clues: ['The recruit with the Keycard opened the Blue Door.', 'Tess had the Keycard.'],
          correctAnswer: {
            Tess: { 'Red Door': 'X', 'Blue Door': 'check', 'Green Door': 'X' },
          },
          feedback: {
            correct: 'Right. Keycard opens Blue, and Tess had the Keycard.',
            firstWrong: 'The Keycard opens Blue, and Tess had the Keycard. That gives you Tess\'s door.',
            secondWrong: 'Tess had the Keycard, so Tess opened the Blue Door. Her other doors are X.',
          },
          guidedReasoning: [
            'The Keycard opened the Blue Door.',
            'Tess had the Keycard.',
            'So Tess opened the Blue Door — Red and Green are X for her.',
          ],
        },
      ],
    },
    {
      id: 'l7-step-8',
      type: 'deductionGrid',
      phase: 'challenge',
      prompt: 'Complete the full door grid. Nora, Malik, and Tess each opened one door: the Red Door, the Blue Door, or the Green Door. Use the clues to find who opened each.',
      rows: ['Nora', 'Malik', 'Tess'],
      cols: ['Red Door', 'Blue Door', 'Green Door'],
      clues: [
        'Tess opened the Green Door.',
        'Nora did not open the Blue Door.',
        'The recruit with the Keycard opened the Blue Door.',
        'Malik had the Keycard.',
      ],
      showConsequences: true,
      correctAnswer: {
        Nora: { 'Red Door': 'check', 'Blue Door': 'X', 'Green Door': 'X' },
        Malik: { 'Red Door': 'X', 'Blue Door': 'check', 'Green Door': 'X' },
        Tess: { 'Red Door': 'X', 'Blue Door': 'X', 'Green Door': 'check' },
      },
      feedback: {
        correct: 'Yes. You matched the doors without making the grid cry.',
        firstWrong: 'The Keycard opens Blue, and Malik had the Keycard. That gives you Malik\'s door.',
        secondWrong: 'Malik had Keycard, so Malik opened Blue. Tess opened Green. That leaves Red for Nora.',
      },
      guidedReasoning: [
        'Malik had the Keycard, so Malik opened the Blue Door.',
        'Tess opened the Green Door.',
        'That leaves the Red Door for Nora.',
      ],
      variants: [
        {
          prompt: 'Complete the full door grid. Nora, Malik, and Tess each opened one door: the Red Door, the Blue Door, or the Green Door. Use the clues to find who opened each.',
          clues: [
            'Tess opened the Blue Door.',
            'Malik did not open the Red Door.',
            'The recruit with the Keycard opened the Blue Door.',
            'Tess had the Keycard.',
          ],
          correctAnswer: {
            Nora: { 'Red Door': 'check', 'Blue Door': 'X', 'Green Door': 'X' },
            Malik: { 'Red Door': 'X', 'Blue Door': 'X', 'Green Door': 'check' },
            Tess: { 'Red Door': 'X', 'Blue Door': 'check', 'Green Door': 'X' },
          },
          feedback: {
            correct: 'Yes. You matched the doors without making the grid cry.',
            firstWrong: 'Tess had the Keycard, and the Keycard opens Blue. That gives you Tess\'s door.',
            secondWrong: 'Tess opened Blue. Malik did not open Red, so Malik opened Green. That leaves Red for Nora.',
          },
          guidedReasoning: [
            'Tess had the Keycard, so Tess opened the Blue Door.',
            'Malik did not open the Red Door, so Malik opened the Green Door.',
            'That leaves the Red Door for Nora.',
          ],
        },
      ],
    },
    {
      id: 'l7-step-9',
      type: 'logicSwitches',
      phase: 'challenge',
      prompt:
        'The exit opens if: (Malik opened Blue AND Tess opened Green) OR Emergency Override. You solved the case, so use the normal exit condition.',
      switches: [
        { id: 'malikBlue', label: 'Malik opened Blue' },
        { id: 'tessGreen', label: 'Tess opened Green' },
        { id: 'override', label: 'Emergency Override' },
      ],
      rule: {
        kind: 'or',
        operands: [
          { kind: 'and', operands: [{ kind: 'var', id: 'malikBlue' }, { kind: 'var', id: 'tessGreen' }] },
          { kind: 'var', id: 'override' },
        ],
      },
      expectedSolution: { malikBlue: true, tessGreen: true, override: false },
      correctAnswer: true,
      feedback: {
        correct: 'You solved the case, so the normal exit condition works. Override is not needed.',
        firstWrong: 'You proved Malik opened Blue and Tess opened Green. Turn those on.',
        secondWrong: 'Turn on "Malik opened Blue" AND "Tess opened Green". The override can stay off.',
      },
      guidedReasoning: [
        'You proved Malik opened Blue and Tess opened Green.',
        'That satisfies the AND pair, so the exit opens.',
        'You do not need the emergency override.',
      ],
      variants: [
        {
          prompt:
            'The exit opens if: (Tess opened Blue AND Malik opened Green) OR Emergency Override. You solved the case, so use the normal exit condition.',
          switches: [
            { id: 'tessBlue', label: 'Tess opened Blue' },
            { id: 'malikGreen', label: 'Malik opened Green' },
            { id: 'override', label: 'Emergency Override' },
          ],
          rule: {
            kind: 'or',
            operands: [
              { kind: 'and', operands: [{ kind: 'var', id: 'tessBlue' }, { kind: 'var', id: 'malikGreen' }] },
              { kind: 'var', id: 'override' },
            ],
          },
          expectedSolution: { tessBlue: true, malikGreen: true, override: false },
          correctAnswer: true,
          feedback: {
            correct: 'You solved the case, so the normal exit condition works. Override is not needed.',
            firstWrong: 'You proved Tess opened Blue and Malik opened Green. Turn those on.',
            secondWrong: 'Turn on "Tess opened Blue" AND "Malik opened Green". The override can stay off.',
          },
          guidedReasoning: [
            'You proved Tess opened Blue and Malik opened Green.',
            'That satisfies the AND pair, so the exit opens.',
            'You do not need the emergency override.',
          ],
        },
      ],
    },
    {
      id: 'l7-step-10',
      type: 'ordering',
      phase: 'challenge',
      prompt: 'Put the final case explanation in order.',
      items: [
        { id: 'A', text: 'Tess opened the Green Door.' },
        { id: 'B', text: 'The Flashlight was not used on the Green Door, and Keycard opens Blue.' },
        { id: 'C', text: 'So Tess had the Map.' },
        { id: 'D', text: 'Malik did not have the Flashlight, so Malik had the Keycard.' },
        { id: 'E', text: 'The Keycard opened the Blue Door, so Malik opened Blue.' },
        { id: 'F', text: 'Tess opened Green, so Nora opened the Red Door.' },
        { id: 'G', text: 'Therefore Nora had the Flashlight, Malik had the Keycard, Tess had the Map, and all doors are solved.' },
      ],
      correctAnswer: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      feedback: {
        correct: 'Case closed. You escaped Logic Locker. Try not to tell everyone I helped.',
        firstWrong: 'Do not start with the conclusion. Build the case from the clues.',
        secondWrong: 'Start with Tess and the Green Door. That unlocks the item logic, then the door logic.',
      },
      guidedReasoning: [
        'Start with the direct fact: Tess opened Green (A).',
        'Use the eliminations to show Tess had the Map (B, C).',
        'Then solve Malik\'s item and door (D, E).',
        'Then Nora\'s door (F), and finish with the full conclusion (G).',
      ],
      variants: [
        {
          prompt: 'Put the final case explanation in order.',
          items: [
            { id: 'A', text: 'Tess opened the Blue Door.' },
            { id: 'B', text: 'The Keycard opened the Blue Door, so Tess had the Keycard.' },
            { id: 'C', text: 'Nora did not find the Flashlight, so Nora had the Map.' },
            { id: 'D', text: 'That leaves the Flashlight for Malik.' },
            { id: 'E', text: 'Malik did not open the Red Door, so Malik opened the Green Door.' },
            { id: 'F', text: 'Tess opened Blue, so Nora opened the Red Door.' },
            { id: 'G', text: 'Therefore Tess had the Keycard, Nora had the Map, Malik had the Flashlight, and all doors are solved.' },
          ],
          correctAnswer: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          feedback: {
            correct: 'Case closed. You escaped Logic Locker. Try not to tell everyone I helped.',
            firstWrong: 'Do not start with the conclusion. Build the case from the clues.',
            secondWrong: 'Start with Tess and the Blue Door. That unlocks the item logic, then the door logic.',
          },
          guidedReasoning: [
            'Start with the direct fact: Tess opened Blue (A).',
            'Use the conditional clue to show Tess had the Keycard (B).',
            'Then solve the other items (C, D).',
            'Then the doors (E, F), and finish with the full conclusion (G).',
          ],
        },
      ],
    },
    {
      id: 'l7-step-11',
      type: 'caseSummary',
      phase: 'completion',
      prompt: '',
      text: 'You completed the Logic Locker beginner course. You sorted clues, marked grids, caught contradictions, flipped logic switches, and ordered your reasoning. The final door opens.',
      akashLine: "Fine. You're a real recruit now. Still annoying, but useful.",
      correctAnswer: null,
    },
  ],
}

export const lessons: Lesson[] = [lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7]

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id)
}
