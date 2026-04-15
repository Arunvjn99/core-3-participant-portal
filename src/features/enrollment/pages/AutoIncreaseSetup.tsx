import { useState, useMemo, useId, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentStepNav } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { TrendingUp, Calendar, Target, DollarSign, Info } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type IncrementCycle = 'calendar' | 'participant' | 'plan'

export default function AutoIncreaseSetup() {
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization } = useEnrollment()

  const [increaseAmount, setIncreaseAmount] = useState(data.autoIncreaseAmount)
  const [maxContribution, setMaxContribution] = useState(Math.min(data.autoIncreaseMax, 15))
  const [incrementCycle, setIncrementCycle] = useState<IncrementCycle>('calendar')

  const currentPercent = data.contributionPercent
  const salary = data.salary
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

  const yearByYearData = useMemo(() => {
    if (increaseAmount === 0 || currentPercent >= maxContribution) return []
    const rows: { year: number; percent: number; annual: number; date: string }[] = []
    let pct = currentPercent
    let yr = 0
    const getNextDate = (yearOffset: number) => {
      const today = new Date()
      if (incrementCycle === 'calendar') return new Date(today.getFullYear() + yearOffset, 0, 1)
      if (incrementCycle === 'plan') return new Date(today.getFullYear() + yearOffset, 3, 1)
      return new Date(today.getFullYear() + yearOffset, 7, 15)
    }
    while (pct < maxContribution && yr <= yearsToMax) {
      const annual = Math.round((salary * pct) / 100)
      rows.push({
        year: yr,
        percent: Math.round(pct * 10) / 10,
        annual,
        date: getNextDate(yr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      })
      if (pct < maxContribution) pct = Math.min(pct + increaseAmount, maxContribution)
      yr++
    }
    return rows
  }, [currentPercent, increaseAmount, maxContribution, salary, yearsToMax, incrementCycle])

  const financialImpact = useMemo(() => {
    const yearsToRetirement = personalization.retirementAge - personalization.currentAge
    const growthRates: Record<string, number> = { conservative: 0.045, balanced: 0.068, growth: 0.082, aggressive: 0.095 }
    const growthRate = growthRates[data.riskLevel] || 0.068
    let balanceFixed = personalization.currentSavings
    for (let y = 0; y < yearsToRetirement; y++) {
      balanceFixed =
        (balanceFixed + (currentPercent / 100) * salary + (Math.min(currentPercent, 6) / 100) * salary) * (1 + growthRate)
    }
    let balanceAuto = personalization.currentSavings
    let autoPct = currentPercent
    for (let y = 0; y < yearsToRetirement; y++) {
      balanceAuto =
        (balanceAuto + (autoPct / 100) * salary + (Math.min(autoPct, 6) / 100) * salary) * (1 + growthRate)
      autoPct = Math.min(autoPct + increaseAmount, maxContribution)
    }
    return { withoutIncrease: balanceFixed, withIncrease: balanceAuto, difference: balanceAuto - balanceFixed }
  }, [currentPercent, increaseAmount, maxContribution, salary, data.riskLevel, personalization])

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
    if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString()}K`
    return `$${Math.round(val).toLocaleString()}`
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
      primaryLabel: 'Next',
      nextDisabled: increaseAmount === 0,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, handleSave, increaseAmount])

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
      return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>
            {label === 0 ? 'Today' : `Year ${label}`}
          </p>
          <p className="tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {payload[0].value}% of salary
          </p>
        </div>
      )
    }
    return null
  }

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
              <h1 className="text-gray-900 dark:text-white">Configure your automatic increases</h1>
            </div>
            <p className="mt-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>
              Your contribution will gradually increase over time.
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-950/30">
            <div className="flex items-start gap-6">
              <div>
                <p
                  className="mb-0.5 text-blue-700 dark:text-blue-400"
                  style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Current
                </p>
                <p className="text-blue-900 dark:text-blue-300" style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                  {currentPercent}%
                </p>
                <p className="mt-1 text-blue-700 dark:text-blue-400" style={{ fontSize: '0.7rem' }}>
                  ${currentMonthlyContribution.toLocaleString()}/mo
                </p>
              </div>
              <div className="border-l border-blue-300 pl-6 dark:border-blue-700">
                <p
                  className="mb-0.5 text-blue-600 dark:text-blue-400"
                  style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Target Max
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
                Increment Cycle
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { value: 'calendar' as const, label: 'Calendar Year', sub: 'Every Jan 1st' },
                    { value: 'participant' as const, label: 'Participant Date', sub: 'On enrolment date' },
                    { value: 'plan' as const, label: 'Plan Year', sub: 'Every April 1' },
                  ] as const
                ).map((opt) => (
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
                        {opt.label}
                      </p>
                    </div>
                    <p className="ml-6 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>
                      {opt.sub}
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
                    How much do you want to increase per cycle?
                  </label>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-600" style={{ fontSize: '0.65rem' }}>
                        0%
                      </span>
                      <span className="tabular-nums text-blue-600 dark:text-blue-400" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        {increaseAmount}% per cycle
                      </span>
                      <span className="text-gray-400 dark:text-gray-600" style={{ fontSize: '0.65rem' }}>
                        3%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.5}
                      value={increaseAmount}
                      onChange={(e) => setIncreaseAmount(parseFloat(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full"
                      style={{
                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(increaseAmount / 3) * 100}%, #e5e7eb ${(increaseAmount / 3) * 100}%, #e5e7eb 100%)`,
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
                    Stop increasing when contributions reach
                  </label>
                  <p className="mt-0.5 text-gray-400 dark:text-gray-500" style={{ fontSize: '0.78rem' }}>
                    Your contribution rate will not exceed this percentage.
                  </p>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-600" style={{ fontSize: '0.7rem' }}>
                        10%
                      </span>
                      <span className="tabular-nums text-purple-600 dark:text-purple-400" style={{ fontSize: '1rem', fontWeight: 700 }}>
                        {maxContribution}%
                      </span>
                      <span className="text-gray-400 dark:text-gray-600" style={{ fontSize: '0.7rem' }}>
                        15%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={15}
                      step={1}
                      value={maxContribution}
                      onChange={(e) => setMaxContribution(parseInt(e.target.value, 10))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full"
                      style={{
                        background: `linear-gradient(to right, #9333ea 0%, #9333ea ${((maxContribution - 10) / 5) * 100}%, #e5e7eb ${((maxContribution - 10) / 5) * 100}%, #e5e7eb 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 px-1">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.78rem' }}>
                Automatic increases apply once per year on your enrolment anniversary. You can change or disable automatic increases at any time.
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
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 20]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="percent"
                      stroke="#10b981"
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
                  {currentPercent >= maxContribution ? (
                    <>Your contribution rate is already at or above your selected maximum.</>
                  ) : increaseAmount === 0 ? (
                    <>Select an increase amount to see your contribution growth path.</>
                  ) : (
                    <>
                      Your contribution will grow from{' '}
                      <span className="text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>
                        {currentPercent}%
                      </span>{' '}
                      to{' '}
                      <span className="text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>
                        {maxContribution}%
                      </span>{' '}
                      over approximately{' '}
                      <span className="text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>
                        {yearsToMax} {yearsToMax === 1 ? 'year' : 'years'}
                      </span>
                      .
                    </>
                  )}
                </p>
              </div>

              {increaseAmount > 0 && financialImpact.difference > 0 && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-800" />
                  <div className="space-y-3 px-5 py-4">
                    <p className="text-gray-900 dark:text-white" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Savings Impact
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-xl bg-gray-50 px-3 py-3 text-center dark:bg-gray-800">
                        <p
                          className="mb-0.5 text-gray-400 dark:text-gray-500"
                          style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                        >
                          Without
                        </p>
                        <p className="tabular-nums text-gray-600 dark:text-gray-400" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                          {formatCurrency(financialImpact.withoutIncrease)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-center dark:border-green-800/40 dark:bg-green-950/30">
                        <p
                          className="mb-0.5 text-green-700 dark:text-green-400"
                          style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                        >
                          With increases
                        </p>
                        <p className="tabular-nums text-green-700 dark:text-green-400" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                          {formatCurrency(financialImpact.withIncrease)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-3.5 py-2.5 dark:border-green-900/40 dark:bg-green-950/30">
                      <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <p className="text-green-800 dark:text-green-400" style={{ fontSize: '0.78rem' }}>
                        Could add approximately <span style={{ fontWeight: 700 }}>{formatCurrency(financialImpact.difference)}</span> more to your retirement savings.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {yearByYearData.length > 0 && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-800" />
                  <div className="px-4 py-3">
                    <h3 className="mb-3 text-gray-900 dark:text-white" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      Growth Timeline
                    </h3>
                    <div className="-mx-4 overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            {['Year', 'Date', '%', 'Annual'].map((h, i) => (
                              <th
                                key={h}
                                className={`px-3 py-1.5 text-gray-600 dark:text-gray-400 ${i === 3 ? 'text-right' : 'text-left'}`}
                                style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {yearByYearData.map((row, idx) => (
                            <tr
                              key={idx}
                              className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${row.percent === maxContribution ? 'bg-purple-50 dark:bg-purple-950/20' : ''}`}
                            >
                              <td className="px-3 py-1.5 text-gray-900 dark:text-white" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                {row.year === 0 ? 'Now' : `Y${row.year}`}
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
                                      MAX
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                ${(row.annual / 1000).toFixed(0)}K
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.7rem' }}>
                        <span className="font-semibold text-gray-900 dark:text-white">Timeline:</span> {currentPercent}% → {maxContribution}% over {yearsToMax}{' '}
                        {yearsToMax === 1 ? 'yr' : 'yrs'}
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
