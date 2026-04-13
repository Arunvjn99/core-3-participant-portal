import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { Check, Sparkles, ArrowRight, MessageCircle, Info, Landmark, HelpCircle } from 'lucide-react'

export default function PlanSelection() {
  const navigate = useNavigate()
  const { data, updateData } = useEnrollment()
  const [showAI, setShowAI] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'traditional' | 'roth' | null>(data.plan)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    setSelectedPlan(data.plan)
  }, [data.plan])

  const confirmPlan = (plan: 'traditional' | 'roth') => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- confirm navigation debugging
      console.log('[PlanSelection] confirmPlan called with:', plan)
    }
    setSelectedPlan(plan)
    updateData({ plan })
    navigate('/enrollment/contribution')
  }

  const hasTwoPlans = data.companyPlans.length >= 2

  if (!hasTwoPlans) {
    const onlyPlan = data.companyPlans[0] || 'traditional'
    const planLabel = onlyPlan === 'traditional' ? 'Traditional 401(k)' : 'Roth 401(k)'
    return (
      <AnimatedPage>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/40">
              <Landmark className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your employer offers a {planLabel} retirement plan</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {onlyPlan === 'traditional'
                  ? 'This plan allows tax-deferred retirement savings. Your contributions reduce your taxable income today.'
                  : 'This plan allows you to contribute after-tax dollars and withdraw tax-free in retirement.'}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3 dark:border-green-900/40 dark:bg-green-950/30">
              <Info className="h-4 w-4 shrink-0 text-green-600" />
              <p className="text-left text-xs text-green-700 dark:text-green-400">Your employer matches contributions up to 6%.</p>
            </div>
            <button
              type="button"
              onClick={() => confirmPlan(onlyPlan)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              Continue to Contributions <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-gray-400">You can change this plan later from your account settings.</p>
          </div>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Choose Your Retirement Plan</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">Select the retirement plan that fits your tax strategy.</p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800">
          <Info className="h-4 w-4 shrink-0 text-gray-400" />
          <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
            Your employer matches contributions up to <strong className="text-gray-800 dark:text-gray-200">6%</strong> of your salary —
            that&apos;s free money toward your retirement.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelectedPlan('traditional')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedPlan('traditional')
            }}
            className={cn(
              'flex cursor-pointer flex-col rounded-2xl p-5 text-left transition-all sm:p-6',
              'bg-white border border-gray-200 shadow-sm',
              'dark:bg-gray-800 dark:border-gray-600',
              'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600',
              selectedPlan === 'traditional' && [
                'border-2 border-blue-500 bg-blue-50/60',
                'dark:bg-blue-950/40 dark:border-blue-400',
                'shadow-md ring-2 ring-blue-100 dark:ring-blue-900/50',
              ]
            )}
          >
            <div className="relative mb-1">
              <span
                className="inline-flex cursor-default items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                Most Common Choice
                <HelpCircle className="h-3 w-3 opacity-70" />
              </span>
              {showTooltip && (
                <div className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                  Chosen by most employees because it reduces taxable income today.
                  <div className="absolute left-6 top-0 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900" />
                </div>
              )}
            </div>

            <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">Traditional 401(k)</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Lower taxes today and grow savings tax-deferred.
            </p>

            <ul className="mt-4 flex-1 space-y-3">
              {['Lower taxable income today', 'Employer match eligible', 'Tax-deferred growth'].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {b}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                confirmPlan('traditional')
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] sm:text-base"
            >
              Continue with Traditional 401(k) <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelectedPlan('roth')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedPlan('roth')
            }}
            className={cn(
              'flex cursor-pointer flex-col rounded-2xl p-5 text-left transition-all sm:p-6',
              'bg-white border border-gray-200 shadow-sm',
              'dark:bg-gray-800 dark:border-gray-600',
              'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600',
              selectedPlan === 'roth' && [
                'border-2 border-blue-500 bg-blue-50/60',
                'dark:bg-blue-950/40 dark:border-blue-400',
                'shadow-md ring-2 ring-blue-100 dark:ring-blue-900/50',
              ]
            )}
          >
            <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">Roth 401(k)</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Pay taxes now and withdraw tax-free in retirement.
            </p>

            <ul className="mt-4 flex-1 space-y-3">
              {['Tax-free withdrawals in retirement', 'Flexible retirement income', 'No required minimum distributions'].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {b}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                confirmPlan('roth')
              }}
              className={cn(
                'mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] sm:text-base',
                selectedPlan === 'roth'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-blue-600 bg-white text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-blue-950/30'
              )}
            >
              Choose Roth 401(k) <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">You can change this plan later from your account settings.</p>

        <div className="border-t border-gray-100 dark:border-gray-800" />

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-600 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:text-base">Not sure which plan is right for you?</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Our AI assistant can help explain the differences.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAI(!showAI)
                setShowCompare(false)
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                showAI
                  ? 'bg-purple-200 text-purple-800 dark:bg-purple-800/50 dark:text-purple-200'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/40'
              )}
            >
              <Sparkles className="h-4 w-4" /> Ask AI
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCompare(!showCompare)
                setShowAI(false)
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                showCompare
                  ? 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <MessageCircle className="h-4 w-4" /> Compare Plans
            </button>
          </div>

          {showAI && (
            <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/30">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                <div className="text-sm">
                  <p className="font-semibold text-purple-800 dark:text-purple-300">AI Recommendation</p>
                  <p className="mt-1 leading-relaxed text-purple-700 dark:text-purple-400">
                    <strong>Traditional 401(k)</strong> is ideal if you expect to be in a lower tax bracket in retirement — your
                    contributions reduce your taxable income now. <strong>Roth 401(k)</strong> is better if you expect higher income
                    later — you pay taxes now but withdraw tax-free. Most employees benefit from the Traditional plan due to the
                    immediate tax savings and employer match.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showCompare && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[400px] w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Feature</th>
                    <th className="py-2 text-left font-semibold text-gray-900 dark:text-white">Traditional</th>
                    <th className="py-2 text-left font-semibold text-gray-900 dark:text-white">Roth</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  {[
                    ['Contributions', 'Pre-tax', 'After-tax'],
                    ['Withdrawals', 'Taxed', 'Tax-free'],
                    ['Tax benefit', 'Now', 'In retirement'],
                    ['RMDs', 'Required', 'None'],
                    ['Best for', 'Higher tax bracket now', 'Higher tax bracket later'],
                  ].map(([feature, trad, roth]) => (
                    <tr key={String(feature)} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 text-gray-500 dark:text-gray-400">{feature}</td>
                      <td className="py-2">{trad}</td>
                      <td className="py-2">{roth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  )
}
