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
export function ActivityHistory() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const now = useNow()
  const deferral = useElectionsStore((s) => s.deferral)
  const frequency = useProfileStore((s) => s.employment.payrollFrequency)
  const salary = useEnrollmentDraftStore((s) => s.draftData.savings?.salary ?? s.draftData.personalization?.salary) ?? 85_000

  const [group, setGroup] = useState<ActivityGroup | 'all'>('all')
  const [planId, setPlanId] = useState('')
  const [generating, setGenerating] = useState(false)

  const rows = useMemo(() => buildActivity({ deferral, salary, frequency, balance: 274_200.82, now }), [deferral, salary, frequency, now])
  const visible = rows.filter((r) => (group === 'all' || groupOf(r.kind) === group) && (!planId || r.planId === planId))
  const planName = (id: string) => DOC_PLANS.find((p) => p.id === id)?.name ?? id
  const money = (v: number) => `$${v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t('activity.title')} className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <button key={g} type="button" role="tab" aria-selected={group === g} onClick={() => setGroup(g)} className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors', group === g ? 'border-primary bg-primary text-text-inverse' : 'border-border-default bg-surface-card text-text-secondary hover:bg-surface-elevated')}>
              {t(`activity.group_${g}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label>
            <span className="sr-only">{t('activity.filter_plan')}</span>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="h-9 rounded-md border border-border-default bg-surface-card px-2 text-sm text-text-primary">
              <option value="">{t('documents.filters.all')}</option>
              {DOC_PLANS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setGenerating(true)} className="h-9 rounded-md border border-primary px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">{t('documents.generate.open')}</button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{t('activity.none')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-text-muted">
              <tr className="border-b border-border-default">
                <th scope="col" className="py-2 pr-3 font-semibold">{t('activity.col_date')}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{t('activity.col_type')}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{t('activity.col_plan')}</th>
                <th scope="col" className="py-2 text-right font-semibold">{t('activity.col_amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {visible.map((r) => (
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
      <p className="mt-3 text-xs text-text-muted">{t('portfolio.sample_note')}</p>
      <GenerateStatementDialog open={generating} onClose={() => setGenerating(false)} defaultPlanId={planId} />
    </div>
  )
}

export default ActivityHistory
