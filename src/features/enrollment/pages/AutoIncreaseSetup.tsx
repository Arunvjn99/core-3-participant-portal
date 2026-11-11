import { useState, useMemo, useId, useEffect, useCallback } from 'react'
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
import { TrendingUp, Calendar, Target, DollarSign, Info } from 'lucide-react'
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
  const amountFill = ((increaseAmount - amountMin) / (amountMax - amountMin)) * 100
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
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>
            {label === 0 ? t('enrollment.auto_increase_setup.tooltip_today') : t('enrollment.auto_increase_setup.tooltip_year', { n: label })}
          </p>
          <p className="tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
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
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/40">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {t('enrollment.auto_increase_setup.title')}
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              {t('enrollment.auto_increase_setup.subtitle')}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-950/30">
            <div className="flex items-start gap-6">
              <div>
                <p
                  className="mb-0.5 text-blue-700 dark:text-blue-400"
                  style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {t('enrollment.auto_increase_setup.current')}
                </p>
                <p className="text-blue-900 dark:text-blue-300" style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                  {currentPercent}%
                </p>
                <p className="mt-1 text-blue-700 dark:text-blue-400" style={{ fontSize: '0.7rem' }}>
                  ${currentMonthlyContribution.toLocaleString(locale)}/mo
                </p>
              </div>
              <div className="border-l border-blue-300 pl-6 dark:border-blue-700">
                <p
                  className="mb-0.5 text-blue-600 dark:text-blue-400"
                  style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {t('enrollment.auto_increase_setup.target_max')}
                </p>
                <p className="text-blue-900 dark:text-blue-300" style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                  {maxContribution}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-5">
          {/* Left — Controls (3/5) */}
          <div className="space-y-4 lg:col-span-3">
            {/* Increment Cycle */}
            <div className="rounded-2xl border-2 border-blue-200 bg-white px-4 py-3 shadow-sm dark:border-blue-800/40 dark:bg-gray-900">
              <h3 className="mb-2.5 text-gray-900 dark:text-white" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                {t('enrollment.auto_increase_setup.increment_cycle')}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {cycleOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-all hover:border-blue-300 dark:hover:border-blue-700 ${
                      incrementCycle === opt.value
                        ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="increment-cycle"
                        value={opt.value}
                        checked={incrementCycle === opt.value}
                        onChange={(e) => setIncrementCycle(e.target.value as IncrementCycle)}
                        className="h-4 w-4 cursor-pointer text-blue-600"
                      />
                      <p className="text-gray-900 dark:text-white" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {t(`enrollment.auto_increase_setup.${opt.labelKey}`)}
                      </p>
                    </div>
                    <p className="ml-6 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>
                      {t(`enrollment.auto_increase_setup.${opt.subKey}`)}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            {/* Increase Amount */}
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <label className="text-gray-900 dark:text-white" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {t('enrollment.auto_increase_setup.increase_label')}
                  </label>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-600" style={{ fontSize: '0.65rem' }}>
                        {amountMin}%
                      </span>
                      <span className="tabular-nums text-blue-600 dark:text-blue-400" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        {t('enrollment.auto_increase_setup.per_cycle', { v: increaseAmount })}
                      </span>
                      <span className="text-gray-400 dark:text-gray-600" style={{ fontSize: '0.65rem' }}>
                        {amountMax}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={amountMin}
                      max={amountMax}
                      step={1}
                      value={increaseAmount}
                      onChange={(e) => setIncreaseAmount(parseInt(e.target.value, 10))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full"
                      style={{
                        background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${amountFill}%, var(--slider-track) ${amountFill}%, var(--slider-track) 100%)`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIncreaseAmount(opt)}
                        className={`flex-1 rounded-lg py-1.5 transition-all ${
                          increaseAmount === opt
                            ? 'brand-bg text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                        style={{ fontSize: '0.75rem', fontWeight: 500 }}
                      >
                        {opt}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Max Contribution */}
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <label className="text-gray-900 dark:text-white" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {t('enrollment.auto_increase_setup.stop_at')}
                  </label>
                  <p className="mt-0.5 text-gray-400 dark:text-gray-500" style={{ fontSize: '0.78rem' }}>
                    {t('enrollment.auto_increase_setup.stop_hint')}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-600" style={{ fontSize: '0.7rem' }}>
                        {capMin}%
                      </span>
                      <span className="tabular-nums text-purple-600 dark:text-purple-400" style={{ fontSize: '1rem', fontWeight: 700 }}>
                        {maxContribution}%
                      </span>
                      <span className="text-gray-400 dark:text-gray-600" style={{ fontSize: '0.7rem' }}>
                        {capMax}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={capMin}
                      max={capMax}
                      step={1}
                      value={maxContribution}
                      onChange={(e) => setMaxContribution(parseInt(e.target.value, 10))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full"
                      style={{
                        background: `linear-gradient(to right, var(--accent-purple) 0%, var(--accent-purple) ${((maxContribution - capMin) / (capMax - capMin)) * 100}%, var(--slider-track) ${((maxContribution - capMin) / (capMax - capMin)) * 100}%, var(--slider-track) 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 px-1">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.78rem' }}>
                {t('enrollment.auto_increase_setup.footnote')}
              </p>
            </div>
          </div>

          {/* Right — Projection (2/5) — above controls on mobile */}
          <div className="order-first lg:order-last lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:sticky lg:top-28">
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

              <div className="border-t border-gray-100 dark:border-gray-800" />

              <div className="px-5 py-3.5">
                <p className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.82rem' }}>
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
                  <div className="border-t border-gray-100 dark:border-gray-800" />
                  {/* Savings Impact as a single row: Without / With stacked
                      vertically so the two figures compare cleanly, and the
                      "Could add" delta as one sentence below. No tiles,
                      no heavy backgrounds. */}
                  <div className="space-y-2.5 px-5 py-4">
                    <p className="text-gray-900 dark:text-white" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {t('enrollment.auto_increase_setup.savings_impact')}
                    </p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                      <dt className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>
                        {t('enrollment.auto_increase_setup.without')}
                      </dt>
                      <dt className="text-right text-green-700 dark:text-green-400" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        {t('enrollment.auto_increase_setup.with_increases')}
                      </dt>
                      <dd className="tabular-nums text-gray-700 dark:text-gray-200" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {formatCurrency(financialImpact.withoutIncrease)}
                      </dd>
                      <dd className="text-right tabular-nums text-green-700 dark:text-green-400" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {formatCurrency(financialImpact.withIncrease)}
                      </dd>
                    </dl>
                    <p className="flex items-start gap-1.5 pt-1 text-green-700 dark:text-green-400" style={{ fontSize: '0.75rem' }}>
                      <DollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{t('enrollment.auto_increase_setup.could_add', { amount: formatCurrency(financialImpact.difference) })}</span>
                    </p>
                  </div>
                </>
              )}

              {yearByYearData.length > 0 && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-800" />
                  <div className="px-4 py-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-gray-900 dark:text-white" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {t('enrollment.auto_increase_setup.growth_timeline')}
                      </h3>
                      {yearByYearData.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setShowAllRows((v) => !v)}
                          className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
                          style={{ fontSize: '0.72rem', fontWeight: 500 }}
                        >
                          {showAllRows
                            ? t('enrollment.auto_increase_setup.show_milestones', 'Show milestones only')
                            : t('enrollment.auto_increase_setup.show_all_rows', 'Show all years')}
                        </button>
                      )}
                    </div>
                    <div className="-mx-4 overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            {(['col_year', 'col_date', 'col_pct', 'col_annual'] as const).map((h, i) => (
                              <th
                                key={h}
                                className={`px-3 py-1.5 text-gray-600 dark:text-gray-400 ${i === 3 ? 'text-right' : 'text-left'}`}
                                style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                              >
                                {t(`enrollment.auto_increase_setup.${h}`)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {(showAllRows ? yearByYearData : timelineHighlights).map((row, idx) => (
                            <tr
                              key={idx}
                              className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${row.percent === maxContribution ? 'bg-purple-50 dark:bg-purple-950/20' : ''}`}
                            >
                              <td className="px-3 py-1.5 text-gray-900 dark:text-white" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                {row.year === 0
                                  ? t('enrollment.auto_increase_setup.now')
                                  : t('enrollment.auto_increase_setup.y_prefix', { n: row.year })}
                              </td>
                              <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>
                                {row.date}
                              </td>
                              <td className="px-3 py-1.5">
                                <div className="flex items-center gap-1">
                                  <span className="tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    {row.percent}%
                                  </span>
                                  {row.percent === maxContribution && (
                                    <span
                                      className="rounded bg-purple-100 px-1 py-0.5 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                                      style={{ fontSize: '0.55rem', fontWeight: 600 }}
                                    >
                                      {t('enrollment.auto_increase_setup.max_badge')}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                ${(row.annual / 1000).toLocaleString(locale)}K
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.7rem' }}>
                        <span className="font-semibold text-gray-900 dark:text-white">
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
