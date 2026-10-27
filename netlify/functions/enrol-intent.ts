import {
  ENROL_INTENT_URL,
  MAX_REQUEST_CHARS,
  buildEnrolIntentRequest,
  readModelJson,
  sanitizeContext,
  type EnrolPlanContext,
} from '../../src/features/enrollment/agent/enrolIntentPrompt'

/**
 * Understands a typed request on the one-click enrolment page ("save 8% in Roth and take less risk").
 * The prompt is fixed here; the browser only sends the participant's message and their current plan.
 * Returns the model's raw JSON; the page validates every action before applying it.
 */
export default async (req: Request): Promise<Response> => {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  // netlify.toml documents GROQ_API_KEY; the older ai-chat function reads GROK_API_KEY. Accept either.
  const apiKey = process.env.GROQ_API_KEY ?? process.env.GROK_API_KEY
  if (!apiKey) return json({ error: 'unavailable' }, 503)

  let text: string
  let context: EnrolPlanContext
  try {
    const body = (await req.json()) as { text?: unknown; context?: unknown }
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > MAX_REQUEST_CHARS || !body.context) {
      return json({ error: 'bad_request' }, 400)
    }
    text = body.text
    context = sanitizeContext(body.context)
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  try {
    const groq = await fetch(ENROL_INTENT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEnrolIntentRequest(text, context)),
    })
    if (!groq.ok) return json({ error: 'model_error' }, 502)
    const data = (await groq.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const result = readModelJson(data.choices?.[0]?.message?.content)
    return result ? json({ result }, 200) : json({ error: 'model_error' }, 502)
  } catch {
    return json({ error: 'model_error' }, 502)
  }
}
