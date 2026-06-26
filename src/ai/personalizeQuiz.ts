/**
 * Per-user problem personalization (SAFE reskin).
 *
 * We never let the model invent logic puzzles — that risks wrong or unsolvable
 * answers. Instead we take the already-correct quiz produced by buildQuiz() and
 * ask ChatGPT to rewrite ONLY the prompt wording so the whole set:
 *   - shares one coherent theme (questions flow together),
 *   - reads at the right level for this player (scales per user),
 *   - stays natural and unambiguous (makes sense).
 *
 * Choices, correct answers, grids, switches and every other logical structure
 * are left byte-for-byte untouched, so correctness is guaranteed. Anything the
 * model gets wrong (missing id, dropped a choice name, junk) is discarded and
 * the original prompt is kept. Results are cached per user+room so we only spend
 * one call per room.
 */
import type { InteractiveStep } from '../game3d/puzzles/types'
import { aiJson, aiDisabled } from './aiClient'

export interface QuizPersonalizeCtx {
  uid: string
  sectorId: string
  /** Lesson/room title, gives the model topical grounding. */
  topic: string
  prestige: number
  /** A cache-bucket label (we use the chosen difficulty here). */
  mode: string
  /** Skills the player has recently struggled with (for light emphasis). */
  weakSkills?: string[]
}

interface AiReskin {
  theme?: string
  items?: { id: string; prompt: string }[]
}

const CACHE_VERSION = 'v1'

function cacheKey(ctx: QuizPersonalizeCtx): string {
  return `ll-ai-quiz:${CACHE_VERSION}:${ctx.uid}:${ctx.sectorId}:p${ctx.prestige}:${ctx.mode}`
}

function stepsSignature(steps: InteractiveStep[]): string {
  return steps.map((s) => s.id).join('|')
}

/** Choice labels that literally appear in a prompt — used to detect name drift. */
function choiceLabelsInPrompt(step: InteractiveStep): string[] {
  if (!('choices' in step)) return []
  const lower = step.prompt.toLowerCase()
  return step.choices
    .map((c) => c.label)
    .filter((label) => label.length >= 2 && lower.includes(label.toLowerCase()))
}

function levelDescriptor(prestige: number): string {
  if (prestige <= 0) return 'a first-time learner who is still meeting these ideas'
  if (prestige === 1) return 'a learner on their second pass who knows the basics'
  return 'a returning expert who wants crisp, no-hand-holding wording'
}

/** Apply a validated id→prompt map, keeping the original prompt on any mismatch. */
function applyPrompts(steps: InteractiveStep[], prompts: Record<string, string>): InteractiveStep[] {
  return steps.map((step) => {
    const next = prompts[step.id]
    if (!next || typeof next !== 'string') return step
    const trimmed = next.trim()
    // Sanity bounds: reject empty or runaway rewrites.
    if (trimmed.length < 6 || trimmed.length > 400) return step
    // Name-drift guard: any choice name that appeared in the original prompt
    // must still appear, or the rewrite could no longer match the choices.
    const required = choiceLabelsInPrompt(step)
    const low = trimmed.toLowerCase()
    if (required.some((label) => !low.includes(label.toLowerCase()))) return step
    return { ...step, prompt: trimmed }
  })
}

function readCache(ctx: QuizPersonalizeCtx, sig: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(cacheKey(ctx))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { sig?: string; prompts?: Record<string, string> }
    if (parsed.sig !== sig || !parsed.prompts) return null
    return parsed.prompts
  } catch {
    return null
  }
}

function writeCache(ctx: QuizPersonalizeCtx, sig: string, prompts: Record<string, string>): void {
  try {
    localStorage.setItem(cacheKey(ctx), JSON.stringify({ sig, prompts }))
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

/**
 * Returns a personalized copy of `steps` (or the originals unchanged on any
 * failure). Safe to call unconditionally — it no-ops offline.
 */
export async function personalizeQuiz(
  steps: InteractiveStep[],
  ctx: QuizPersonalizeCtx,
): Promise<InteractiveStep[]> {
  if (steps.length === 0) return steps
  const sig = stepsSignature(steps)

  const cached = readCache(ctx, sig)
  if (cached) return applyPrompts(steps, cached)

  if (aiDisabled()) return steps

  const items = steps.map((s) => ({ id: s.id, prompt: s.prompt }))
  const weak = ctx.weakSkills?.length ? ctx.weakSkills.join(', ') : 'none flagged'

  const system =
    'You are a learning designer for "Logic Locker", a detective game that teaches ' +
    'logical reasoning (deduction grids, if-then, AND/OR/NOT, ordering). You rewrite ' +
    'question PROMPTS so a set of questions shares one vivid detective/heist theme and ' +
    'reads clearly. Hard rules: (1) NEVER change the logical meaning, the answer, any ' +
    'numbers, or any proper names/labels that appear in the prompt. (2) Keep each ' +
    'rewrite about the same length as the original, one or two sentences. (3) Do not add ' +
    'the answer or extra hints. (4) Return STRICT JSON only.'

  const user = JSON.stringify({
    instruction:
      'Pick ONE coherent theme for this room and rewrite every prompt to fit it. ' +
      `Pitch the wording for ${levelDescriptor(ctx.prestige)}. ` +
      `Gently lean into these weak skills where natural: ${weak}. ` +
      'Preserve all names/labels/numbers exactly. Return JSON: ' +
      '{"theme": string, "items": [{"id": string, "prompt": string}]}.',
    room: ctx.topic,
    items,
  })

  const result = await aiJson<AiReskin>(system, user, {
    temperature: 0.8,
    maxTokens: 900,
  })

  if (!result?.items || !Array.isArray(result.items)) return steps

  const prompts: Record<string, string> = {}
  for (const it of result.items) {
    if (it && typeof it.id === 'string' && typeof it.prompt === 'string') {
      prompts[it.id] = it.prompt
    }
  }
  if (Object.keys(prompts).length === 0) return steps

  writeCache(ctx, sig, prompts)
  return applyPrompts(steps, prompts)
}
