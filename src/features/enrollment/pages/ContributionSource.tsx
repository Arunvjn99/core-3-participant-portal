import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentStepNav } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import {
  Lightbulb,
  Wallet,
  Sparkles,
  TrendingUp,
  Shield,
  DollarSign,
  Check,
  ChevronDown,
  ChevronUp,
  PieChart,
} from 'lucide-react'

export default function ContributionSource() {
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, advanceStep } = useEnrollment()
  const [showAdvanced, setShowAdvanced] = useState(data.contributionSources.afterTax > 0)
  const [canEditTaxAllocation, setCanEditTaxAllocation] = useState(false)

  const sources = data.contributionSources
  const salary = data.salary
  const percent = data.contributionPercent
  const monthlyTotal = Math.round((salary * percent) / 100 / 12)
  const matchPercent = Math.min(percent, 6)
  const monthlyMatch = Math.round((salary * matchPercent) / 100 / 12)
  const monthlyPreTax = Math.round(monthlyTotal * sources.preTax / 100)
  const monthlyRoth = Math.round(monthlyTotal * sources.roth / 100)
  const monthlyAfterTax = Math.round(monthlyTotal * sources.afterTax / 100)
  const totalMonthlyInvestment = monthlyTotal + monthlyMatch

  const planDefault = { preTax: 60, roth: 40, afterTax: 0 }
  const planDefaultPreTax = Math.round(monthlyTotal * planDefault.preTax / 100)
  const planDefaultRoth = Math.round(monthlyTotal * planDefault.roth / 100)
  const recommended = { preTax: 40, roth: 60, afterTax: 0 }

  const handlePreTaxChange = (value: number) => {
    const newPreTax = Math.min(100, Math.max(0, value))
    const remaining = 100 - newPreTax
    const total = sources.roth + sources.afterTax
    if (total > 0) {
      updateData({
        contributionSources: {
          preTax: newPreTax,
          roth: Math.round((remaining * sources.roth) / total),
          afterTax: Math.round((remaining * sources.afterTax) / total),
        },
      })
    } else {
      updateData({ contributionSources: { preTax: newPreTax, roth: remaining, afterTax: 0 } })
    }
  }

  const handleRothChange = (value: number) => {
    const newRoth = Math.min(100, Math.max(0, value))
    const remaining = 100 - newRoth
    const total = sources.preTax + sources.afterTax
    if (total > 0) {
      updateData({
        contributionSources: {
          preTax: Math.round((remaining * sources.preTax) / total),
          roth: newRoth,
          afterTax: Math.round((remaining * sources.afterTax) / total),
        },
      })
    } else {
      updateData({ contributionSources: { preTax: remaining, roth: newRoth, afterTax: 0 } })
    }
  }

  const handleAfterTaxChange = (value: number) => {
    const newAfterTax = Math.min(100, Math.max(0, value))
    const remaining = 100 - newAfterTax
    const total = sources.preTax + sources.roth
    if (total > 0) {
      updateData({
        contributionSources: {
          preTax: Math.round((remaining * sources.preTax) / total),
          roth: Math.round((remaining * sources.roth) / total),
          afterTax: newAfterTax,
        },
      })
    } else {
      updateData({ contributionSources: { preTax: remaining, roth: 0, afterTax: newAfterTax } })
    }
  }

  const total = sources.preTax + sources.roth + sources.afterTax

  useEffect(() => {
    setStepNav({
      showBack: true,
      onBack: () => navigate('/enrollment/contribution'),
      onNext: () => {
        advanceStep(
          {
            preTax: sources.preTax,
            roth: sources.roth,
            afterTax: sources.afterTax,
          },
          'source'
        )
        navigate('/enrollment/auto-increase')
      },
      primaryLabel: 'Next',
      nextDisabled: total !== 100,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, advanceStep, sources.preTax, sources.roth, sources.afterTax, total])

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">How do you want to pay taxes?</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">Choose when you want to pay taxes on your savings.</p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-3 dark:border-blue-800/40 dark:from-blue-950/30 dark:to-blue-900/20">
            <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
              You&apos;re contributing {percent}% (${monthlyTotal.toLocaleString()}/month)
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex w-full flex-col space-y-4 rounded-2xl border border-gray-200 bg-white p-5 opacity-90 dark:border-gray-700 dark:bg-gray-900 lg:w-[35%]">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-md bg-gray-100 px-2.5 py-1 dark:bg-gray-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Default</p>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Plan Default</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Applied if no changes are made</p>
            </div>

            <div className="flex h-2.5 overflow-hidden rounded-full">
              {planDefault.preTax > 0 && <div className="brand-bg" style={{ width: `${planDefault.preTax}%` }} />}
              {planDefault.roth > 0 && <div className="bg-purple-600" style={{ width: `${planDefault.roth}%` }} />}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="brand-bg h-2 w-2 rounded-full" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">Pre-Tax ({planDefault.preTax}%)</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">${planDefaultPreTax.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-600" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">Roth ({planDefault.roth}%)</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">${planDefaultRoth.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex flex-1 items-end border-t border-gray-100 pt-3 dark:border-gray-800">
              <p className="w-full text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Your employer&apos;s default allocation balances tax benefits.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                updateData({
                  contributionSources: { preTax: planDefault.preTax, roth: planDefault.roth, afterTax: planDefault.afterTax },
                })
                advanceStep(
                  {
                    preTax: planDefault.preTax,
                    roth: planDefault.roth,
                    afterTax: planDefault.afterTax,
                  },
                  'source'
                )
                navigate('/enrollment/auto-increase')
              }}
              className="btn-brand w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-md"
            >
              Select Plan Default
            </button>
          </div>

          <div className="flex w-full flex-col gap-5 rounded-2xl border-2 border-blue-100 bg-white p-5 shadow-lg dark:border-blue-900/40 dark:bg-gray-900 sm:flex-row sm:p-6 lg:w-[65%]">
            <div className="flex min-w-0 flex-1 flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Tax Strategy</h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Total allocation: 100%</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 dark:border-blue-800/40 dark:bg-blue-950/30">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Customize</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex h-4 overflow-hidden rounded-full border border-gray-200 shadow-sm dark:border-gray-700">
                  {sources.preTax > 0 && (
                    <div className="brand-bg transition-all duration-300" style={{ width: `${sources.preTax}%` }} />
                  )}
                  {sources.roth > 0 && (
                    <div className="bg-purple-600 transition-all duration-300" style={{ width: `${sources.roth}%` }} />
                  )}
                  {sources.afterTax > 0 && (
                    <div className="bg-orange-600 transition-all duration-300" style={{ width: `${sources.afterTax}%` }} />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="brand-bg h-2 w-2 rounded-full" />
                    <span className="text-gray-500 dark:text-gray-400">{sources.preTax}% Pre-Tax</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-purple-600" />
                    <span className="text-gray-500 dark:text-gray-400">{sources.roth}% Roth</span>
                  </div>
                  {sources.afterTax > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-orange-600" />
                      <span className="text-gray-500 dark:text-gray-400">{sources.afterTax}% After-Tax</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  'space-y-4 transition-opacity',
                  !canEditTaxAllocation && 'opacity-[0.85]',
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="brand-bg h-3 w-3 rounded-full" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Pre-Tax</p>
                      </div>
                      <p className="ml-5 text-xs text-gray-500 dark:text-gray-400">Lower taxes today</p>
                    </div>
                    <p className="text-xl font-extrabold text-blue-700 dark:text-blue-400">{sources.preTax}%</p>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sources.preTax}
                    disabled={!canEditTaxAllocation}
                    onChange={(e) => handlePreTaxChange(Number(e.target.value))}
                    className={cn(
                      'h-2 w-full appearance-none rounded-full',
                      canEditTaxAllocation ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sources.preTax}%, #e5e7eb ${sources.preTax}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">${monthlyPreTax.toLocaleString()}/mo</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-600" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Roth</p>
                      </div>
                      <p className="ml-5 text-xs text-gray-500 dark:text-gray-400">Tax-free withdrawals later</p>
                    </div>
                    <p className="text-xl font-extrabold text-purple-700 dark:text-purple-400">{sources.roth}%</p>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sources.roth}
                    disabled={!canEditTaxAllocation}
                    onChange={(e) => handleRothChange(Number(e.target.value))}
                    className={cn(
                      'h-2 w-full appearance-none rounded-full',
                      canEditTaxAllocation ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                    style={{
                      background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${sources.roth}%, #e5e7eb ${sources.roth}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">${monthlyRoth.toLocaleString()}/mo</span>
                    <span>100%</span>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 dark:border-orange-800/40 dark:bg-orange-950/30">
                        <p className="text-xs font-bold uppercase text-orange-700 dark:text-orange-400">Advanced</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-orange-600" />
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">After-Tax</p>
                        </div>
                        <p className="ml-5 text-xs text-gray-500 dark:text-gray-400">For advanced strategies (e.g., backdoor Roth)</p>
                      </div>
                      <p className="text-xl font-extrabold text-orange-700 dark:text-orange-400">{sources.afterTax}%</p>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sources.afterTax}
                      disabled={!canEditTaxAllocation}
                      onChange={(e) => handleAfterTaxChange(Number(e.target.value))}
                      className={cn(
                        'h-2 w-full appearance-none rounded-full',
                        canEditTaxAllocation ? 'cursor-pointer' : 'cursor-not-allowed',
                      )}
                      style={{
                        background: `linear-gradient(to right, #ea580c 0%, #ea580c ${sources.afterTax}%, #e5e7eb ${sources.afterTax}%, #e5e7eb 100%)`,
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>0%</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">${monthlyAfterTax.toLocaleString()}/mo</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>

              {!showAdvanced ? (
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="flex items-center gap-1.5 self-start text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <ChevronDown className="h-4 w-4" /> Show advanced options
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowAdvanced(false)
                    if (sources.afterTax > 0) {
                      updateData({
                        contributionSources: {
                          preTax: sources.preTax + sources.afterTax,
                          roth: sources.roth,
                          afterTax: 0,
                        },
                      })
                    }
                  }}
                  className="flex items-center gap-1.5 self-start text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <ChevronUp className="h-4 w-4" /> Hide advanced options
                </button>
              )}

              <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:border-blue-800/40 dark:from-blue-950/30 dark:to-purple-950/20">
                <div className="p-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Recommended for You</p>
                    </div>
                    <div className="rounded-lg bg-green-100 px-2 py-1 dark:bg-green-900/40">
                      <p className="text-xs font-extrabold text-green-700 dark:text-green-400">Score: 72</p>
                    </div>
                  </div>
                  <p className="mb-0 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                    {recommended.preTax}% Pre-Tax / {recommended.roth}% Roth — optimized for your profile
                  </p>
                  <div className="mt-2.5 flex items-start gap-2.5 border-t border-blue-200/70 pt-2.5 dark:border-blue-800/50">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-semibold leading-relaxed text-blue-900 dark:text-blue-300">
                      Roth may be better — tax-free income later
                    </p>
                  </div>
                </div>
              </div>

              {!canEditTaxAllocation ? (
                <button
                  type="button"
                  onClick={() => setCanEditTaxAllocation(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--brand-primary)] bg-white py-2.5 text-sm font-semibold text-[color:var(--brand-primary)] shadow-sm transition-all hover:bg-[color:var(--brand-primary-light)] active:scale-[0.99] dark:bg-gray-900 dark:hover:bg-[color:var(--brand-primary-light)]"
                >
                  <PieChart className="h-4 w-4 shrink-0" aria-hidden />
                  Customize Your Portfolio
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/enrollment/investment')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--brand-primary)] bg-white py-2.5 text-sm font-semibold text-[color:var(--brand-primary)] shadow-sm transition-all hover:bg-[color:var(--brand-primary-light)] active:scale-[0.99] dark:bg-gray-900 dark:hover:bg-[color:var(--brand-primary-light)]"
                >
                  <PieChart className="h-4 w-4 shrink-0" aria-hidden />
                  Choose your investments
                  <span aria-hidden className="text-base leading-none">
                    →
                  </span>
                </button>
              )}
            </div>

            <div className="flex w-full flex-col justify-between space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800 sm:w-[38%] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 lg:w-[30%]">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">Your monthly impact</h4>
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">You contribute:</p>
                  <p className="mb-3 text-xl font-extrabold text-gray-900 dark:text-white">${monthlyTotal.toLocaleString()}</p>
                  <div className="space-y-1.5 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
                    {[
                      { color: 'brand-bg', label: 'Pre-Tax', amount: monthlyPreTax },
                      { color: 'bg-purple-600', label: 'Roth', amount: monthlyRoth },
                    ].map(({ color, label, amount }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('h-1.5 w-1.5 rounded-full', color)} />
                          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        </div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">${amount.toLocaleString()}</p>
                      </div>
                    ))}
                    {monthlyAfterTax > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">After-Tax</p>
                        </div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">${monthlyAfterTax.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-3 dark:border-green-800/40 dark:from-green-950/30 dark:to-green-900/10">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">Employer match</p>
                  <p className="text-base font-extrabold text-green-700 dark:text-green-400">+${monthlyMatch.toLocaleString()}/month</p>
                  <p className="mt-1 text-xs text-green-600 dark:text-green-500">100% on first {matchPercent}%</p>
                </div>

                <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                  <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Total investment</p>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white">${totalMonthlyInvestment.toLocaleString()}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">per month</p>
                </div>
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 opacity-90">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Understanding the Difference</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                bg: 'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10',
                border: 'border-blue-200 dark:border-blue-800/40',
                icon: <TrendingUp className="h-4 w-4 text-white" />,
                iconBg: 'brand-bg',
                checkColor: 'text-blue-600',
                title: 'Pre-Tax',
                points: ['Lower taxes today', 'Reduces current taxable income', 'Pay taxes when you withdraw'],
              },
              {
                bg: 'from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10',
                border: 'border-purple-200 dark:border-purple-800/40',
                icon: <Shield className="h-4 w-4 text-white" />,
                iconBg: 'bg-purple-600',
                checkColor: 'text-purple-600',
                title: 'Roth',
                points: ['Tax-free withdrawals later', 'Pay taxes now at current rate', 'Growth is tax-free'],
              },
              {
                bg: 'from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/10',
                border: 'border-orange-200 dark:border-orange-800/40',
                icon: <DollarSign className="h-4 w-4 text-white" />,
                iconBg: 'bg-orange-600',
                checkColor: 'text-orange-600',
                title: 'After-Tax',
                points: ['For high earners', 'Mega backdoor Roth option', 'Advanced tax strategy'],
              },
            ].map(({ bg, border, icon, iconBg, checkColor, title, points }) => (
              <div key={title} className={cn('rounded-xl border bg-gradient-to-br p-4 sm:col-span-1', bg, border)}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>{icon}</div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <div className="space-y-1.5">
                  {points.map((point) => (
                    <div key={point} className="flex items-start gap-2">
                      <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', checkColor)} />
                      <p className="text-xs text-gray-700 dark:text-gray-300">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
