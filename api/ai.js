/**
 * Serverless OpenAI proxy (Vercel Function, Node runtime).
 *
 * WHY THIS EXISTS: the app is a static client bundle. If the OpenAI key lived in
 * the frontend, anyone could read it from the browser and run up the bill. So
 * the browser only ever talks to THIS function, which holds the key as a private
 * server-side env var (process.env.OPENAI_API_KEY) and relays a tightly-capped
 * request to OpenAI.
 *
 * It is intentionally narrow: it only accepts a {system,user} pair, forces a
 * JSON response, allow-lists the model, and caps tokens — so it can't be used as
 * a general-purpose GPT proxy.
 *
 * Written in plain JS so it stays out of the app's TypeScript build entirely.
 */

const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4o'])
const DEFAULT_MODEL = 'gpt-4o-mini'
const MAX_TOKENS_CAP = 1200

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  // Same-origin app calls only; no CORS needed. Never cache AI responses.
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'method_not_allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return send(res, 503, { error: 'ai_unconfigured' })
  }

  let payload
  try {
    payload = await readBody(req)
  } catch {
    return send(res, 400, { error: 'bad_json' })
  }

  const system = typeof payload.system === 'string' ? payload.system : ''
  const user = typeof payload.user === 'string' ? payload.user : ''
  if (!user) return send(res, 400, { error: 'missing_user' })

  const requested = typeof payload.model === 'string' ? payload.model : DEFAULT_MODEL
  const model = ALLOWED_MODELS.has(requested) ? requested : DEFAULT_MODEL
  const envModel = process.env.OPENAI_MODEL
  const finalModel = ALLOWED_MODELS.has(envModel || '') ? envModel : model

  const temperature = Number.isFinite(payload.temperature)
    ? Math.max(0, Math.min(1.2, payload.temperature))
    : 0.7
  const maxTokens = Number.isFinite(payload.maxTokens)
    ? Math.max(64, Math.min(MAX_TOKENS_CAP, Math.floor(payload.maxTokens)))
    : 700

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: finalModel,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: user },
        ],
      }),
    })

    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      return send(res, 502, { error: 'openai_error', status: r.status, detail: detail.slice(0, 500) })
    }

    const data = await r.json()
    const content = data?.choices?.[0]?.message?.content ?? ''
    return send(res, 200, { content })
  } catch (err) {
    const aborted = err && err.name === 'AbortError'
    return send(res, aborted ? 504 : 500, { error: aborted ? 'timeout' : 'proxy_error' })
  } finally {
    clearTimeout(timeout)
  }
}
