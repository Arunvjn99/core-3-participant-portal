import { useState, useId, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useEnrollmentStepNav } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { Info, Lightbulb, Minus, Plus, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BODY_TEXT, Card, CARD_TITLE, HEADING, MUTED_TEXT, ROUND_BUTTON, RULE, SECTION_LABEL, StepHeader, TitleBadge, chip } from '@/features/enrollment/enrollmentUi'
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
      <div className="space-y-5">
        <StepHeader title={t('enrollment.contribution_page.title')} subtitle={t('enrollment.contribution_page.subtitle')} />

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Sections spread to the full card height so it lines up with the projection card */}
          <Card className="flex flex-col justify-between gap-5">
            <div className={cn('flex items-baseline justify-between gap-3 border-b pb-4', RULE)}>
              <p className={SECTION_LABEL}>{t('enrollment.contribution_page.monthly_paycheck')}</p>
              <p className={cn('text-xl font-bold tabular-nums', HEADING)}>${monthlyPaycheck.toLocaleString(locale)}</p>
            </div>

            <div className="text-center">
              <p className={cn('mb-3', SECTION_LABEL)}>{t('enrollment.contribution_page.your_contribution')}</p>
              <div className="flex items-center justify-center gap-4">
                <button type="button" onClick={() => adjustPercent(-1)} className={ROUND_BUTTON} aria-label={t('enrollment.contribution_page.decrease')}>
                  <Minus className="h-4 w-4" />
                </button>
                <p className="min-w-[120px] text-6xl font-extrabold leading-none tracking-tight text-primary tabular-nums dark:text-blue-300">{percent}%</p>
                <button type="button" onClick={() => adjustPercent(1)} className={ROUND_BUTTON} aria-label={t('enrollment.contribution_page.increase')}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* One dollar figure, monthly like the paycheck above */}
              <p className={cn('mt-3 text-sm', MUTED_TEXT)}>
                <span className={cn('font-bold', HEADING)}>${monthlyContribution.toLocaleString(locale)}</span> {t('enrollment.contribution_page.per_month_from_pay')}
              </p>
            </div>

            {/* What the employer adds, and how to get the rest when below the match */}
            <div className="text-center">
              <p className="inline-flex items-center rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20">
                {t('enrollment.contribution_page.match_simple', { amount: `$${employerAnnual.toLocaleString(locale)}` })}
              </p>
              {belowMatch && (
                <p className={cn('mt-1.5 text-xs', MUTED_TEXT)}>
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
            <div className={cn('border-t pt-4', RULE)}>
              <p id={taxLabelId} className={cn('mb-2', SECTION_LABEL)}>
                {t('enrollment.contribution_page.tax_label')}
              </p>
              <div role="radiogroup" aria-labelledby={taxLabelId} className="grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1 dark:bg-white/5">
                {taxOptions.map((opt) => {
                  const selected = taxMode === opt.mode
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => handleTaxMode(opt.mode)}
                      className={cn(
                        'rounded-full px-2 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70',
                        selected
                          ? 'bg-white text-[#0B1533] shadow-[0_6px_14px_-8px_rgba(11,21,51,0.4)] ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-white/15'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>

              {/* What the selected option means for you, in plain words */}
              <div aria-live="polite" className="mt-3">
                <p className={cn('text-sm font-bold', HEADING)}>{t(`enrollment.contribution_page.tax_${taxKey}_title`)}</p>
                <p className={cn('mt-0.5 text-xs leading-relaxed', BODY_TEXT)}>{t(`enrollment.contribution_page.tax_${taxKey}_body`, { pre: sources.preTax, roth: sources.roth })}</p>
              </div>
            </div>

            <div>
              <p className={cn('mb-2', SECTION_LABEL)}>{t('enrollment.contribution_page.quick_select')}</p>
              <div className="flex flex-wrap gap-2">
                {quickOptions.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => handleQuick(opt.value)} aria-pressed={percent === opt.value} className={chip(percent === opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Pro tip under the quick picks while the rate is below the full match, to nudge it up */}
              {percent < FULL_MATCH_PCT && matchGapAnnual > 0 && (
                <div className="mt-3 rounded-2xl bg-amber-50/80 p-3.5 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-400/20">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                    {t('enrollment.contribution_page.pro_tip')}
                  </p>
                  <p className={cn('mt-1.5 text-[13px] leading-[1.5]', BODY_TEXT)}>
                    {t('enrollment.contribution_page.pro_tip_body', { matchPct: FULL_MATCH_PCT, amount: `$${matchGapAnnual.toLocaleString(locale)}` })}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleQuick(FULL_MATCH_PCT)}
                    className="mt-2.5 inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[13px] font-semibold text-slate-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-900 dark:text-white dark:ring-amber-400/30 dark:hover:bg-slate-800"
                  >
                    {t('enrollment.contribution_page.pro_tip_cta', { pct: FULL_MATCH_PCT })}
                  </button>
                </div>
              )}
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <TitleBadge Icon={TrendingUp} />
              <div className="min-w-0">
                <h2 className={CARD_TITLE}>{t('enrollment.contribution_page.projection_title')}</h2>
                <p className={cn('mt-1 text-xs', MUTED_TEXT)}>{t('enrollment.contribution_page.projection_sub', { age: personalization.retirementAge, rate: growthPct })}</p>
              </div>
            </div>

            <div>
              <p className={SECTION_LABEL}>{t('enrollment.contribution_page.projected_age', { age: personalization.retirementAge })}</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className={cn('text-4xl font-extrabold leading-none tabular-nums', HEADING)}>{formatBalance(projectedTotal, locale)}</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {t('enrollment.contribution_page.per_mo', { amount: `$${monthlyRetirementIncome.toLocaleString(locale)}` })}
                </p>
              </div>
            </div>

            <div className="h-56">
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

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-blue)]" aria-hidden />
                <p className={cn('text-xs', MUTED_TEXT)}>{t('enrollment.contribution_page.chart_total')}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 border-t-2 border-dashed border-slate-400" aria-hidden />
                <p className={cn('text-xs', MUTED_TEXT)}>{t('enrollment.contribution_page.chart_contrib')}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className={cn('text-xs leading-relaxed', MUTED_TEXT)}>{t('enrollment.contribution_page.disclaimer', { rate: growthPct })}</p>
            </div>

            <div className={cn('mt-auto space-y-3 border-t pt-4', RULE)}>
              <div className="flex items-center justify-between gap-3">
                <p className={SECTION_LABEL}>{t('enrollment.contribution_page.compare_title')}</p>
                <button type="button" onClick={() => setCompareMode(!compareMode)} aria-expanded={compareMode} className={chip(compareMode)}>
                  {compareMode ? t('enrollment.contribution_page.hide') : t('enrollment.contribution_page.show')}
                </button>
              </div>
              {compareMode && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {[10, 12, 15].map((val) => (
                      <button key={val} type="button" onClick={() => setComparePercent(val)} aria-pressed={comparePercent === val} className={chip(comparePercent === val)}>
                        {val}%
                      </button>
                    ))}
                  </div>
                  <p className="text-right">
                    <span className={cn('block text-lg font-bold tabular-nums', difference < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                      {difference >= 0 ? '+' : '−'}${Math.abs(difference).toLocaleString(locale)}
                    </span>
                    <span className={cn('block text-xs', MUTED_TEXT)}>
                      {difference >= 0 ? t('enrollment.contribution_page.more_suffix') : t('enrollment.contribution_page.less_suffix')}{' '}
                      {t('enrollment.contribution_page.compare_vs', { compare: comparePercent, current: percent })}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AnimatedPage>
  )
}
