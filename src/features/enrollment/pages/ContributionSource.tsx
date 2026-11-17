import { useState, useEffect } from 'react'
import { RangeSlider } from '@/design-system/components/RangeSlider'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentStepNav, type EnrollmentPrimaryLabel } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { getAppDateLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/cn'
import { CARD_TITLE, HEADING, MUTED_TEXT, RULE, SECTION_LABEL, StepHeader, TEXT_LINK, TitleBadge, badge, card } from '@/features/enrollment/enrollmentUi'
import { PLAN_CONFIG } from '@/features/enrollment/agent/planConfig'
import { annualEmployerMatch, matchableRate, splitWhole } from '@/features/enrollment/enrollmentMath'
import {
  Wallet,
  TrendingUp,
  Shield,
  DollarSign,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function ContributionSource() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, advanceStep } = useEnrollment()
  const [showAdvanced, setShowAdvanced] = useState(data.contributionSources.afterTax > 0)

  const sources = data.contributionSources
  const salary = data.salary
  const percent = data.contributionPercent
  const monthlyTotal = Math.round((salary * percent) / 100 / 12)
  const matchCap = PLAN_CONFIG.match.capPercent
  const matchRate = PLAN_CONFIG.match.ratePercent
  // Only pre-tax and Roth are matched; an after-tax share doesn't count toward the match
  const matchable = matchableRate(percent, sources)
  const matchPercent = Math.round(Math.min(matchable, matchCap) * 10) / 10
  const monthlyPay = Math.round(salary / 12)
  /** The part of your monthly savings the employer matches (up to the cap) */
  const monthlyMatched = Math.round((salary * Math.min(matchable, matchCap)) / 100 / 12)
  const annualMatch = annualEmployerMatch(salary, percent, sources)
  const monthlyMatch = Math.round(annualMatch / 12)
  // Dollar split that always adds up to the monthly total (any rounding cent goes to the largest share)
  const [monthlyPreTax, monthlyRoth, monthlyAfterTax] = splitWhole(monthlyTotal, [sources.preTax, sources.roth, sources.afterTax])
  const totalMonthlyInvestment = monthlyTotal + monthlyMatch

  // Plan's own default split — the "Reset" link restores this.
  const planDefault = { preTax: 60, roth: 40, afterTax: 0 }

  /** Moving one slider shares what's left between the other two in their current proportion, always totalling 100. */
  const rebalance = (value: number, moved: keyof typeof sources, first: keyof typeof sources, second: keyof typeof sources, fallback: keyof typeof sources) => {
    const set = Math.min(100, Math.max(0, Math.round(value)))
    const remaining = 100 - set
    const others = sources[first] + sources[second]
    const firstShare = others > 0 ? Math.round((remaining * sources[first]) / others) : fallback === first ? remaining : 0
    updateData({ contributionSources: { ...sources, [moved]: set, [first]: firstShare, [second]: remaining - firstShare } })
  }
  const handlePreTaxChange = (value: number) => rebalance(value, 'preTax', 'roth', 'afterTax', 'roth')
  const handleRothChange = (value: number) => rebalance(value, 'roth', 'preTax', 'afterTax', 'preTax')
  const handleAfterTaxChange = (value: number) => rebalance(value, 'afterTax', 'preTax', 'roth', 'preTax')

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
      primaryLabel: t('enrollment.next') as EnrollmentPrimaryLabel,
      nextDisabled: total !== 100,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, advanceStep, sources.preTax, sources.roth, sources.afterTax, total, t])

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <StepHeader title={t('enrollment.source_page.title')} subtitle={t('enrollment.source_page.subtitle')} />

        {/* Allocation controls on the left, what it means each month on the right */}
        <div className={cn(card(), 'flex w-full flex-col gap-5 sm:flex-row sm:gap-6')}>
            {/* Heading, sliders and links spread down the column so it ends level with the monthly impact panel */}
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className={CARD_TITLE}>{t('enrollment.source_page.your_tax_strategy')}</h2>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-blue-300">
                    <Wallet className="h-4 w-4 shrink-0" aria-hidden />
                    {t('enrollment.source_page.banner', {
                      pct: percent,
                      amount: monthlyTotal.toLocaleString(locale),
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      updateData({
                        contributionSources: { preTax: planDefault.preTax, roth: planDefault.roth, afterTax: planDefault.afterTax },
                        useRecommendedPortfolio: true,
                      })
                      setShowAdvanced(false)
                    }}
                    className={cn(TEXT_LINK, 'mt-2 flex text-xs')}
                  >
                    {t('enrollment.source_page.reset_default')}
                  </button>
                </div>
                <AllocationDonut
                  segments={[
                    { value: sources.preTax, color: 'var(--chart-blue)' },
                    { value: sources.roth, color: 'var(--accent-purple)' },
                    { value: sources.afterTax, color: 'var(--chart-amber)' },
                  ]}
                  centerValue={`${sources.preTax}%`}
                  centerLabel={t('enrollment.source_page.pre_tax')}
                  ariaLabel={[
                    `${sources.preTax}% ${t('enrollment.source_page.pre_tax')}`,
                    `${sources.roth}% ${t('enrollment.source_page.roth')}`,
                    ...(sources.afterTax > 0 ? [`${sources.afterTax}% ${t('enrollment.source_page.after_tax')}`] : []),
                  ].join(', ')}
                />
              </div>

              <div className="space-y-10">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-blue)]" aria-hidden />
                        <p className={cn('text-sm font-bold', HEADING)}>{t('enrollment.source_page.pre_tax')}</p>
                      </div>
                      <p className={cn('ml-[18px] text-xs', MUTED_TEXT)}>{t('enrollment.source_page.pre_tax_hint')}</p>
                    </div>
                    <p className={cn('text-xl font-extrabold tabular-nums', HEADING)}>{sources.preTax}%</p>
                  </div>
                  <RangeSlider min={0} max={100} value={sources.preTax} onChange={handlePreTaxChange} color="var(--chart-blue)" aria-label={t('enrollment.source_page.pre_tax')} aria-valuetext={`${sources.preTax}%`} />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>0%</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      ${monthlyPreTax.toLocaleString(locale)}/mo
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-purple)]" aria-hidden />
                        <p className={cn('text-sm font-bold', HEADING)}>{t('enrollment.source_page.roth')}</p>
                      </div>
                      <p className={cn('ml-[18px] text-xs', MUTED_TEXT)}>{t('enrollment.source_page.roth_hint')}</p>
                    </div>
                    <p className={cn('text-xl font-extrabold tabular-nums', HEADING)}>{sources.roth}%</p>
                  </div>
                  <RangeSlider min={0} max={100} value={sources.roth} onChange={handleRothChange} color="var(--accent-purple)" aria-label={t('enrollment.source_page.roth')} aria-valuetext={`${sources.roth}%`} />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>0%</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      ${monthlyRoth.toLocaleString(locale)}/mo
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={badge('amber')}>{t('enrollment.source_page.advanced')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-amber)]" aria-hidden />
                          <p className={cn('text-sm font-bold', HEADING)}>{t('enrollment.source_page.after_tax')}</p>
                        </div>
                        <p className={cn('ml-[18px] text-xs', MUTED_TEXT)}>{t('enrollment.source_page.after_tax_hint')}</p>
                      </div>
                      <p className={cn('text-xl font-extrabold tabular-nums', HEADING)}>{sources.afterTax}%</p>
                    </div>
                    <RangeSlider min={0} max={100} value={sources.afterTax} onChange={handleAfterTaxChange} color="var(--chart-amber)" aria-label={t('enrollment.source_page.after_tax')} aria-valuetext={`${sources.afterTax}%`} />
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>0%</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        ${monthlyAfterTax.toLocaleString(locale)}/mo
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Links stay together at the bottom of the column */}
              <div className="flex flex-col items-start gap-3">
              {!showAdvanced ? (
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="flex items-center gap-1.5 self-start text-sm font-semibold text-slate-600 transition-colors hover:text-[#0B1533] dark:text-slate-300 dark:hover:text-white"
                >
                  <ChevronDown className="h-4 w-4" /> {t('enrollment.source_page.show_advanced')}
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
                  className="flex items-center gap-1.5 self-start text-sm font-semibold text-slate-600 transition-colors hover:text-[#0B1533] dark:text-slate-300 dark:hover:text-white"
                >
                  <ChevronUp className="h-4 w-4" /> {t('enrollment.source_page.hide_advanced')}
                </button>
              )}

              <a
                href="#understand-the-difference"
                className={cn(TEXT_LINK, 'self-start text-sm')}
              >
                {t('enrollment.source_page.whats_difference')}
              </a>
              </div>
            </div>

            <div className={cn('flex w-full flex-col gap-4 border-t pt-5 sm:w-[38%] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 lg:w-[32%]', RULE)}>
              <h3 className={SECTION_LABEL}>{t('enrollment.source_page.monthly_impact_title')}</h3>
              <div>
                <p className={cn('mb-1 text-xs', MUTED_TEXT)}>{t('enrollment.source_page.you_contribute_label')}</p>
                <p className={cn('mb-2.5 text-xl font-extrabold tabular-nums', HEADING)}>
                  ${monthlyTotal.toLocaleString(locale)}
                </p>
                <div className="space-y-1.5">
                  {[
                    { color: 'bg-[var(--chart-blue)]', labelKey: 'pre_tax_label' as const, amount: monthlyPreTax },
                    { color: 'bg-[var(--accent-purple)]', labelKey: 'roth_label' as const, amount: monthlyRoth },
                  ].map(({ color, labelKey, amount }) => (
                    <div key={labelKey} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('h-1.5 w-1.5 rounded-full', color)} />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(`enrollment.source_page.${labelKey}`)}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-[#0B1533] dark:text-white">${amount.toLocaleString(locale)}</p>
                    </div>
                  ))}
                  {monthlyAfterTax > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--chart-amber)]" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('enrollment.source_page.after_tax_label')}</p>
                      </div>
                      <p className="text-xs font-semibold text-[#0B1533] dark:text-white">
                        ${monthlyAfterTax.toLocaleString(locale)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className={cn('border-t pt-4', RULE)}>
                <p className={SECTION_LABEL}>{t('enrollment.source_page.employer_match')}</p>
                <p className="mt-1 text-xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {t('enrollment.source_page.match_amount_monthly', { amount: `$${monthlyMatch.toLocaleString(locale)}` })}
                </p>
                <p className={cn('mt-0.5 text-xs', MUTED_TEXT)}>{t('enrollment.source_page.match_line', { rate: matchRate, pct: matchCap })}</p>
                {/* How the match is worked out */}
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className={MUTED_TEXT}>{t('enrollment.source_page.mb_pay')}</dt>
                    <dd className={cn('font-semibold tabular-nums', HEADING)}>${monthlyPay.toLocaleString(locale)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className={MUTED_TEXT}>{t('enrollment.source_page.mb_matched', { pct: matchPercent })}</dt>
                    <dd className={cn('font-semibold tabular-nums', HEADING)}>${monthlyMatched.toLocaleString(locale)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className={MUTED_TEXT}>{t('enrollment.source_page.mb_rate', { rate: matchRate })}</dt>
                    <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">+${monthlyMatch.toLocaleString(locale)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className={MUTED_TEXT}>{t('enrollment.source_page.mb_year')}</dt>
                    <dd className={cn('font-bold tabular-nums', HEADING)}>${annualMatch.toLocaleString(locale)}</dd>
                  </div>
                </dl>
                {matchable < matchCap && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">{t('enrollment.source_page.mb_gap', { pct: matchCap })}</p>}
              </div>

              <div className={cn('mt-auto border-t pt-4', RULE)}>
                <p className={SECTION_LABEL}>{t('enrollment.source_page.total_investment')}</p>
                <p className={cn('mt-1 text-[28px] font-extrabold leading-none tabular-nums', HEADING)}>
                  ${totalMonthlyInvestment.toLocaleString(locale)}
                  <span className={cn('ml-1.5 text-xs font-medium', MUTED_TEXT)}>{t('enrollment.source_page.per_month')}</span>
                </p>
              </div>
            </div>
        </div>

        <div id="understand-the-difference" className="scroll-mt-20 space-y-3">
          <h2 className={cn('text-xl font-bold', HEADING)}>{t('enrollment.source_page.understanding_title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                { Icon: TrendingUp, iconBg: 'bg-blue-600', titleKey: 'card_pre_title' as const, pointKeys: ['card_pre_p1', 'card_pre_p2', 'card_pre_p3'] as const },
                { Icon: Shield, iconBg: 'bg-violet-600', titleKey: 'card_roth_title' as const, pointKeys: ['card_roth_p1', 'card_roth_p2', 'card_roth_p3'] as const },
                { Icon: DollarSign, iconBg: 'bg-amber-500', titleKey: 'card_after_title' as const, pointKeys: ['card_after_p1', 'card_after_p2', 'card_after_p3'] as const },
              ] as const
            ).map(({ Icon, iconBg, titleKey, pointKeys }) => (
              <div key={titleKey} className={cn(card('plain', false), 'p-5')}>
                <div className="mb-3 flex items-center gap-3">
                  <TitleBadge Icon={Icon} color={iconBg} />
                  <h3 className={CARD_TITLE}>{t(`enrollment.source_page.${titleKey}`)}</h3>
                </div>
                <ul className="space-y-2">
                  {pointKeys.map((pk) => (
                    <li key={pk} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={3} aria-hidden />
                      <p className="text-[13px] leading-snug text-slate-600 dark:text-slate-300">{t(`enrollment.source_page.${pk}`)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}

/** Pre-tax / Roth / after-tax split as a ring, drawn in the same colors as the sliders below it. */
function AllocationDonut({
  segments,
  centerValue,
  centerLabel,
  ariaLabel,
}: {
  segments: { value: number; color: string }[]
  centerValue: string
  centerLabel: string
  ariaLabel: string
}) {
  let start = 0
  return (
    <div className="relative h-24 w-24 shrink-0" role="img" aria-label={ariaLabel}>
      <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--slider-track)" strokeWidth="5" />
        {segments.map(({ value, color }, i) => {
          if (value <= 0) return null
          const offset = -start
          start += value
          return (
            <circle
              key={i}
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeDasharray={`${value} ${100 - value}`}
              strokeDashoffset={offset}
              className="transition-[stroke-dasharray,stroke-dashoffset] duration-300 motion-reduce:transition-none"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="text-base font-extrabold leading-none text-[#0B1533] dark:text-white">{centerValue}</span>
        <span className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">{centerLabel}</span>
      </div>
    </div>
  )
}
