import { GLOSSARY, type TermId } from '@/features/learning/glossary'
import type { AgentAction } from './intents'
import { ENROL_INTENT_URL, buildEnrolIntentRequest, readModelJson, type EnrolPlanContext } from './enrolIntentPrompt'

export interface ModelResult {
  actions: AgentAction[]
  answer: string | null
}

const TIMEOUT_MS = 8000
const RISKS = ['conservative', 'balanced', 'growth', 'aggressive'] as const
const MODES = ['plan_selected', 'risk_style', 'own'] as const
const TAXES = ['pretax', 'roth', 'mix'] as const

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const oneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => list.includes(v as T)

/** Keeps only well-formed actions the page knows how to apply. The model's output is never trusted as-is. */
function toAction(raw: unknown): AgentAction | null {
  const a = (raw ?? {}) as Record<string, unknown>
  switch (a.type) {
    case 'rate':
    case 'auto_amount':
    case 'auto_cap':
      return isNum(a.value) ? { type: a.type, value: a.value } : null
    case 'rate_delta':
      return isNum(a.delta) && a.delta !== 0 ? { type: 'rate_delta', delta: a.delta } : null
    case 'risk_delta':
      return a.delta === 1 || a.delta === -1 ? { type: 'risk_delta', delta: a.delta } : null
    case 'tax':
      return oneOf(a.mode, TAXES) ? { type: 'tax', mode: a.mode } : null
    case 'risk':
      return oneOf(a.level, RISKS) ? { type: 'risk', level: a.level } : null
    case 'mode':
      return oneOf(a.mode, MODES) ? { type: 'mode', mode: a.mode } : null
    case 'auto':
    case 'rebalance':
    case 'sdb':
      return isBool(a.on) ? { type: a.type, on: a.on } : null
    case 'open':
      return a.step === 1 || a.step === 2 || a.step === 3 ? { type: 'open', step: a.step } : null
    case 'enrol':
      return { type: 'enrol' }
    case 'explain':
      return typeof a.term === 'string' && a.term in GLOSSARY ? { type: 'explain', term: a.term as TermId } : null
    default:
      return null
  }
}

export function validateModelResult(raw: unknown): ModelResult | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const actions = (Array.isArray(r.actions) ? r.actions : []).map(toAction).filter((a): a is AgentAction => a !== null).slice(0, 5)
  const answer = typeof r.answer === 'string' && r.answer.trim() ? r.answer.trim().slice(0, 600) : null
  return actions.length || answer ? { actions, answer } : null
}

/**
 * Asks the language model what the participant wants changed. In production this goes through the Netlify
 * function, which holds the API key. In local development a VITE_GROQ_API_KEY in .env.local calls Groq directly,
 * the same way the CORE AI chat does. Returns null if the model is unavailable, slow or unsure, so the caller can
 * fall back to the built-in rules.
 */
export async function interpretWithModel(text: string, context: EnrolPlanContext): Promise<ModelResult | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const devKey = import.meta.env.DEV ? (import.meta.env.VITE_GROQ_API_KEY as string | undefined) : undefined
    let raw: unknown
    if (devKey) {
      const res = await fetch(ENROL_INTENT_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${devKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildEnrolIntentRequest(text, context)),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
      raw = readModelJson(data.choices?.[0]?.message?.content)
    } else {
      const res = await fetch('/.netlify/functions/enrol-intent', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      })
      if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null
      raw = ((await res.json()) as { result?: unknown }).result
    }
    return validateModelResult(raw)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
