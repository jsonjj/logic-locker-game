/**
 * [Agent 3] Pure helpers (no React) that turn a Lesson into branching breach
 * routes and map each lesson Step type onto a security-device archetype.
 */
import type { Lesson, Step, StepPhase } from '../../types'
import type { DeviceKind, InteractiveStep, RouteDef } from './types'

const INTERACTIVE_TYPES = new Set<Step['type']>([
  'multipleChoice',
  'prediction',
  'highlightChoice',
  'symbolTap',
  'clueSort',
  'deductionGrid',
  'miniGrid',
  'singleCellGrid',
  'logicSwitches',
  'ordering',
])

/** Narrowing guard: is this a step a device can be built from? */
export function isInteractive(step: Step): step is InteractiveStep {
  return INTERACTIVE_TYPES.has(step.type)
}

/** Map a lesson step type onto the device that renders it. */
export function deviceKindForStep(step: InteractiveStep): DeviceKind {
  switch (step.type) {
    case 'multipleChoice':
    case 'prediction':
    case 'highlightChoice':
    case 'symbolTap':
      return 'console'
    case 'clueSort':
      return 'locker'
    case 'deductionGrid':
    case 'miniGrid':
    case 'singleCellGrid':
      return 'grid'
    case 'logicSwitches':
      return 'gate'
    case 'ordering':
      return 'wiring'
  }
}

/** Short in-fiction name for a device archetype. */
export function deviceLabel(kind: DeviceKind): string {
  switch (kind) {
    case 'console':
      return 'Override Console'
    case 'locker':
      return 'Evidence Locker'
    case 'grid':
      return 'Deduction Terminal'
    case 'gate':
      return 'Logic-Gate Panel'
    case 'wiring':
      return 'Relay Sequencer'
  }
}

const PHASE_WEIGHT: Record<StepPhase, number> = {
  intro: 0,
  'micro-practice': 1,
  'guided-practice': 2,
  'pattern-check': 3,
  challenge: 4,
  reflection: 1,
  completion: 0,
}

function weight(step: InteractiveStep): number {
  return PHASE_WEIGHT[step.phase] ?? 2
}

/**
 * Build the 2-3 branching routes for a sector. Every route opens the SAME lock,
 * so the player can take whichever path suits them:
 *   - "Brute Bypass"   (fast/risky)   one high-security node, no warm-up.
 *   - "Clean Crack"    (slow/safe)    a short ladder of simpler nodes.
 *   - "Manual Override"(balanced)     an independent alternate node / hybrid.
 * Routes are derived entirely from the lesson's real step content.
 */
export function buildRoutes(lesson: Lesson): RouteDef[] {
  const interactive = lesson.steps.filter(isInteractive)
  if (interactive.length === 0) return []

  const byWeight = [...interactive].sort((a, b) => weight(a) - weight(b))
  const hardest = byWeight[byWeight.length - 1]
  const challenges = interactive.filter((s) => weight(s) >= 3)

  const routes: RouteDef[] = []

  // Route A — fast / risky: a single hardest node.
  routes.push({
    id: 'bypass',
    label: 'Brute Bypass',
    blurb: 'Slam the highest-security node in a single pass. Fast, but it offers no warm-up.',
    risk: 'fast',
    steps: [hardest],
  })

  // Route B — slow / safe: a short ladder of the simplest nodes.
  const ladder = byWeight.filter((s) => s.id !== hardest.id).slice(0, 3)
  if (ladder.length >= 1) {
    routes.push({
      id: 'methodical',
      label: 'Clean Crack',
      blurb: 'Work the access ladder node by node. Slower, fully guided, lowest risk.',
      risk: 'safe',
      steps: ladder,
    })
  }

  // Route C — balanced: an independent alternate node, or a prime-then-force hybrid.
  const altChallenge = challenges.find((s) => s.id !== hardest.id)
  let cSteps: InteractiveStep[] = []
  let cBlurb = ''
  if (altChallenge) {
    cSteps = [altChallenge]
    cBlurb = 'Breach a different high-security node entirely. Independent path, same lock.'
  } else {
    const relay = byWeight.find(
      (s) => s.id !== hardest.id && !ladder.some((l) => l.id === s.id),
    )
    if (relay) {
      cSteps = [relay, hardest]
      cBlurb = 'Prime one relay, then force the core node. A balanced two-step breach.'
    }
  }
  if (cSteps.length > 0) {
    routes.push({
      id: 'override',
      label: 'Manual Override',
      blurb: cBlurb,
      risk: 'balanced',
      steps: cSteps,
    })
  }

  // Drop any routes that ended up clearing the exact same node set.
  const seen = new Set<string>()
  return routes.filter((route) => {
    const signature = route.steps.map((s) => s.id).join('>')
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}
