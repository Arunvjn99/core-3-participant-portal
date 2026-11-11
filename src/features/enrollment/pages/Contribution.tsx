import { useState, useId, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useEnrollmentStepNav } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { Info, Minus, Plus } from 'lucide-react'
import { PLAN_CONFIG } from '@/features/enrollment/agent/planConfig'
import { annualEmployerMatch, matchableRate, missedEmployerMatch, type ProjectionInput } from '@/features/enrollment/enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

/**
 * Year-by-year balance and money put in (savings so far + you + employer), from today to retirement.
 * Same model as `projectBalance`, so the last point equals the balance shown on Review.
 */
function generateProjectionData({ startingBalance, salary, ratePercent, sources, years, growthRate, autoIncrease }: ProjectionInput) {
  const data: { year: string; value: number; contributions: number }[] = [
    { year: '0yr', value: Math.round(startingBalance), contributions: Math.round(startingBalance) },
  ]
  let total = startingBalance
  let putIn = startingBalance
  let rate = ratePercent
  const ceiling = autoIncrease ? Math.max(autoIncrease.max, ratePercent) : ratePercent
  for (let year = 1; year <= Math.max(0, Math.floor(years)); year++) {
    const yearly = (salary * rate) / 100 + annualEmployerMatch(salary, rate, sources)
    putIn += yearly
    total = (total + yearly) * (1 + growthRate)
    data.push({ year: `${year}yr`, value: Math.round(total), contributions: Math.round(putIn) })
    if (autoIncrease) rate = Math.min(rate + autoIncrease.amount, ceiling)
  }
  return data
}

const formatBalance = (val: number, locale: string) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString(locale)}K`
  return `$${Math.round(val).toLocaleString(locale)}`
}

export default function Contribution() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization, advanceStep } = useEnrollment()
  const locale = getAppDateLocale()
  const [compareMode, setCompareMode] = useState(false)
  const [comparePercent, setComparePercent] = useState(12)
  const gradientId = useId()
  const percent = data.contributionPercent
  const salary = data.salary

  const monthlyPaycheck = Math.round(salary / 12)
  const sources = data.contributionSources
  const yearsToRetirement = personalization.retirementAge - personalization.currentAge
  const growthRate = getGrowthRate(data.riskLevel)
  const growthPct = Math.round(growthRate * 1000) / 10
  const projectionBase = {
    startingBalance: personalization.currentSavings,
    salary,
    sources,
    years: yearsToRetirement,
    growthRate,
    autoIncrease: data.autoIncrease ? { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax } : null,
  }
  const projectionData = generateProjectionData({ ...projectionBase, ratePercent: percent })
  const projectedTotal = projectionData[projectionData.length - 1]?.value || 0
  const monthlyRetirementIncome = Math.round((projectedTotal * 0.04) / 12)
  const comparisonData = generateProjectionData({ ...projectionBase, ratePercent: comparePercent })
  const comparisonTotal = comparisonData[comparisonData.length - 1]?.value || 0
  const difference = comparisonTotal - projectedTotal
  const monthlyContribution = Math.round((salary * percent) / 100 / 12)
  // Match line: what the employer adds now, and the full amount when below the match
  const FULL_MATCH_PCT = PLAN_CONFIG.match.capPercent
  const belowMatch = matchableRate(percent, sources) < FULL_MATCH_PCT
  const matchGapAnnual = missedEmployerMatch(salary, percent, sources)
  const employerAnnual = annualEmployerMatch(salary, percent, sources)

  // Pre-tax or Roth on its own, or a split (any mix, including after-tax) fine-tuned on the Source step
  type TaxMode = 'preTax' | 'roth' | 'split'
  const taxLabelId = useId()
  const taxMode: TaxMode = sources.preTax === 100 ? 'preTax' : sources.roth === 100 ? 'roth' : 'split'
  const taxKey = taxMode === 'preTax' ? 'pretax' : taxMode
  const taxOptions: { mode: TaxMode; label: string }[] = [
    { mode: 'preTax', label: t('enrollment.contribution_page.tax_pretax') },
    { mode: 'roth', label: t('enrollment.contribution_page.tax_roth') },
    { mode: 'split', label: t('enrollment.contribution_page.tax_split') },
  ]
  const handleTaxMode = (mode: TaxMode) => {
    if (mode === taxMode) return
    const next =
      mode === 'preTax'
        ? { preTax: 100, roth: 0, afterTax: 0 }
        : mode === 'roth'
          ? { preTax: 0, roth: 100, afterTax: 0 }
          : { preTax: 60, roth: 40, afterTax: 0 }
    updateData({ contributionSources: next })
  }

  // Quick-select presets: three plain percents and a "get the full match"
  // tile. "Start/Strong/Fast" labels are gone — they don't say what the
  // participant actually gets.
  const quickOptions = useMemo(
    () => [
      { label: t('enrollment.contribution_page.opt_4'), value: 4 },
      { label: t('enrollment.contribution_page.opt_6'), value: 6, highlight: true },
      { label: t('enrollment.contribution_page.opt_10'), value: 10 },
      { label: t('enrollment.contribution_page.opt_15'), value: 15 },
    ],
    [t],
  )

  const adjustPercent = (delta: number) => {
    const newValue = Math.max(PLAN_CONFIG.contribution.min, Math.min(PLAN_CONFIG.contribution.max, percent + delta))
    updateData({ contributionPercent: newValue })
  }

  const handleQuick = (value: number) => {
    updateData({ contributionPercent: value })
  }

  useEffect(() => {
    setStepNav({
      showBack: true,
      onBack: () => navigate('/enrollment/plan'),
      onNext: () => {
        advanceStep(
          {
            percent: data.contributionPercent,
            rate: data.contributionPercent,
            type: 'percentage' as const,
          },
          'contribution'
        )
        navigate('/enrollment/contribution-source')
      },
      primaryLabel: 'Next',
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, advanceStep, data.contributionPercent])

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t('enrollment.contribution_page.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            {t('enrollment.contribution_page.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sections spread to the full card height so it lines up with the projection card */}
          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            <div className="rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/30 p-4 dark:border-blue-800/40 dark:from-blue-950/30 dark:to-blue-900/10">
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('enrollment.contribution_page.monthly_paycheck')}
              </p>
              <p className="mt-1 text-center text-2xl font-bold text-gray-900 dark:text-white">
                ${monthlyPaycheck.toLocaleString(locale)}
              </p>
            </div>

            <div className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('enrollment.contribution_page.your_contribution')}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustPercent(-1)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:hover:bg-blue-900/40"
                >
                  <Minus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </button>
                <p className="text-6xl font-extrabold leading-none tracking-tight text-blue-600 dark:text-blue-400">{percent}%</p>
                <button
                  type="button"
                  onClick={() => adjustPercent(1)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:hover:bg-blue-900/40"
                >
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            </div>

            {/* One dollar figure, monthly like the paycheck above */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">${monthlyContribution.toLocaleString(locale)}</span>{' '}
              {t('enrollment.contribution_page.per_month_from_pay')}
            </p>

            {/* What the employer adds, and how to get the rest when below the match */}
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3.5 py-2.5 text-center dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {t('enrollment.contribution_page.match_simple', { amount: `$${employerAnnual.toLocaleString(locale)}` })}
              </p>
              {belowMatch && (
                <p className="mt-0.5 text-xs text-emerald-700/90 dark:text-emerald-400/90">
                  {percent < FULL_MATCH_PCT
                    ? t('enrollment.contribution_page.match_more', {
                        pct: FULL_MATCH_PCT,
                        amount: `$${(employerAnnual + matchGapAnnual).toLocaleString(locale)}`,
                      })
                    : t('enrollment.contribution_page.match_after_tax')}
                </p>
              )}
            </div>

            {/* Tax treatment: writes the same split the Source step edits, so both stay in sync */}
            <div>
              <p id={taxLabelId} className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('enrollment.contribution_page.tax_label')}
              </p>
              <div role="radiogroup" aria-labelledby={taxLabelId} className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                {taxOptions.map((opt) => {
                  const selected = taxMode === opt.mode
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => handleTaxMode(opt.mode)}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>

              {/* What the selected option means for you, in plain words */}
              <div aria-live="polite" className="mt-2 rounded-xl bg-gray-50 px-3.5 py-2.5 dark:bg-gray-800/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t(`enrollment.contribution_page.tax_${taxKey}_title`)}</p>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">{t(`enrollment.contribution_page.tax_${taxKey}_body`, { pre: sources.preTax, roth: sources.roth })}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('enrollment.contribution_page.quick_select')}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleQuick(opt.value)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      percent === opt.value
                        ? 'brand-bg text-white shadow-md'
                        : opt.highlight
                          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/40 dark:hover:bg-emerald-900/40'
                          : 'bg-gray-100 text-gray-600 hover:scale-105 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            {/* No "on track" chip: we don't know the target yet. The Monthly
                Impact tile is gone too — the per-paycheck dollars already
                live on the left column of this step. */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('enrollment.contribution_page.projection_title')}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {t('enrollment.contribution_page.projection_sub', { age: personalization.retirementAge, rate: growthPct })}
              </p>
            </div>

            <div className="rounded-xl border border-green-200/50 bg-gradient-to-br from-green-50 to-green-100/30 p-5 dark:border-green-800/40 dark:from-green-950/30 dark:to-green-900/10">
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('enrollment.contribution_page.projected_age', { age: personalization.retirementAge })}
              </p>
              <p className="mt-1 text-center text-4xl font-extrabold leading-none text-green-700 dark:text-green-400">
                {formatBalance(projectedTotal, locale)}
              </p>
              <p className="mt-1.5 text-center text-xs font-medium text-green-600 dark:text-green-500">
                {t('enrollment.contribution_page.per_mo', {
                  amount: `$${monthlyRetirementIncome.toLocaleString(locale)}`,
                })}
              </p>
            </div>

            <div className="h-56 rounded-xl border border-blue-100/50 bg-gradient-to-br from-blue-50/30 to-transparent p-3 dark:border-blue-900/20 dark:from-blue-950/10 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-blue)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-blue)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id={`${gradientId}-market`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-green)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--chart-green)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--chart-grid)' }} interval={4} dy={5} />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1_000)}K`)}
                    dx={-5}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const v = Number(value)
                      if (name === 'value')
                        return [`$${v.toLocaleString(locale)}`, t('enrollment.contribution_page.chart_total')]
                      if (name === 'contributions')
                        return [`$${v.toLocaleString(locale)}`, t('enrollment.contribution_page.chart_contrib')]
                      return [value, name]
                    }}
                    contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid var(--border-default)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  {/* Two lines: Total savings and the viewer's own contributions.
                      Market Gains is just the gap between them, so it added noise
                      as a third series. The Target reference line is gone too —
                      there is no target set at this step. */}
                  <Area type="monotone" dataKey="contributions" stroke="var(--text-muted)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="value" stroke="var(--chart-blue)" fill={`url(#${gradientId})`} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full brand-bg" />
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('enrollment.contribution_page.chart_total')}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-3 border-t-2 border-dashed border-slate-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('enrollment.contribution_page.chart_contrib')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-600">
                {t('enrollment.contribution_page.disclaimer', { rate: growthPct })}
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  {t('enrollment.contribution_page.compare_title')}
                </p>
                <button
                  type="button"
                  onClick={() => setCompareMode(!compareMode)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    compareMode
                      ? 'brand-bg text-white shadow-md'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {compareMode ? t('enrollment.contribution_page.hide') : t('enrollment.contribution_page.show')}
                </button>
              </div>
              {compareMode && (
                <div className="space-y-3 border-t border-gray-200 pt-2 dark:border-gray-700">
                  <div className="flex gap-2">
                    {[10, 12, 15].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setComparePercent(val)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                          comparePercent === val
                            ? 'brand-bg text-white shadow-md'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      difference < 0
                        ? 'border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/30'
                        : 'border border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-950/30'
                    }`}
                  >
                    <p
                      className={`text-sm font-bold ${difference < 0 ? 'text-red-800 dark:text-red-400' : 'text-green-800 dark:text-green-400'}`}
                    >
                      {difference >= 0 ? '+' : ''}${Math.abs(difference).toLocaleString(locale)}
                    </p>
                    <p
                      className={`text-xs ${difference < 0 ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'}`}
                    >
                      {difference >= 0 ? t('enrollment.contribution_page.more_suffix') : t('enrollment.contribution_page.less_suffix')}{' '}
                      {t('enrollment.contribution_page.compare_vs', { compare: comparePercent, current: percent })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
