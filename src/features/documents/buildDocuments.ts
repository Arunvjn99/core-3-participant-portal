import type { TFunction } from 'i18next'
import type { TrackedTransaction } from '@/features/transactions/tracking/timeline'

export type DocCategory = 'statements' | 'tax' | 'plan' | 'notices'

export const DOC_CATEGORIES: DocCategory[] = ['statements', 'tax', 'plan', 'notices']

export type DocType =
  | 'annual_fee'
  | 'quarterly_fee'
  | 'spd'
  | 'enrollment_notice'
  | 'fee_change_notice'
  | 'plan_document'
  | 'statement'
  | 'tax_form'
  | 'confirmation'
  | 'plan_notice'

/** Types offered in the Document type filter. */
export const DOC_TYPES: DocType[] = ['annual_fee', 'quarterly_fee', 'spd', 'enrollment_notice', 'fee_change_notice', 'plan_document', 'statement', 'tax_form', 'confirmation', 'plan_notice']

export const DOC_PLANS = [
  { id: '401k', name: 'Savings and Retirement 401(k) Plan', planId: '124542' },
  { id: 'profit-sharing', name: 'Profit Sharing and Employee Ownership Plan', planId: '124890' },
] as const

export interface DocumentItem {
  /** Stable id — also used for the "opened" state */
  id: string
  category: DocCategory
  type: DocType
  planId: (typeof DOC_PLANS)[number]['id']
  /** Publication date (ms) */
  at: number
  render: (t: TFunction) => { title: string; description: string }
}

export interface DocumentInputs {
  tracked: TrackedTransaction[]
  /** When the participant confirmed enrolment, if they have */
  enrolledAt?: number
  now?: number
}

const DAY = 86_400_000

/** Last four quarter-end statements already published (quarter end + 7 days), one per plan. */
function statements(now: number): DocumentItem[] {
  const out: DocumentItem[] = []
  const d = new Date(now)
  let year = d.getFullYear()
  let q = Math.floor(d.getMonth() / 3) // quarter in progress (0-based); the previous one just ended
  let quarters = 0
  while (quarters < 4) {
    q -= 1
    if (q < 0) {
      q = 3
      year -= 1
    }
    const published = new Date(year, q * 3 + 3, 1).getTime() + 7 * DAY
    if (published > now) continue
    quarters += 1
    const label = { q: q + 1, year }
    for (const plan of DOC_PLANS) {
      out.push({
        id: `stmt:${plan.id}:${year}-Q${q + 1}`,
        category: 'statements',
        type: 'statement',
        planId: plan.id,
        at: published,
        render: (t) => ({
          title: t('documents.item.statement', label) + (DOC_PLANS.length > 1 ? ` — ${plan.planId}` : ''),
          description: t('documents.item.statement_desc'),
        }),
      })
    }
    // Quarterly fee disclosure accompanies each quarter's statement for the 401(k).
    out.push({
      id: `qfee:${year}-Q${q + 1}`,
      category: 'plan',
      type: 'quarterly_fee',
      planId: '401k',
      at: published,
      render: (t) => ({ title: t('documents.item.quarterly_fee', label), description: t('documents.item.quarterly_fee_desc') }),
    })
  }
  return out
}

/**
 * Pure catalogue of the participant's documents. Today it is generated from the calendar and the
 * app's own records; swap for a document-management feed when one exists — the page only needs
 * id / category / date / render.
 *
 * Not modelled yet: Form 1099-R (needs real distribution history).
 */
export function buildDocuments({ tracked, enrolledAt, now = Date.now() }: DocumentInputs): DocumentItem[] {
  const year = new Date(now).getFullYear()
  const docs: DocumentItem[] = [...statements(now)]

  // Form 5498 is issued by May 31 for the prior tax year.
  const latest5498 = now >= new Date(year, 4, 31).getTime() ? year - 1 : year - 2
  for (const taxYear of [latest5498, latest5498 - 1]) {
    docs.push({
      id: `tax:5498:${taxYear}`,
      category: 'tax',
      type: 'tax_form',
      planId: '401k',
      at: new Date(taxYear + 1, 4, 31).getTime(),
      render: (t) => ({ title: t('documents.item.form5498', { year: taxYear }), description: t('documents.item.form5498_desc') }),
    })
  }

  const planDocs: { key: string; type: DocType; at: number }[] = [
    { key: 'spd', type: 'spd', at: new Date(year - 1, 0, 1).getTime() },
    { key: 'smm', type: 'plan_notice', at: new Date(year, 0, 1).getTime() },
    { key: 'fee_disclosure', type: 'annual_fee', at: new Date(year, 0, 15).getTime() },
    { key: 'qdia', type: 'plan_notice', at: new Date(year, 0, 15).getTime() },
    { key: 'safe_harbor', type: 'plan_notice', at: new Date(year, 0, 1).getTime() },
    { key: 'plan_document', type: 'plan_document', at: new Date(year - 1, 0, 1).getTime() },
    { key: 'fee_change_notice', type: 'fee_change_notice', at: new Date(year, 3, 1).getTime() },
  ]
  for (const p of planDocs) {
    docs.push({
      id: `plan:${p.key}:${new Date(p.at).getFullYear()}`,
      category: 'plan',
      type: p.type,
      planId: '401k',
      at: p.at,
      render: (t) => ({ title: t(`documents.item.${p.key}`), description: t(`documents.item.${p.key}_desc`) }),
    })
  }

  if (enrolledAt) {
    docs.push({
      id: 'notice:enrollment',
      category: 'notices',
      type: 'enrollment_notice',
      planId: '401k',
      at: enrolledAt,
      render: (t) => ({ title: t('documents.item.enrollment_confirmation'), description: t('documents.item.enrollment_confirmation_desc') }),
    })
  }
  for (const tx of tracked) {
    docs.push({
      id: `notice:tx:${tx.id}`,
      category: 'notices',
      type: 'confirmation',
      planId: '401k',
      at: tx.submittedAt,
      render: (t) => ({
        title: t('documents.item.tx_confirmation', { type: t(`tracking.type.${tx.type}`) }),
        description: t('documents.item.tx_confirmation_desc'),
      }),
    })
  }

  return docs.filter((d) => d.at <= now).sort((a, b) => b.at - a.at)
}
