import { useTranslation } from 'react-i18next'
import { Landmark } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconTile } from '@/design-system/icons'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { SECOND_PLAN, useSecondPlan } from './secondPlan'
import { Stepper, Switch } from '@/features/enrollment/flow/core/ui'

/**
 * The second plan (a 457(b)): include it or not, how much to save in it, and its key facts. Changes save to the draft.
 * As a card in the step-by-step flow; `bare` for one-click enrollment, where it fills the plan card under its own tab.
 */
export function SecondPlanCard({ employer, salary, periods, locale, className, bare = false }: { employer: string; salary: number; periods: number; locale: string; className?: string; bare?: boolean }) {
  const { t } = useTranslation()
  const sp = useSecondPlan()
  const merge = useEnrollmentDraftStore((s) => s.mergeDraftSection)
  if (!sp) return null
  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`
  const perCheck = (salary * sp.rate) / 100 / periods
  const yearly = Math.min((salary * sp.rate) / 100, SECOND_PLAN.limit)

  const details = (
    <>
      {/* Include it: a labelled switch, so it reads as a choice and not a setting */}
      <div className={cn('flex items-center justify-between gap-4', !bare && 'mt-4 border-t border-slate-200/80 pt-4 dark:border-white/10')}>
        <div>
          <p className="text-[14px] font-semibold text-text-primary">{t('plan2.include_title')}</p>
          <p className="text-[12px] text-text-secondary">{sp.enrolled ? t('plan2.included') : t('plan2.later')}</p>
        </div>
        <Switch checked={sp.enrolled} onChange={(v) => merge('secondPlan', { ...sp, enrolled: v })} label={t('plan2.include')} />
      </div>

      {sp.enrolled && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-white/10">
          <div>
            <p className="text-[13px] font-semibold text-text-primary">{t('plan2.rate_label')}</p>
            <p className="text-[12px] text-text-secondary">{t('plan2.rate_line', { amount: money(perCheck), yearly: money(yearly) })}</p>
          </div>
          <Stepper value={sp.rate} onChange={(v) => merge('secondPlan', { ...sp, rate: v })} min={SECOND_PLAN.minRate} max={SECOND_PLAN.maxRate} step={0.5} label={t('plan2.rate_label')} suffix="%" />
        </div>
      )}

      {/* The plan's key facts, in a row as on the 401(k) */}
      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-4 sm:grid-cols-3 dark:border-white/10">
        {[
          { k: t('plan2.fact_limit'), v: money(SECOND_PLAN.limit) },
          { k: t('plan2.fact_match'), v: t('plan2.fact_match_none') },
          { k: t('plan2.fact_invest'), v: t('plan2.fact_invest_same') },
        ].map((f) => (
          <div key={f.k}>
            <dt className="text-[12px] text-text-secondary">{f.k}</dt>
            <dd className="text-[14px] font-semibold text-text-primary">{f.v}</dd>
          </div>
        ))}
      </dl>
    </>
  )

  if (bare)
    return (
      <div className={cn('p-5 sm:p-6', className)}>
        <p className="mb-4 text-[13px] leading-snug text-text-secondary">{t('plan2.body', { limit: money(SECOND_PLAN.limit) })}</p>
        {details}
      </div>
    )

  return (
    <section aria-labelledby="second-plan-title" className={cn('rounded-[20px] bg-surface-card p-5 ring-1 ring-slate-200/70 sm:p-6 dark:ring-white/10', className)}>
      <div className="flex items-start gap-3">
        <IconTile icon={Landmark} tone="violet" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-violet-700 dark:text-violet-300">{t('plan2.eyebrow')}</p>
          <h3 id="second-plan-title" className="mt-0.5 text-[16px] font-bold leading-snug text-text-primary">{t('plan2.name', { employer })}</h3>
          <p className="mt-1 text-[13px] leading-snug text-text-secondary">{t('plan2.body', { limit: money(SECOND_PLAN.limit) })}</p>
        </div>
      </div>
      {details}
    </section>
  )
}
