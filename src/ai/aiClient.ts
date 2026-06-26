/**
 * Thin client for our own /api/ai serverless proxy (which holds the OpenAI key
 * server-side). Everything here is best-effort: if the endpoint is missing
 * (e.g. running plain `vite` without functions), the network fails, or the model
 * returns junk, callers get `null` and fall back to the hand-authored content.
 * The app must never break or block on AI.
 */

export interface AiJsonOpts {
  model?: 'gpt-4o-mini' | 'gpt-4o'
  temperature?: number
  maxTokens?: number
  /** Abort if the proxy hasn't answered in this many ms. */
  timeoutMs?: number
}

// Once the proxy is clearly unavailable (404/503 in this session) we stop trying
// so we don't spam failing requests on every room / mistake.
let disabled = false

export function aiDisabled(): boolean {
  return disabled
}

/**
 * Ask the proxy for a JSON object. Returns the parsed object, or null on any
 * failure (offline, timeout, non-JSON, disabled, etc.).
 */
export async function aiJson<T = unknown>(
  system: string,
  user: string,
  opts: AiJsonOpts = {},
): Promise<T | null> {
  if (disabled) return null

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000)
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system,
        user,
        model: opts.model,
        temperature: opts.temperature,
        maxTokens: opts.maxTokens,
      }),
    })

    // Endpoint not deployed / key not set → don't keep retrying this session.
    if (res.status === 404 || res.status === 503) {
      disabled = true
      return null
    }
    if (!res.ok) return null

    const data = (await res.json()) as { content?: string }
    if (!data.content) return null
    return JSON.parse(data.content) as T
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}
