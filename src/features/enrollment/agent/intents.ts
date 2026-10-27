import { findTerm, type TermId } from '@/features/learning/glossary'
import type { InvestMode } from '@/features/plan/electionsData'
import type { RiskKey } from '../investmentCatalog'

/** Something the participant asked the enrolment assistant to do, from a suggestion chip or typed text. */
export type AgentAction =
  | { type: 'rate'; value: number }
  | { type: 'rate_delta'; delta: number }
  | { type: 'tax'; mode: 'pretax' | 'roth' | 'mix' }
  | { type: 'auto'; on: boolean }
  | { type: 'auto_amount'; value: number }
  | { type: 'auto_cap'; value: number }
  | { type: 'risk'; level: RiskKey }
  | { type: 'risk_delta'; delta: 1 | -1 }
  | { type: 'mode'; mode: InvestMode }
  | { type: 'rebalance'; on: boolean }
  | { type: 'sdb'; on: boolean }
  | { type: 'open'; step: 1 | 2 | 3 }
  | { type: 'enrol' }
  | { type: 'explain'; term: TermId }

const num = (m: RegExpMatchArray | null, i = 1) => (m ? parseFloat(m[i]!) : NaN)
const OFF = /\b(off|stop|disable|no|don'?t|remove|without|quitar|desactiva|sin)\b/

/**
 * Turns a typed request into a plan change. Rule-based and English-first (with a few Spanish words),
 * so it works without the language model; anything it doesn't recognise returns null.
 */
export function parseAgentCommand(input: string): AgentAction | null {
  const q = input.toLowerCase().trim()
  if (!q) return null

  // Questions about a term ("what is an expense ratio?") get the glossary answer
  if (/\b(what|qué|que)\b|\bmean|\bexplain|\bdefine|\?$/.test(q)) {
    const term = findTerm(q)
    if (term) return { type: 'explain', term }
  }

  if (/\b(enrol|enroll|sign me up|looks good|let'?s go|confirm|inscr[ií]be)/.test(q)) return { type: 'enrol' }

  // Brokerage and rebalancing
  if (/\b(sdb|brokerage|corretaje)\b/.test(q)) return { type: 'sdb', on: !OFF.test(q) }
  if (/rebalanc|reequilibr/.test(q)) return { type: 'rebalance', on: !OFF.test(q) }

  // Auto-increase
  if (/auto|increase|escalat|aumento/.test(q)) {
    const cap = q.match(/\b(?:cap|stop|max(?:imum)?|limit|up to|until|hasta)\b\D{0,20}(\d+(?:\.\d+)?)/)
    if (cap) return { type: 'auto_cap', value: num(cap) }
    const by = q.match(/\bby\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*%?\s*(?:a|per|each|al)\s*(?:year|yr|año)/)
    if (by) return { type: 'auto_amount', value: num(by, by[1] ? 1 : 2) }
    if (/\b(turn on|enable|start|yes|activa)\b/.test(q)) return { type: 'auto', on: true }
    if (OFF.test(q)) return { type: 'auto', on: false }
  }

  // Tax treatment
  if (/\b(mix|both|split|ambos|combina)/.test(q) && /roth|tax|impuesto/.test(q)) return { type: 'tax', mode: 'mix' }
  if (/roth/.test(q) && !/pre-?tax|traditional/.test(q)) return { type: 'tax', mode: 'roth' }
  if (/pre-?tax|traditional|antes de impuestos/.test(q)) return { type: 'tax', mode: 'pretax' }

  // Investments
  if (/plan('?s)? (default|choose|pick)|let the plan|default mix|que el plan/.test(q)) return { type: 'mode', mode: 'plan_selected' }
  if (/(my own|own funds|pick (the |my )?funds|choose (my )?funds|mis propios)/.test(q)) return { type: 'mode', mode: 'own' }
  for (const level of ['conservative', 'balanced', 'growth', 'aggressive'] as const) {
    if (q.includes(level)) return { type: 'risk', level }
  }
  if (/(less|lower|reduce|menos)\s*(risk|riesgo)|safer|play it safe|more conservative|m[aá]s seguro/.test(q)) return { type: 'risk_delta', delta: -1 }
  if (/(more|higher|m[aá]s)\s*(risk|riesgo|growth|crecimiento|aggressive)/.test(q)) return { type: 'risk_delta', delta: 1 }

  // Contribution rate
  const pct = q.match(/(\d+(?:\.\d+)?)\s*(%|percent|por ?ciento)/) ?? q.match(/\b(?:save|contribute|rate|ahorra?r?)\D{0,12}(\d+(?:\.\d+)?)/)
  if (pct) return { type: 'rate', value: num(pct) }
  if (/\b(save|contribute|ahorrar?)\s+(more|m[aá]s)/.test(q)) return { type: 'rate_delta', delta: 1 }
  if (/\b(save|contribute|ahorrar?)\s+(less|menos)/.test(q)) return { type: 'rate_delta', delta: -1 }

  // "Show me the details"
  if (/fund|invest|fondo|inversi/.test(q)) return { type: 'open', step: 3 }
  if (/contribut|paycheck|deferr|aporte/.test(q)) return { type: 'open', step: 1 }

  return null
}
