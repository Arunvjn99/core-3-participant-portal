import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentStepNav } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { Check, Sparkles, MessageCircle, Landmark, HelpCircle, ChevronRight } from 'lucide-react'
import { BODY_TEXT, Card, CARD_TITLE, HEADING, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, RULE, StepHeader, TitleBadge, badge, card } from '@/features/enrollment/enrollmentUi'

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

  if (!hasTwoPlans) {
    const onlyPlan = data.companyPlans[0] || 'traditional'
    const planLabel =
      onlyPlan === 'traditional' ? t('enrollment.plan.traditional_title') : t('enrollment.plan.roth_title')
    return (
      <AnimatedPage>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Card tone="blue" className="w-full max-w-md space-y-5 text-center sm:p-8">
            <span className="mx-auto flex w-fit">
              <TitleBadge Icon={Landmark} />
            </span>
            <div>
              <h2 className={cn('text-xl font-bold', HEADING)}>{t('enrollment.plan.single_title', { plan: planLabel })}</h2>
              <p className={cn('mt-2 text-sm leading-relaxed', BODY_TEXT)}>
                {onlyPlan === 'traditional' ? t('enrollment.plan.single_desc_traditional') : t('enrollment.plan.single_desc_roth')}
              </p>
            </div>
            <button type="button" onClick={() => confirmPlan(onlyPlan)} className={cn(PILL_PRIMARY, 'w-full')}>
              {t('enrollment.plan.continue_contributions')} <ChevronRight className="h-4 w-4" />
            </button>
          </Card>
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

  const plans = [
    { id: 'traditional' as const, title: t('enrollment.plan.traditional_title'), desc: t('enrollment.plan.traditional_desc'), bullets: traditionalBullets, mostCommon: true },
    { id: 'roth' as const, title: t('enrollment.plan.roth_title'), desc: t('enrollment.plan.roth_desc'), bullets: rothBullets, mostCommon: false },
  ]

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <StepHeader title={t('enrollment.plan.choose_title')} subtitle={t('enrollment.plan.choose_subtitle')} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id
            const isConfirmed = confirmedPlan === plan.id
            return (
              <div key={plan.id} className={cn(card(isSelected ? 'selected' : 'plain'), 'flex flex-col text-left transition-shadow')}>
                <div className={cn('items-center md:flex md:min-h-[22px]', plan.mostCommon ? 'flex' : 'hidden')}>
                  {plan.mostCommon && (
                    <div className="relative">
                      <span className={cn(badge('amber'), 'cursor-default')} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                        {t('enrollment.plan.most_common')}
                        <HelpCircle className="h-3 w-3 opacity-70" />
                      </span>
                      {showTooltip && (
                        <div className="absolute left-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-xl bg-[#0B1533] px-3 py-2 text-xs text-white shadow-lg">
                          {t('enrollment.plan.most_common_tip')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <h3 className={cn('text-xl font-bold md:mt-2', plan.mostCommon && 'mt-2', HEADING)}>{plan.title}</h3>
                <p className={cn('mt-1 text-sm leading-relaxed', BODY_TEXT)}>{plan.desc}</p>

                <ul className="mt-4 flex-1 space-y-2.5">
                  {plan.bullets.map((b) => (
                    <li key={b} className={cn('flex items-start gap-2.5 text-sm', BODY_TEXT)}>
                      <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20" aria-hidden>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(plan.id)
                    setConfirmedPlan(plan.id)
                  }}
                  aria-pressed={isConfirmed}
                  className={cn(isConfirmed ? PILL_PRIMARY : PILL_SECONDARY, 'mt-5 w-full')}
                >
                  {isConfirmed ? (
                    <>
                      <Check className="h-4 w-4 shrink-0" aria-hidden />
                      {t('enrollment.plan.selected')}
                    </>
                  ) : (
                    <>
                      {t('enrollment.plan.select_plan')} <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <Card tone="sky">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <TitleBadge Icon={Sparkles} />
              <div className="min-w-0">
                <p className={CARD_TITLE}>{t('enrollment.plan.not_sure')}</p>
                <p className={cn('mt-1 text-sm', BODY_TEXT)}>{t('enrollment.plan.ai_help')}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAI(!showAI)
                  setShowCompare(false)
                }}
                aria-expanded={showAI}
                className={cn(showAI ? PILL_PRIMARY : PILL_SECONDARY, 'h-10')}
              >
                <Sparkles className="h-4 w-4" /> {t('enrollment.plan.ask_ai')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCompare(!showCompare)
                  setShowAI(false)
                }}
                aria-expanded={showCompare}
                className={cn(showCompare ? PILL_PRIMARY : PILL_SECONDARY, 'h-10')}
              >
                <MessageCircle className="h-4 w-4" /> {t('enrollment.plan.compare_plans')}
              </button>
            </div>
          </div>

          {showAI && (
            <div className={cn('mt-4 border-t pt-4 text-sm', RULE)}>
              <p className={cn('font-bold', HEADING)}>{t('enrollment.plan.ai_recommendation')}</p>
              <p className={cn('mt-1 leading-relaxed', BODY_TEXT)}>{t('enrollment.plan.ai_body')}</p>
            </div>
          )}

          {showCompare && (
            <div className={cn('mt-4 overflow-x-auto border-t pt-2', RULE)}>
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className={cn('border-b', RULE)}>
                    <th className={cn('py-2.5 text-left font-medium', MUTED_TEXT)}>{t('enrollment.plan.compare_feature')}</th>
                    <th className={cn('py-2.5 text-left font-bold', HEADING)}>{t('enrollment.plan.compare_traditional')}</th>
                    <th className={cn('py-2.5 text-left font-bold', HEADING)}>{t('enrollment.plan.compare_roth')}</th>
                  </tr>
                </thead>
                <tbody className={BODY_TEXT}>
                  {compareRows.map(([feature, trad, roth]) => (
                    <tr key={String(feature)} className={cn('border-b last:border-b-0', RULE)}>
                      <td className={cn('py-2.5', MUTED_TEXT)}>{feature}</td>
                      <td className="py-2.5">{trad}</td>
                      <td className="py-2.5">{roth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AnimatedPage>
  )
}
