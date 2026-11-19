import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useProfileStore } from '@/features/profile/profileStore'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { GenerateStatementDialog } from '@/features/documents/GenerateStatementDialog'
import { DOC_PLANS } from '@/features/documents/buildDocuments'
import { buildActivity, groupOf, type ActivityGroup } from '../activityData'

const GROUPS: (ActivityGroup | 'all')[] = ['all', 'deferral', 'employer', 'other']

/** Contributions, loan repayments and dividends with type and plan filters. */
/** `limit`: how many rows show before "Show All" (all of them when left out) */
export function ActivityHistory({ limit }: { limit?: number } = {}) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const now = useNow()
  const deferral = useElectionsStore((s) => s.deferral)
  const frequency = useProfileStore((s) => s.employment.payrollFrequency)
  const salary = useEnrollmentDraftStore((s) => s.draftData.savings?.salary ?? s.draftData.personalization?.salary) ?? 85_000

  const [group, setGroup] = useState<ActivityGroup | 'all'>('all')
  const [planId, setPlanId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo(() => buildActivity({ deferral, salary, frequency, balance: 274_200.82, now }), [deferral, salary, frequency, now])
  const visible = rows.filter((r) => (group === 'all' || groupOf(r.kind) === group) && (!planId || r.planId === planId))
  const shown = limit && !showAll ? visible.slice(0, limit) : visible
  const planName = (id: string) => DOC_PLANS.find((p) => p.id === id)?.name ?? id
  const money = (v: number) => `$${v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t('activity.title')} className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <button key={g} type="button" role="tab" aria-selected={group === g} onClick={() => setGroup(g)} className={cn('inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2', group === g ? 'bg-[#0B1533] text-white dark:bg-white dark:text-[#0B1533]' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-200 dark:ring-white/15 dark:hover:bg-white/10')}>
              {t(`activity.group_${g}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label>
            <span className="sr-only">{t('activity.filter_plan')}</span>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="h-9 rounded-full border border-slate-200 bg-white px-3.5 text-[13px] text-text-primary dark:border-white/15 dark:bg-white/5">
              <option value="">{t('documents.filters.all')}</option>
              {DOC_PLANS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setGenerating(true)} className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-slate-900 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10">{t('documents.generate.open')}</button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-600 dark:text-slate-300">{t('activity.none')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
              <tr className="border-b border-border-default">
                <th scope="col" className="py-2 pr-3 font-semibold">{t('activity.col_date')}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{t('activity.col_type')}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{t('activity.col_plan')}</th>
                <th scope="col" className="py-2 text-right font-semibold">{t('activity.col_amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-text-secondary">{new Date(r.at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="py-2.5 pr-3 font-medium text-text-primary">{t(`activity.kind_${r.kind}`)}</td>
                  <td className="py-2.5 pr-3 text-text-secondary">{planName(r.planId)}</td>
                  <td className="py-2.5 text-right font-medium tabular-nums text-text-primary">{money(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {limit && visible.length > limit && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 inline-flex h-9 items-center rounded-full px-1 text-[13px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-blue-300"
        >
          {showAll ? t('activity.show_fewer') : t('activity.show_all', { count: visible.length })}
        </button>
      )}
      <GenerateStatementDialog open={generating} onClose={() => setGenerating(false)} defaultPlanId={planId} />
    </div>
  )
}

export default ActivityHistory
