import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentStepNav } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { Check, Sparkles, ArrowRight, MessageCircle, Landmark, HelpCircle } from 'lucide-react'

export default function PlanSelection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData } = useEnrollment()
  const [showAI, setShowAI] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  /** Which plan card is highlighted; second action on that card continues. */
  const [selectedPlan, setSelectedPlan] = useState<'traditional' | 'roth' | null>(() => data.plan ?? null)
  /** After second "Select this Plan" tap — shows "Selected"; use header Next to continue. */
  const [confirmedPlan, setConfirmedPlan] = useState<'traditional' | 'roth' | null>(() => data.plan ?? null)

  const confirmPlan = (plan: 'traditional' | 'roth') => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- confirm navigation debugging
      console.log('[PlanSelection] confirmPlan called with:', plan)
    }
    updateData({ plan })
    navigate('/enrollment/contribution')
  }

  useEffect(() => {
    if (data.plan) {
      setSelectedPlan(data.plan)
      setConfirmedPlan(data.plan)
    }
  }, [data.plan])

  useEffect(() => {
    setStepNav({
      showBack: false,
      onNext: () => {
        if (!confirmedPlan) return
        updateData({ plan: confirmedPlan })
        navigate('/enrollment/contribution')
      },
      primaryLabel: 'Next',
      nextDisabled: !confirmedPlan,
    })
    return () => setStepNav(null)
  }, [confirmedPlan, navigate, setStepNav, updateData])

  const hasTwoPlans = data.companyPlans.length >= 2

  /** CTA before this plan is the active selection — neutral, no primary stroke */
  const neutralCtaClass =
    'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
  /** CTA once selected — solid blue */
  const selectedCtaClass =
    'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700'
  /** Selected card — subtle blue stroke + light wash */
  const selectedPlanCardClass =
    'border border-blue-300 bg-blue-50/70 shadow-sm ring-1 ring-blue-200/60 hover:shadow-md dark:border-blue-500/55 dark:bg-blue-950/30 dark:ring-blue-400/25'

  if (!hasTwoPlans) {
    const onlyPlan = data.companyPlans[0] || 'traditional'
    const planLabel =
      onlyPlan === 'traditional' ? t('enrollment.plan.traditional_title') : t('enrollment.plan.roth_title')
    return (
      <AnimatedPage>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/40">
              <Landmark className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('enrollment.plan.single_title', { plan: planLabel })}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {onlyPlan === 'traditional'
                  ? t('enrollment.plan.single_desc_traditional')
                  : t('enrollment.plan.single_desc_roth')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => confirmPlan(onlyPlan)}
              className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold active:scale-[0.98]"
            >
              {t('enrollment.plan.continue_contributions')} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </AnimatedPage>
    )
  }

  const traditionalBullets = [
    t('enrollment.plan.traditional_b1'),
    t('enrollment.plan.traditional_b2'),
    t('enrollment.plan.traditional_b3'),
  ]
  const rothBullets = [t('enrollment.plan.roth_b1'), t('enrollment.plan.roth_b2'), t('enrollment.plan.roth_b3')]
  const compareRows: [string, string, string][] = [
    [t('enrollment.plan.compare_row1'), t('enrollment.plan.compare_row1_t'), t('enrollment.plan.compare_row1_r')],
    [t('enrollment.plan.compare_row2'), t('enrollment.plan.compare_row2_t'), t('enrollment.plan.compare_row2_r')],
    [t('enrollment.plan.compare_row3'), t('enrollment.plan.compare_row3_t'), t('enrollment.plan.compare_row3_r')],
    [t('enrollment.plan.compare_row4'), t('enrollment.plan.compare_row4_t'), t('enrollment.plan.compare_row4_r')],
    [t('enrollment.plan.compare_row5'), t('enrollment.plan.compare_row5_t'), t('enrollment.plan.compare_row5_r')],
  ]

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t('enrollment.plan.choose_title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">{t('enrollment.plan.choose_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            className={cn(
              'flex flex-col rounded-2xl bg-white p-5 text-left shadow-sm transition-all sm:p-6 dark:bg-gray-900',
              selectedPlan === 'traditional'
                ? selectedPlanCardClass
                : 'border border-gray-200 dark:border-gray-700 hover:shadow-md',
            )}
          >
            <div className="relative mb-1">
              <span
                className="inline-flex cursor-default items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {t('enrollment.plan.most_common')}
                <HelpCircle className="h-3 w-3 opacity-70" />
              </span>
              {showTooltip && (
                <div className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                  {t('enrollment.plan.most_common_tip')}
                  <div className="absolute left-6 top-0 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900" />
                </div>
              )}
            </div>

            <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{t('enrollment.plan.traditional_title')}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{t('enrollment.plan.traditional_desc')}</p>

            <ul className="mt-4 flex-1 space-y-3">
              {traditionalBullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {b}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                setSelectedPlan('traditional')
                setConfirmedPlan('traditional')
              }}
              className={cn(
                'mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] sm:text-base',
                confirmedPlan === 'traditional' ? selectedCtaClass : neutralCtaClass,
              )}
            >
              {confirmedPlan === 'traditional' ? (
                <>
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {t('enrollment.plan.selected')}
                </>
              ) : (
                <>
                  {t('enrollment.plan.select_plan')} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div
            className={cn(
              'flex flex-col rounded-2xl bg-white p-5 text-left shadow-sm transition-all sm:p-6 dark:bg-gray-900',
              selectedPlan === 'roth' ? selectedPlanCardClass : 'border border-gray-200 dark:border-gray-700 hover:shadow-md',
            )}
          >
            <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{t('enrollment.plan.roth_title')}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{t('enrollment.plan.roth_desc')}</p>

            <ul className="mt-4 flex-1 space-y-3">
              {rothBullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {b}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                setSelectedPlan('roth')
                setConfirmedPlan('roth')
              }}
              className={cn(
                'mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] sm:text-base',
                confirmedPlan === 'roth' ? selectedCtaClass : neutralCtaClass,
              )}
            >
              {confirmedPlan === 'roth' ? (
                <>
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {t('enrollment.plan.selected')}
                </>
              ) : (
                <>
                  {t('enrollment.plan.select_plan')} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:text-base">{t('enrollment.plan.not_sure')}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('enrollment.plan.ai_help')}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
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
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/40',
                )}
              >
                <Sparkles className="h-4 w-4" /> {t('enrollment.plan.ask_ai')}
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
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                )}
              >
                <MessageCircle className="h-4 w-4" /> {t('enrollment.plan.compare_plans')}
              </button>
            </div>
          </div>

          {showAI && (
            <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/30">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                <div className="text-sm">
                  <p className="font-semibold text-purple-800 dark:text-purple-300">{t('enrollment.plan.ai_recommendation')}</p>
                  <p className="mt-1 leading-relaxed text-purple-700 dark:text-purple-400">{t('enrollment.plan.ai_body')}</p>
                </div>
              </div>
            </div>
          )}

          {showCompare && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[400px] w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                      {t('enrollment.plan.compare_feature')}
                    </th>
                    <th className="py-2 text-left font-semibold text-gray-900 dark:text-white">
                      {t('enrollment.plan.compare_traditional')}
                    </th>
                    <th className="py-2 text-left font-semibold text-gray-900 dark:text-white">
                      {t('enrollment.plan.compare_roth')}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  {compareRows.map(([feature, trad, roth]) => (
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
