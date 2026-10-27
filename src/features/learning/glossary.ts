import i18n from '@/core/i18n'
import { EMPLOYER_MATCH_CAP_PERCENT } from '@/features/enrollment/quickEnrollmentDefaults'

/**
 * Plain-language definitions for retirement terms. Text lives in the locale files under `glossary.<id>`
 * (`title`, `body` for the short popover, `more` for the fuller answer CORE AI gives).
 * Keywords let CORE AI recognise a question about the term; the localized title is matched too.
 */
export const GLOSSARY = {
  projected_balance: { keywords: ['projected retirement balance', 'projected balance', 'projection'], related: ['risk_profile', 'contribution_rate'] },
  contribution_rate: { keywords: ['contribution rate', 'deferral rate', 'deferral', 'savings rate'], related: ['employer_match', 'auto_increase'] },
  employer_match: { keywords: ['employer match', 'company match', 'match cap', 'matching contribution', 'employer adds'], related: ['contribution_rate'] },
  tax_treatment: { keywords: ['tax treatment', 'pre-tax', 'pretax', 'pre tax', 'roth', 'traditional', 'mix of both'], related: ['sources'] },
  plan_deferral_rate: { keywords: ['plan deferral rate', 'plan rate', 'default rate'], related: ['contribution_rate', 'employer_match'] },
  auto_increase: { keywords: ['auto-increase', 'auto increase', 'automatic increase', 'auto escalation'], related: ['increment_cycle'] },
  increment_cycle: { keywords: ['increment cycle', 'plan participant date', 'participant date', 'plan year', 'calendar year'], related: ['auto_increase'] },
  sources: { keywords: ['apply to all sources', 'per source', 'sources', 'source'], related: ['tax_treatment', 'allocation'] },
  invest_mode: { keywords: ['ways to invest', 'plan-selected', 'plan selected', 'let the plan choose', 'default mix', 'choose my own funds'], related: ['risk_profile', 'allocation'] },
  risk_profile: { keywords: ['risk profile', 'risk tolerance', 'risk style', 'risk questionnaire', 'conservative', 'aggressive'], related: ['allocation', 'invest_mode'] },
  allocation: { keywords: ['allocation', 'allocate'], related: ['auto_rebalance', 'expense_ratio'] },
  expense_ratio: { keywords: ['expense ratio', 'fund fee', 'fund fees', 'expense'], related: ['allocation'] },
  auto_rebalance: { keywords: ['auto rebalance', 'automatic rebalance', 'rebalancing', 'rebalance'], related: ['allocation'] },
  sdb: { keywords: ['self-directed brokerage', 'self directed brokerage', 'brokerage', 'sdb'], related: ['expense_ratio'] },
} as const satisfies Record<string, { keywords: readonly string[]; related: readonly string[] }>

export type TermId = keyof typeof GLOSSARY

const vars = () => ({ cap: EMPLOYER_MATCH_CAP_PERCENT })

export const termTitle = (id: TermId) => i18n.t(`glossary.${id}.title`, vars())
export const termBody = (id: TermId) => i18n.t(`glossary.${id}.body`, vars())
export const termQuestion = (id: TermId) => i18n.t('glossary.ask', { term: termTitle(id) })

/** The term a question is about, preferring the longest matching keyword or title. */
export function findTerm(query: string): TermId | null {
  const q = query.toLowerCase()
  let best: { id: TermId; len: number } | null = null
  for (const id of Object.keys(GLOSSARY) as TermId[]) {
    for (const k of [...GLOSSARY[id].keywords, termTitle(id).toLowerCase()]) {
      if (q.includes(k) && (!best || k.length > best.len)) best = { id, len: k.length }
    }
  }
  return best?.id ?? null
}

/** CORE AI's answer: title, short definition, then the fuller explanation with an example. */
export function termAnswer(id: TermId): { content: string; suggestions: string[] } {
  return {
    content: `**${termTitle(id)}**\n\n${termBody(id)}\n\n${i18n.t(`glossary.${id}.more`, vars())}`,
    suggestions: GLOSSARY[id].related.map((r) => termQuestion(r)),
  }
}
