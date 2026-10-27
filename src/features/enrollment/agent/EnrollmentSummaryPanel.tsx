import { useTranslation } from 'react-i18next'
import { AlertCircle, FlaskConical, Lock, Pencil, ShieldCheck } from 'lucide-react'
import { TermInfo } from '@/features/learning/TermInfo'
import { Rich } from './AgentChat'

export type SubmitPhase = 'idle' | 'validating' | 'sending' | 'confirming' | 'error'

export interface SummaryData {
  planName: string
  planId: string
  isSample: boolean
  rate: number
  perPaycheck: string
  youPerYear: string
  employerPerYear: string
  matchNote: string
  fullMatch: boolean
  taxLabel: string
  autoText: string
  investLabel: string
  funds: { name: string; pct: number; color: string }[]
  fee: string
  projected: string
  retireAge: number
}

interface Props {
  data: SummaryData
  issues: string[]
  /** Opens the review pop-up, where the disclosures and consent are */
  onReview: () => void
  onEdit: (step: 1 | 2 | 3) => void
}

function Row({ label, children, onEdit, editLabel }: { label: string; children: React.ReactNode; onEdit?: () => void; editLabel?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <dt className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.82rem' }}>{label}</dt>
        <dd className="mt-0.5 text-gray-900 dark:text-white" style={{ fontSize: '0.98rem', fontWeight: 500 }}>{children}</dd>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
          style={{ fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Pencil className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{editLabel?.split(':')[0]}</span>
        </button>
      )}
    </div>
  )
}

/**
 * The participant's enrolment at a glance, always in view: what comes out of each paycheck, what the employer adds,
 * how it's invested, then the disclosures, explicit consent and the single "Confirm and enrol" action.
 */
export function EnrollmentSummaryPanel({ data, issues, onReview, onEdit }: Props) {
  const { t } = useTranslation()
  const edit = (n: 1 | 2 | 3, what: string) => ({ onEdit: () => onEdit(n), editLabel: `${t('enrollment.agent.summary.edit')}: ${what}` })

  return (
    <section aria-labelledby="enrol-summary-title" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(30,58,138,0.08)] dark:border-gray-800 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-blue-700 to-indigo-700 px-5 pb-5 pt-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <h2 id="enrol-summary-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('enrollment.agent.summary.title')}</h2>
          {data.isSample && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              {t('enrollment.agent.summary.sample_badge')}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-blue-100" style={{ fontSize: '0.85rem' }}>
          {data.planName} · {data.planId}
        </p>
        <p className="mt-4 tabular-nums" style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1 }} aria-live="polite">
          {data.rate}%<span className="ml-1.5 text-blue-100" style={{ fontSize: '1rem', fontWeight: 500 }}>{t('enrollment.agent.summary.of_pay')}</span>
        </p>
        <p className="mt-1.5 text-blue-50" style={{ fontSize: '0.95rem' }}>
          <Rich text={t('enrollment.agent.summary.per_paycheck', { amount: data.perPaycheck })} />
        </p>
      </div>

      <div className="px-5">
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 py-4 dark:border-gray-800">
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-gray-800/60">
            <p className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.8rem' }}>{t('enrollment.agent.summary.you_save')}</p>
            <p className="tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{data.youPerYear}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
            <p className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300" style={{ fontSize: '0.8rem' }}>
              {t('enrollment.agent.summary.employer_adds')} <TermInfo term="employer_match" />
            </p>
            <p className="tabular-nums text-emerald-900 dark:text-emerald-200" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{data.employerPerYear}</p>
          </div>
          {!data.fullMatch && (
            <p className="col-span-2 text-amber-800 dark:text-amber-300" style={{ fontSize: '0.88rem' }}>
              <Rich text={data.matchNote} />
            </p>
          )}
        </div>

        <dl className="divide-y divide-slate-100 dark:divide-gray-800">
          <Row label={t('enrollment.agent.summary.tax')} {...edit(1, t('enrollment.agent.summary.tax'))}>{data.taxLabel}</Row>
          <Row label={t('enrollment.agent.summary.auto')} {...edit(2, t('enrollment.agent.summary.auto'))}>{data.autoText}</Row>
          <Row label={t('enrollment.agent.summary.invest')} {...edit(3, t('enrollment.agent.summary.invest'))}>
            {data.investLabel}
            <span className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800" aria-hidden>
              {data.funds.map((f) => (
                <span key={f.name} style={{ width: `${f.pct}%`, background: f.color }} />
              ))}
            </span>
            <span className="mt-1.5 block text-gray-600 dark:text-gray-400" style={{ fontSize: '0.82rem', fontWeight: 400 }}>
              {t('enrollment.agent.summary.fee', { fee: data.fee })}
            </span>
          </Row>
          <div className="py-3">
            <p className="flex items-center gap-1 text-gray-600 dark:text-gray-400" style={{ fontSize: '0.82rem' }}>
              {t('enrollment.agent.summary.projection')} <TermInfo term="projected_balance" />
            </p>
            <p className="tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {t('enrollment.agent.summary.projection_value', { amount: data.projected, age: data.retireAge })}
            </p>
          </div>
        </dl>
      </div>

      <div className="space-y-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
        {issues.length > 0 && (
          <div role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200" style={{ fontSize: '0.88rem' }}>
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="h-4 w-4" aria-hidden />
              {t('enrollment.agent.summary.fix_first')}
            </p>
            <ul className="ml-6 mt-1 list-disc">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onReview}
          disabled={issues.length > 0}
          aria-describedby="enrol-review-help"
          className="mt-1 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-white shadow-lg shadow-blue-700/20 transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
          style={{ fontSize: '1.05rem', fontWeight: 700 }}
        >
          <Lock className="h-5 w-5" aria-hidden />
          {t('enrollment.agent.summary.review_enrol')}
        </button>
        <p id="enrol-review-help" className="mt-2 text-center text-gray-600 dark:text-gray-400" style={{ fontSize: '0.85rem' }}>
          {issues.length ? t('enrollment.agent.summary.needs_fix') : t('enrollment.agent.summary.review_note')}
        </p>
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.8rem' }}>
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          {t('enrollment.agent.summary.sim_short')}
        </p>
      </div>
    </section>
  )
}
