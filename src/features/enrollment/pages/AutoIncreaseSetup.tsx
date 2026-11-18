import { useState, useMemo, useId, useEffect, useCallback } from 'react'
import { RangeSlider } from '@/design-system/components/RangeSlider'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentStepNav, type EnrollmentPrimaryLabel } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { getAppDateLocale } from '@/lib/dateLocale'
import { getGrowthRate } from '@/lib/retirementCalculations'
import { projectBalance } from '@/features/enrollment/enrollmentMath'
import { PLAN_CONFIG } from '@/features/enrollment/agent/planConfig'
import { InfoTip } from '@/features/enrollment/flow/core/ui'
import { Calendar, Target, DollarSign, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BODY_TEXT, CARD_TITLE, HEADING, IconChip, MUTED_TEXT, RULE, SECTION_LABEL, StepHeader, TEXT_LINK, badge, card, chip, choice } from '@/features/enrollment/enrollmentUi'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type IncrementCycle = 'calendar' | 'participant' | 'plan'

export default function AutoIncreaseSetup() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization } = useEnrollment()

  // Plan rules: whole-point increases and a stop-at cap, both within the plan's allowed ranges
  const [amountMin, amountMax] = PLAN_CONFIG.autoIncrease.amount
  const [capMin, capMax] = PLAN_CONFIG.autoIncrease.cap
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)))
  const [increaseAmount, setIncreaseAmount] = useState(() => clamp(data.autoIncreaseAmount, amountMin, amountMax))
  const [maxContribution, setMaxContribution] = useState(() => clamp(data.autoIncreaseMax, capMin, capMax))
  const [incrementCycle, setIncrementCycle] = useState<IncrementCycle>('calendar')
  // Growth timeline shows every year, which gets long fast. Default to key
  // milestones (Now, Y1, midpoint, final) and let people open the full list.
  const [showAllRows, setShowAllRows] = useState(false)

  const currentPercent = data.contributionPercent
  const salary = data.salary
  // Chart height fits the highest rate shown, in steps of 5%
  const chartTop = Math.max(20, Math.ceil(Math.max(currentPercent, maxContribution) / 5) * 5)
  const gradientId = useId().replace(/:/g, '_') + '_autoInc'
  const currentMonthlyContribution = Math.round((salary * currentPercent) / 100 / 12)

  const progression = useMemo(() => {
    if (increaseAmount === 0 || currentPercent >= maxContribution) {
      return [{ year: 0, percent: currentPercent }, { year: 1, percent: currentPercent }]
    }
    const points: { year: number; percent: number }[] = [{ year: 0, percent: currentPercent }]
    let pct = currentPercent
    let yr = 0
    while (pct < maxContribution && yr < 30) {
      yr++
      pct = Math.min(pct + increaseAmount, maxContribution)
      points.push({ year: yr, percent: Math.round(pct * 10) / 10 })
    }
    const lastYear = points[points.length - 1].year
    points.push({ year: lastYear + 1, percent: maxContribution })
    return points
  }, [currentPercent, increaseAmount, maxContribution])

  const yearsToMax =
    currentPercent >= maxContribution || increaseAmount === 0
      ? 0
      : Math.ceil((maxContribution - currentPercent) / increaseAmount)

  // Today's rate, then one row per increase up to and including the year the maximum is reached
  const yearByYearData = useMemo(() => {
    if (increaseAmount <= 0 || currentPercent >= maxContribution) return []
    const today = new Date()
    // First increase: next Jan 1 (calendar), next Apr 1 (plan year), or one year after enrolling (anniversary)
    const firstIncrease =
      incrementCycle === 'participant'
        ? new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
        : (() => {
            const d = new Date(today.getFullYear(), incrementCycle === 'calendar' ? 0 : 3, 1)
            if (d <= today) d.setFullYear(d.getFullYear() + 1)
            return d
          })()
    const format = (d: Date) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    const rows: { year: number; percent: number; annual: number; date: string }[] = [
      { year: 0, percent: currentPercent, annual: Math.round((salary * currentPercent) / 100), date: format(today) },
    ]
    let pct = currentPercent
    for (let n = 1; pct < maxContribution; n++) {
      pct = Math.min(pct + increaseAmount, maxContribution)
      const date = new Date(firstIncrease)
      date.setFullYear(firstIncrease.getFullYear() + n - 1)
      rows.push({ year: n, percent: Math.round(pct * 10) / 10, annual: Math.round((salary * pct) / 100), date: format(date) })
    }
    return rows
  }, [currentPercent, increaseAmount, maxContribution, salary, incrementCycle, locale])

  // Collapsed growth timeline: 4 informative rows instead of every year.
  // first + Y1 (shows the cadence), the midpoint (shows the arc), and the
  // final row where the max is reached. Short runs (<=4) stay as-is.
  const timelineHighlights = useMemo(() => {
    if (yearByYearData.length <= 4) return yearByYearData
    const first = yearByYearData[0]
    const second = yearByYearData[1]
    const last = yearByYearData[yearByYearData.length - 1]
    const mid = yearByYearData[Math.floor(yearByYearData.length / 2)]
    const seen = new Set<number>()
    return [first, second, mid, last].filter((row) => {
      if (!row || seen.has(row.year)) return false
      seen.add(row.year)
      return true
    })
  }, [yearByYearData])

  const financialImpact = useMemo(() => {
    const base = {
      startingBalance: personalization.currentSavings,
      salary,
      ratePercent: currentPercent,
      sources: data.contributionSources,
      years: personalization.retirementAge - personalization.currentAge,
      growthRate: getGrowthRate(data.riskLevel),
    }
    const balanceFixed = projectBalance(base)
    const balanceAuto = projectBalance({ ...base, autoIncrease: { amount: increaseAmount, max: maxContribution } })
    return { withoutIncrease: balanceFixed, withIncrease: balanceAuto, difference: balanceAuto - balanceFixed }
  }, [currentPercent, increaseAmount, maxContribution, salary, data.riskLevel, data.contributionSources, personalization])

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
    if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString(locale)}K`
    return `$${Math.round(val).toLocaleString(locale)}`
  }

  const handleSave = useCallback(() => {
    updateData({ autoIncrease: true, autoIncreaseAmount: increaseAmount, autoIncreaseMax: maxContribution })
    useEnrollmentDraftStore.getState().advanceStep(
      {
        enabled: true,
        amount: increaseAmount,
        max: maxContribution,
        increasePercent: increaseAmount,
      },
      'autoIncrease'
    )
    navigate('/enrollment/investment')
  }, [updateData, increaseAmount, maxContribution, navigate])

  useEffect(() => {
    setStepNav({
      showBack: true,
      onBack: () => navigate('/enrollment/auto-increase'),
      onNext: handleSave,
      primaryLabel: t('enrollment.next') as EnrollmentPrimaryLabel,
      nextDisabled: increaseAmount === 0,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, handleSave, increaseAmount, t])

  interface TooltipPayloadItem {
    value?: number
  }
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: TooltipPayloadItem[]
    label?: number
  }) => {
    if (active && payload && payload.length) {
      const v = payload[0].value
      return (
        <div className="rounded-xl bg-white px-3 py-2 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/15">
          <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.7rem' }}>
            {label === 0 ? t('enrollment.auto_increase_setup.tooltip_today') : t('enrollment.auto_increase_setup.tooltip_year', { n: label })}
          </p>
          <p className="tabular-nums text-[#0B1533] dark:text-white" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {t('enrollment.auto_increase_setup.tooltip_pct', { v })}
          </p>
        </div>
      )
    }
    return null
  }

  const cycleOptions = [
    { value: 'calendar' as const, labelKey: 'cycle_calendar' as const, subKey: 'cycle_calendar_sub' as const },
    { value: 'participant' as const, labelKey: 'cycle_participant' as const, subKey: 'cycle_participant_sub' as const },
    { value: 'plan' as const, labelKey: 'cycle_plan' as const, subKey: 'cycle_plan_sub' as const },
  ]

  const yearsUnit = yearsToMax === 1 ? t('enrollment.auto_increase_setup.year_one') : t('enrollment.auto_increase_setup.year_other')

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <StepHeader
          title={t('enrollment.auto_increase_setup.title')}
          subtitle={t('enrollment.auto_increase_setup.subtitle')}
          aside={
            <dl className={cn('flex shrink-0 items-start divide-x', 'divide-slate-200/80 dark:divide-white/10')}>
              <div className="pr-5">
                <dt className={SECTION_LABEL}>{t('enrollment.auto_increase_setup.current')}</dt>
                <dd className={cn('mt-1 text-2xl font-extrabold leading-none tabular-nums', HEADING)}>
                  {currentPercent}%<span className={cn('ml-1.5 text-xs font-medium', MUTED_TEXT)}>${currentMonthlyContribution.toLocaleString(locale)}/mo</span>
                </dd>
              </div>
              <div className="pl-5">
                <dt className={SECTION_LABEL}>{t('enrollment.auto_increase_setup.target_max')}</dt>
                <dd className="mt-1 text-2xl font-extrabold leading-none tabular-nums text-primary dark:text-blue-300">{maxContribution}%</dd>
              </div>
            </dl>
          }
        />

        <div className="grid items-start gap-5 lg:grid-cols-5">
          {/* Left — Controls (3/5): one card, three ruled sections */}
          <div className="space-y-3 lg:col-span-3">
            <div className={cn(card('plain', false), 'divide-y', 'divide-slate-200/80 dark:divide-white/10')}>
              {/* Increment Cycle */}
              <fieldset className="p-5 sm:p-6">
                <legend className={cn('float-left mb-3 w-full', CARD_TITLE)}>{t('enrollment.auto_increase_setup.increment_cycle')}</legend>
                <div className="clear-both grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {cycleOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(choice(incrementCycle === opt.value), 'flex cursor-pointer flex-col gap-0.5 p-3.5 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-300/70')}
                    >
                      <input
                        type="radio"
                        name="increment-cycle"
                        value={opt.value}
                        checked={incrementCycle === opt.value}
                        onChange={(e) => setIncrementCycle(e.target.value as IncrementCycle)}
                        className="sr-only"
                      />
                      <span className={cn('text-sm font-bold', HEADING)}>{t(`enrollment.auto_increase_setup.${opt.labelKey}`)}</span>
                      <span className={cn('text-xs', MUTED_TEXT)}>{t(`enrollment.auto_increase_setup.${opt.subKey}`)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Increase Amount */}
              <div className="flex items-start gap-3 p-5 sm:p-6">
                <IconChip Icon={Calendar} tone="blue" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={cn('text-sm font-bold', HEADING)}>
                      {t('enrollment.auto_increase_setup.increase_label')}{' '}
                      {/* Why the steps stop at the plan's maximum */}
                      <InfoTip
                        label={t('enrollment.auto_increase_setup.increase_why_label', { max: amountMax })}
                        text={t('enrollment.auto_increase_setup.increase_why', { min: amountMin, max: amountMax })}
                      />
                    </p>
                    <p className="shrink-0 text-base font-extrabold tabular-nums text-primary dark:text-blue-300">{t('enrollment.auto_increase_setup.per_cycle', { v: increaseAmount })}</p>
                  </div>
                  <div className="mt-3">
                    <RangeSlider min={amountMin} max={amountMax} step={1} value={increaseAmount} onChange={setIncreaseAmount} aria-label={t('enrollment.auto_increase_setup.increase_label')} aria-valuetext={`${increaseAmount}%`} />
                    <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                      <span>{amountMin}%</span>
                      <span>{amountMax}%</span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3].map((opt) => (
                      <button key={opt} type="button" onClick={() => setIncreaseAmount(opt)} aria-pressed={increaseAmount === opt} className={cn(chip(increaseAmount === opt), 'min-w-[56px]')}>
                        {opt}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Max Contribution */}
              <div className="flex items-start gap-3 p-5 sm:p-6">
                <IconChip Icon={Target} tone="violet" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={cn('text-sm font-bold', HEADING)}>{t('enrollment.auto_increase_setup.stop_at')}</p>
                    <p className="shrink-0 text-base font-extrabold tabular-nums text-primary dark:text-blue-300">{maxContribution}%</p>
                  </div>
                  <p className={cn('mt-0.5 text-xs', MUTED_TEXT)}>{t('enrollment.auto_increase_setup.stop_hint')}</p>
                  <div className="mt-3">
                    <RangeSlider min={capMin} max={capMax} step={1} value={maxContribution} onChange={setMaxContribution} aria-label={t('enrollment.auto_increase_setup.stop_at')} aria-valuetext={`${maxContribution}%`} />
                    <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                      <span>{capMin}%</span>
                      <span>{capMax}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 px-1">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className={cn('text-xs leading-relaxed', MUTED_TEXT)}>{t('enrollment.auto_increase_setup.footnote')}</p>
            </div>
          </div>

          {/* Right — Projection (2/5) — above controls on mobile */}
          <div className="order-first lg:order-last lg:col-span-2">
            <div className={cn(card('plain', false), 'overflow-hidden lg:sticky lg:top-28')}>
              {/* Chart */}
              <div className="h-48 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progression}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-green)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-green)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, chartTop]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="percent"
                      stroke="var(--chart-green)"
                      fill={`url(#${gradientId})`}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className={cn('border-t', RULE)} />

              <div className="px-5 py-3.5">
                <p className={cn('text-[13px] leading-relaxed', BODY_TEXT)}>
                  {currentPercent >= maxContribution
                    ? t('enrollment.auto_increase_setup.summary_at_max')
                    : increaseAmount === 0
                      ? t('enrollment.auto_increase_setup.summary_pick')
                      : t('enrollment.auto_increase_setup.summary_grow', {
                          fromPct: currentPercent,
                          toPct: maxContribution,
                          years: yearsToMax,
                          yearsUnit,
                        })}
                </p>
              </div>

              {increaseAmount > 0 && financialImpact.difference > 0 && (
                <>
                  <div className={cn('border-t', RULE)} />
                  {/* Savings Impact as a single row: Without / With stacked
                      vertically so the two figures compare cleanly, and the
                      "Could add" delta as one sentence below. No tiles,
                      no heavy backgrounds. */}
                  <div className="space-y-2.5 px-5 py-4">
                    <p className={SECTION_LABEL}>{t('enrollment.auto_increase_setup.savings_impact')}</p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                      <dt className={cn('text-xs', MUTED_TEXT)}>
                        {t('enrollment.auto_increase_setup.without')}
                      </dt>
                      <dt className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {t('enrollment.auto_increase_setup.with_increases')}
                      </dt>
                      <dd className={cn('text-lg font-bold tabular-nums', HEADING)}>
                        {formatCurrency(financialImpact.withoutIncrease)}
                      </dd>
                      <dd className="text-right text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(financialImpact.withIncrease)}
                      </dd>
                    </dl>
                    <p className="flex items-start gap-1.5 pt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <DollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{t('enrollment.auto_increase_setup.could_add', { amount: formatCurrency(financialImpact.difference) })}</span>
                    </p>
                  </div>
                </>
              )}

              {yearByYearData.length > 0 && (
                <>
                  <div className={cn('border-t', RULE)} />
                  <div className="px-5 py-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className={SECTION_LABEL}>{t('enrollment.auto_increase_setup.growth_timeline')}</h3>
                      {yearByYearData.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setShowAllRows((v) => !v)}
                          className={cn(TEXT_LINK, 'text-xs')}
                        >
                          {showAllRows
                            ? t('enrollment.auto_increase_setup.show_milestones', 'Show milestones only')
                            : t('enrollment.auto_increase_setup.show_all_rows', 'Show all years')}
                        </button>
                      )}
                    </div>
                    <div className="-mx-5 overflow-x-auto">
                      <table className="w-full">
                        <thead className={cn('border-b', RULE)}>
                          <tr>
                            {(['col_year', 'col_date', 'col_pct', 'col_annual'] as const).map((h, i) => (
                              <th
                                key={h}
                                className={cn('px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide first:pl-5 last:pr-5', MUTED_TEXT, i === 3 ? 'text-right' : 'text-left')}
                              >
                                {t(`enrollment.auto_increase_setup.${h}`)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                          {(showAllRows ? yearByYearData : timelineHighlights).map((row, idx) => (
                            <tr
                              key={idx}
                              className={cn('transition-colors hover:bg-slate-50/70 dark:hover:bg-white/5', row.percent === maxContribution && 'bg-blue-50/70 dark:bg-blue-500/10')}
                            >
                              <td className={cn('py-1.5 pl-5 pr-3 text-xs font-semibold', HEADING)}>
                                {row.year === 0
                                  ? t('enrollment.auto_increase_setup.now')
                                  : t('enrollment.auto_increase_setup.y_prefix', { n: row.year })}
                              </td>
                              <td className={cn('px-3 py-1.5 text-xs', MUTED_TEXT)}>
                                {row.date}
                              </td>
                              <td className="px-3 py-1.5">
                                <div className="flex items-center gap-1">
                                  <span className={cn('text-xs font-semibold tabular-nums', HEADING)}>
                                    {row.percent}%
                                  </span>
                                  {row.percent === maxContribution && (
                                    <span className={cn(badge('blue'), 'px-1.5 py-0 text-[9px]')}>{t('enrollment.auto_increase_setup.max_badge')}</span>
                                  )}
                                </div>
                              </td>
                              <td className={cn('py-1.5 pl-3 pr-5 text-right text-xs font-semibold tabular-nums', HEADING)}>
                                ${(row.annual / 1000).toLocaleString(locale)}K
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={cn('mt-3 border-t pt-3', RULE)}>
                      <p className="text-xs">
                        <span className={cn('font-semibold', HEADING)}>
                          {t('enrollment.auto_increase_setup.timeline_line', {
                            from: currentPercent,
                            to: maxContribution,
                            n: yearsToMax,
                            unit: yearsToMax === 1 ? t('enrollment.auto_increase_setup.yr_one') : t('enrollment.auto_increase_setup.yr_other'),
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
