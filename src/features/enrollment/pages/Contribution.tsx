import { useState, useId, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useEnrollmentStepNav } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { Sparkles, Info, Minus, Plus } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

function generateProjectionData(percent: number, salary: number) {
  const annual = salary * (percent / 100)
  const matchPercent = Math.min(percent, 6)
  const matchAnnual = salary * (matchPercent / 100)
  const data: {
    year: string
    value: number
    contributions: number
    marketGain: number
  }[] = []
  let total = 0
  let contributions = 0
  for (let year = 0; year <= 30; year++) {
    const yearlyContribution = annual + matchAnnual
    contributions += yearlyContribution
    total = (total + yearlyContribution) * 1.07
    data.push({
      year: `${year}yr`,
      value: Math.round(total),
      contributions: Math.round(contributions),
      marketGain: Math.round(total - contributions),
    })
  }
  return data
}

export default function Contribution() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization, advanceStep } = useEnrollment()
  const locale = getAppDateLocale()
  const [compareMode, setCompareMode] = useState(false)
  const [comparePercent, setComparePercent] = useState(12)
  const [percentInput, setPercentInput] = useState(String(data.contributionPercent))
  const [dollarInput, setDollarInput] = useState(String(Math.round((data.salary * data.contributionPercent) / 100)))
  const gradientId = useId()
  const percent = data.contributionPercent
  const salary = data.salary

  useEffect(() => {
    setPercentInput(String(data.contributionPercent))
    setDollarInput(String(Math.round((data.salary * data.contributionPercent) / 100)))
  }, [data.contributionPercent, data.salary])

  const monthlyPaycheck = Math.round(salary / 12)
  const monthlyContribution = Math.round((salary * percent) / 100 / 12)
  const matchPercent = Math.min(percent, 6)
  const monthlyMatch = Math.round((salary * matchPercent) / 100 / 12)
  const projectionData = generateProjectionData(percent, salary)
  const projectedTotal = projectionData[projectionData.length - 1]?.value || 0
  const monthlyRetirementIncome = Math.round((projectedTotal * 0.04) / 12)
  const recommendedPercent = 12
  const progressPercentage = Math.min((percent / recommendedPercent) * 100, 100)
  const comparisonData = generateProjectionData(comparePercent, salary)
  const comparisonTotal = comparisonData[comparisonData.length - 1]?.value || 0
  const difference = comparisonTotal - projectedTotal
  const onePercentIncrease = generateProjectionData(percent + 1, salary)
  const onePercentImpact = (onePercentIncrease[onePercentIncrease.length - 1]?.value || 0) - projectedTotal

  const quickOptions = useMemo(
    () => [
      { label: t('enrollment.contribution_page.opt_4'), value: 4, icon: null as string | null },
      { label: t('enrollment.contribution_page.opt_6'), value: 6, icon: '✅' },
      { label: t('enrollment.contribution_page.opt_10'), value: 10, icon: null as string | null },
      { label: t('enrollment.contribution_page.opt_15'), value: 15, icon: '🚀' },
    ],
    [t],
  )

  const adjustPercent = (delta: number) => {
    const newValue = Math.max(1, Math.min(25, percent + delta))
    updateData({ contributionPercent: newValue })
    setPercentInput(String(newValue))
    setDollarInput(String(Math.round((salary * newValue) / 100)))
  }

  const handlePercentInput = (value: string) => {
    setPercentInput(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 1 && num <= 25) {
      updateData({ contributionPercent: Math.round(num) })
      setDollarInput(String(Math.round((salary * num) / 100)))
    }
  }

  const handleDollarInput = (value: string) => {
    setDollarInput(value)
    const num = parseFloat(value.replace(/,/g, ''))
    if (!isNaN(num) && salary > 0) {
      const calc = Math.round((num / salary) * 100)
      if (calc >= 1 && calc <= 25) {
        updateData({ contributionPercent: calc })
        setPercentInput(String(calc))
      }
    }
  }

  const handleQuick = (value: number) => {
    updateData({ contributionPercent: value })
    setPercentInput(String(value))
    setDollarInput(String(Math.round((salary * value) / 100)))
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
          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:p-6">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('enrollment.contribution_page.percentage')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={25}
                    step={0.5}
                    value={percentInput}
                    onChange={(e) => handlePercentInput(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('enrollment.contribution_page.annual_dollar')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">$</span>
                  <input
                    type="text"
                    value={dollarInput}
                    onChange={(e) => handleDollarInput(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-7 pr-3 text-sm font-medium text-gray-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
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
                        : 'bg-gray-100 text-gray-600 hover:scale-105 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                    {opt.icon ? ` ${opt.icon}` : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-1">
              <input
                type="range"
                min={1}
                max={25}
                value={percent}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  updateData({ contributionPercent: v })
                  setPercentInput(String(v))
                  setDollarInput(String(Math.round((salary * v) / 100)))
                }}
                className="h-2.5 w-full cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, var(--chart-blue) 0%, var(--chart-blue) ${((percent - 1) / 24) * 100}%, var(--slider-track) ${((percent - 1) / 24) * 100}%, var(--slider-track) 100%)`,
                }}
              />
              <div className="mt-2 flex justify-between text-xs text-gray-400 dark:text-gray-600">
                <span>1%</span>
                <span>25%</span>
              </div>
            </div>

            <div className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-purple-100/30 p-3.5 dark:border-purple-800/40 dark:from-purple-950/30 dark:to-purple-900/10">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="mb-1 text-xs font-bold text-purple-900 dark:text-purple-300">
                    {t('enrollment.contribution_page.pro_tip')}
                  </p>
                  <p className="text-xs leading-relaxed text-purple-700 dark:text-purple-400">
                    {t('enrollment.contribution_page.pro_tip_body', {
                      amount: `$${onePercentImpact.toLocaleString(locale)}`,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('enrollment.contribution_page.projection_title')}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {t('enrollment.contribution_page.projection_sub')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  {t('enrollment.contribution_page.on_track', { pct: Math.round(progressPercentage) })}
                </p>
                <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-green-100 dark:bg-green-900/40">
                  <div className="h-full rounded-full bg-green-600 transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-green-200/50 bg-gradient-to-br from-green-50 to-green-100/30 p-4 dark:border-green-800/40 dark:from-green-950/30 dark:to-green-900/10">
                <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('enrollment.contribution_page.projected_age', { age: personalization.retirementAge })}
                </p>
                <p className="mt-1 text-center text-3xl font-extrabold leading-none text-green-700 dark:text-green-400">
                  ${(projectedTotal / 1000000).toFixed(1)}M
                </p>
                <p className="mt-1.5 text-center text-xs font-medium text-green-600 dark:text-green-500">
                  {t('enrollment.contribution_page.per_mo', {
                    amount: `$${monthlyRetirementIncome.toLocaleString(locale)}`,
                  })}
                </p>
              </div>
              <div className="space-y-2.5 rounded-xl border border-blue-100/50 bg-gradient-to-br from-blue-50/50 to-transparent p-4 dark:border-blue-900/30 dark:from-blue-950/20">
                <p className="text-center text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  {t('enrollment.contribution_page.monthly_impact')}
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                      {t('enrollment.contribution_page.you_contribute')}
                    </p>
                    <p className="mt-0.5 text-center text-base font-bold text-gray-900 dark:text-white">
                      ${monthlyContribution.toLocaleString(locale)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-200/50 bg-green-50 p-2 dark:border-green-800/40 dark:bg-green-950/30">
                    <p className="text-center text-xs font-semibold text-green-700 dark:text-green-400">
                      {t('enrollment.contribution_page.employer_adds')}
                    </p>
                    <p className="mt-0.5 text-center text-base font-bold text-green-700 dark:text-green-400">
                      +${monthlyMatch.toLocaleString(locale)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-56 rounded-xl border border-blue-100/50 bg-gradient-to-br from-blue-50/30 to-transparent p-3 dark:border-blue-900/20 dark:from-blue-950/10 sm:h-64">
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
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                    dx={-5}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const v = Number(value)
                      if (name === 'value')
                        return [`$${v.toLocaleString(locale)}`, t('enrollment.contribution_page.chart_total')]
                      if (name === 'contributions')
                        return [`$${v.toLocaleString(locale)}`, t('enrollment.contribution_page.chart_contrib')]
                      if (name === 'marketGain')
                        return [`$${v.toLocaleString(locale)}`, t('enrollment.contribution_page.chart_gains')]
                      return [value, name]
                    }}
                    contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid var(--border-default)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <ReferenceLine
                    y={projectedTotal * 0.75}
                    stroke="var(--chart-green)"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: t('enrollment.contribution_page.chart_target'),
                      position: 'insideTopRight',
                      fill: 'var(--chart-green)',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Area type="monotone" dataKey="contributions" stroke="var(--text-muted)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="marketGain" stroke="var(--chart-green)" fill={`url(#${gradientId}-market)`} strokeWidth={2} stackId="1" />
                  <Area type="monotone" dataKey="value" stroke="var(--chart-blue)" fill={`url(#${gradientId})`} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { color: 'brand-bg', label: t('enrollment.contribution_page.chart_total') },
                { color: 'bg-green-600', label: t('enrollment.contribution_page.chart_gains') },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`h-3 w-3 rounded-full ${color}`} />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              ))}
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
                {t('enrollment.contribution_page.disclaimer')}
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
