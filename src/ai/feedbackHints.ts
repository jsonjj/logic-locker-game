/**
 * AI-tailored wrong-answer hints. When a learner misses a question we ask the
 * model for a short, targeted nudge grounded in the room's skill and the
 * authored "failed move" — escalating from a spoiler-free hint on the first miss
 * to a clearer reasoning nudge on repeat misses (never just handing the answer).
 *
 * Best-effort and cached per question+attempt: returns null offline so the UI
 * simply falls back to the authored feedback.
 */
import { aiJson, aiDisabled } from './aiClient'

export interface HintCtx {
  stepId: string
  prompt: string
  skill?: string
  /** 1 = first miss (gentle), 2+ = repeated miss (clearer). */
  attempt: number
  /** The authored name for the move being rehearsed, e.g. "guessing past a clue". */
  failedMove?: string
}

interface AiHint {
  hint?: string
}

const mem = new Map<string, string>()

function key(ctx: HintCtx): string {
  const bucket = ctx.attempt <= 1 ? 1 : 2
  return `ll-ai-hint:v1:${ctx.stepId}:${bucket}`
}

export async function getHint(ctx: HintCtx): Promise<string | null> {
  const k = key(ctx)
  const cachedMem = mem.get(k)
  if (cachedMem) return cachedMem
  try {
    const ls = localStorage.getItem(k)
    if (ls) {
      mem.set(k, ls)
      return ls
    }
  } catch {
    /* ignore */
  }

  if (aiDisabled()) return null

  const escalation =
    ctx.attempt <= 1
      ? 'They just missed it once. Give a gentle, spoiler-free nudge toward the right kind of move. Do NOT reveal the answer.'
      : 'They have missed it more than once. Be clearer about the reasoning step they are skipping, but still let them make the final call — do NOT state the answer outright.'

  const system =
    'You are Akash, a warm, sharp study partner in a detective reasoning game. ' +
    'You give ONE short hint (max 2 sentences, under 240 characters), encouraging and concrete. ' +
    'Never reveal the correct answer. Return STRICT JSON: {"hint": string}.'

  const user = JSON.stringify({
    skill: ctx.skill ?? 'logical reasoning',
    failedMove: ctx.failedMove ?? null,
    question: ctx.prompt,
    situation: escalation,
  })

  const result = await aiJson<AiHint>(system, user, { temperature: 0.6, maxTokens: 160 })
  const hint = result?.hint?.trim()
  if (!hint) return null

  mem.set(k, hint)
  try {
    localStorage.setItem(k, hint)
  } catch {
    /* ignore */
  }
  return hint
}
