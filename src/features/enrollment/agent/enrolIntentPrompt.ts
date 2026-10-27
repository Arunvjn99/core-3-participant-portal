/**
 * Prompt and request shape for turning a typed enrolment request into plan changes with the language model.
 * Shared by the Netlify function (`netlify/functions/enrol-intent.ts`, production) and the browser (local dev with
 * VITE_GROQ_API_KEY), so it must stay free of app imports and path aliases.
 */

export const ENROL_INTENT_MODEL = 'llama-3.1-8b-instant'
export const ENROL_INTENT_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const MAX_REQUEST_CHARS = 500

/** The participant's current plan on the one-click page, so relative requests ("a bit more") make sense. */
export interface EnrolPlanContext {
  rate: number
  tax: 'pretax' | 'roth' | 'mix'
  autoIncrease: { enabled: boolean; amount: number; max: number }
  risk: string
  investMode: string
  autoRebalance: boolean
  sdb: boolean
  limits: { rate: readonly [number, number]; autoAmount: readonly [number, number]; autoCap: readonly [number, number] }
  terms: string[]
  language: 'en' | 'es'
}

function systemPrompt(ctx: EnrolPlanContext): string {
  return `You turn a 401(k) participant's message into changes to their enrolment plan. Reply with JSON only.

Current plan:
- Contribution rate: ${ctx.rate}% of pay (allowed ${ctx.limits.rate[0]}–${ctx.limits.rate[1]}%)
- Tax treatment: ${ctx.tax}
- Auto-increase: ${ctx.autoIncrease.enabled ? `on, +${ctx.autoIncrease.amount}% a year up to ${ctx.autoIncrease.max}%` : 'off'} (yearly step ${ctx.limits.autoAmount[0]}–${ctx.limits.autoAmount[1]}%, cap ${ctx.limits.autoCap[0]}–${ctx.limits.autoCap[1]}%)
- Risk profile: ${ctx.risk}
- How they invest: ${ctx.investMode}
- Auto rebalance: ${ctx.autoRebalance ? 'on' : 'off'}
- Self-Directed Brokerage: ${ctx.sdb ? 'on' : 'off'}

Output exactly this shape: {"actions": [...], "answer": string or null}

Allowed actions (use only these, at most 5):
{"type":"rate","value":number}              set contribution rate to a % of pay
{"type":"rate_delta","delta":number}        raise or lower the rate by this many points ("save more" = 1, "a bit less" = -1)
{"type":"tax","mode":"pretax"|"roth"|"mix"} tax treatment; "traditional" means pretax
{"type":"auto","on":boolean}                turn auto-increase on or off
{"type":"auto_amount","value":number}       yearly auto-increase step, in %
{"type":"auto_cap","value":number}          rate where auto-increases stop, in %
{"type":"risk","level":"conservative"|"balanced"|"growth"|"aggressive"}
{"type":"risk_delta","delta":1|-1}          -1 = less risk / safer, 1 = more growth
{"type":"mode","mode":"plan_selected"|"risk_style"|"own"}  plan_selected = let the plan choose its default mix, own = pick my own funds
{"type":"rebalance","on":boolean}           quarterly auto rebalance
{"type":"sdb","on":boolean}                 Self-Directed Brokerage
{"type":"open","step":1|2|3}                show detailed controls: 1 contribution, 2 auto-increase, 3 investments
{"type":"enrol"}                            the participant says they are ready to enrol or that the plan looks good
{"type":"explain","term":string}            they ask what a term means; term must be one of: ${ctx.terms.join(', ')}

Rules:
- Only include changes the participant asked for. Never invent changes.
- Use rate_delta and risk_delta for relative requests; use rate and risk for exact ones.
- Numbers are plain numbers without "%". Do not clamp them; the app applies the plan's limits.
- "answer": only when they ask a general question that no action covers. 2–3 short plain-text sentences in ${ctx.language === 'es' ? 'Spanish' : 'English'}, factual and neutral. Do not tell them what they personally should choose; explain the trade-off instead. Otherwise null.
- If the message is unclear or unrelated to their 401(k) enrolment, return {"actions": [], "answer": null}.`
}

/** Request body for the Groq chat completions API. */
export function buildEnrolIntentRequest(text: string, ctx: EnrolPlanContext) {
  return {
    model: ENROL_INTENT_MODEL,
    temperature: 0,
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt(ctx) },
      { role: 'user', content: text.slice(0, MAX_REQUEST_CHARS) },
    ],
  }
}

/** Reads the model's JSON, tolerating code fences. Returns null when it isn't JSON. */
export function readModelJson(content: string | undefined): unknown {
  if (!content) return null
  const trimmed = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

/**
 * The context comes from the browser and is written into the prompt, so keep only the expected shapes:
 * numbers, known enum values and plain term ids. Anything else falls back to a neutral default.
 */
export function sanitizeContext(raw: unknown): EnrolPlanContext {
  const r = (raw ?? {}) as Record<string, unknown>
  const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : d)
  const pick = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => (allowed.includes(v as T) ? (v as T) : d)
  const pair = (v: unknown, d: [number, number]): [number, number] =>
    Array.isArray(v) && v.length === 2 ? [n(v[0], d[0]), n(v[1], d[1])] : d
  const ai = (r.autoIncrease ?? {}) as Record<string, unknown>
  const lim = (r.limits ?? {}) as Record<string, unknown>
  return {
    rate: n(r.rate, 6),
    tax: pick(r.tax, ['pretax', 'roth', 'mix'] as const, 'pretax'),
    autoIncrease: { enabled: ai.enabled === true, amount: n(ai.amount, 1), max: n(ai.max, 10) },
    risk: pick(r.risk, ['conservative', 'balanced', 'growth', 'aggressive'] as const, 'balanced'),
    investMode: pick(r.investMode, ['plan_selected', 'risk_style', 'own'] as const, 'risk_style'),
    autoRebalance: r.autoRebalance === true,
    sdb: r.sdb === true,
    limits: { rate: pair(lim.rate, [1, 25]), autoAmount: pair(lim.autoAmount, [1, 3]), autoCap: pair(lim.autoCap, [10, 15]) },
    terms: Array.isArray(r.terms) ? r.terms.filter((t): t is string => typeof t === 'string' && /^[a-z_]{1,40}$/.test(t)).slice(0, 40) : [],
    language: pick(r.language, ['en', 'es'] as const, 'en'),
  }
}
