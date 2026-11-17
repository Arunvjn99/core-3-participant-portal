import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { ROUTES } from '@/lib/constants'
import { useEnrollmentSave } from '@/core/hooks/useEnrollmentSave'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { LEGAL } from '@/lib/constants'
import { getAppDateLocale } from '@/lib/dateLocale'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'
import { useEnrollmentStepNav, type EnrollmentPrimaryLabel } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { Edit3, DollarSign, Briefcase, TrendingUp, Clock, Sparkles, ExternalLink } from 'lucide-react'
import { annualEmployerMatch, projectBalance, retirementIncome } from '@/features/enrollment/enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'
import { cn } from '@/lib/cn'
import { BODY_TEXT, Card, CARD_TITLE, DIVIDE, HEADING, IconChip, MUTED_TEXT, RULE, SECTION_LABEL, StepHeader, TEXT_LINK } from '@/features/enrollment/enrollmentUi'

export default function ReviewEnrollment() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization } = useEnrollment()
  const { advanceStep } = useEnrollmentDraftStore()
  const { saveCompleteEnrollment } = useEnrollmentSave()

  const yearsToRetirement = personalization.retirementAge - personalization.currentAge
  const annualContribution = Math.round((data.salary * data.contributionPercent) / 100)
  const employerContribution = annualEmployerMatch(data.salary, data.contributionPercent, data.contributionSources)
  const growthRate = getGrowthRate(data.riskLevel)

  // Same projection the Auto Increase step shows, so the figure carries through unchanged
  const projectedBalance = projectBalance({
    startingBalance: personalization.currentSavings,
    salary: data.salary,
    ratePercent: data.contributionPercent,
    sources: data.contributionSources,
    years: yearsToRetirement,
    growthRate,
    autoIncrease: data.autoIncrease ? { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax } : null,
  })

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
    if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString(locale)}K`
    return `$${Math.round(val).toLocaleString(locale)}`
  }

  const riskWord = t(`enrollment.review_page.risk_${data.riskLevel}`)

  const sourcesParts: string[] = []
  if (data.contributionSources.preTax > 0) {
    sourcesParts.push(t('enrollment.review_page.source_pre', { pct: data.contributionSources.preTax }))
  }
  if (data.contributionSources.roth > 0) {
    sourcesParts.push(t('enrollment.review_page.source_roth', { pct: data.contributionSources.roth }))
  }
  if (data.supportsAfterTax && data.contributionSources.afterTax > 0) {
    sourcesParts.push(t('enrollment.review_page.source_after', { pct: data.contributionSources.afterTax }))
  }
  const sourcesDisplay = sourcesParts.join(' / ')

  const planName =
    data.plan === 'traditional'
      ? t('enrollment.plan.traditional_title')
      : data.plan === 'roth'
        ? t('enrollment.plan.roth_title')
        : t('enrollment.review_page.plan_none')

  const planSections = [
    {
      labelKey: 'section_plan' as const,
      value: planName,
      editStep: 1,
      editPath: '/enrollment/plan',
    },
    {
      labelKey: 'section_contribution' as const,
      value: t('enrollment.review_page.contrib_value_line', {
        pct: data.contributionPercent,
        amount: annualContribution.toLocaleString(locale),
      }),
      editStep: 2,
      editPath: '/enrollment/contribution',
    },
    {
      labelKey: 'section_source' as const,
      value: sourcesDisplay || t('enrollment.review_page.source_fallback'),
      editStep: 3,
      editPath: '/enrollment/contribution-source',
    },
    {
      labelKey: 'section_auto' as const,
      value: data.autoIncrease
        ? t('enrollment.review_page.auto_enabled', { amt: data.autoIncreaseAmount, max: data.autoIncreaseMax })
        : t('enrollment.review_page.auto_disabled'),
      editStep: 4,
      editPath: '/enrollment/auto-increase',
    },
    {
      labelKey: 'section_investment' as const,
      value: data.customAllocation
        ? t('enrollment.review_page.custom_portfolio', { risk: t(`enrollment.investment.risk_short_${data.riskLevel}`) })
        : `${t(`enrollment.investment.risk_short_${data.riskLevel}`)}${t('enrollment.review_page.portfolio_suffix')}`,
      editStep: 5,
      editPath: '/enrollment/investment',
    },
  ]

  const handleConfirm = useCallback(async () => {
    advanceStep({ confirmedAt: Date.now(), agreed: true }, 'review')
    useEnrollmentDraftStore.getState().setEnrollmentStatus('complete')
    const split = data.contributionSources
    const splitTotal = split.preTax + split.roth + split.afterTax || 100
    const rateFor = (share: number) => Math.round(((data.contributionPercent * share) / splitTotal) * 100) / 100
    const preTaxRate = rateFor(split.preTax)
    const rothRate = rateFor(split.roth)
    useElectionsStore.getState().applyEnrollment({
      preTaxRate,
      rothRate,
      // Whatever rounding leaves goes to after-tax, so the three rates add back up to the chosen percent
      afterTaxRate: split.afterTax > 0 ? Math.round((data.contributionPercent - preTaxRate - rothRate) * 100) / 100 : 0,
      autoIncrease: { enabled: data.autoIncrease, amount: data.autoIncreaseAmount, max: data.autoIncreaseMax },
      mode: data.customAllocation ? 'own' : 'plan_selected',
      risk: data.riskLevel,
      ...(data.customAllocation ? { allocation: data.customAllocation } : {}),
    })
    const result = await saveCompleteEnrollment()
    if (!result.ok) {
      console.warn('[Enrollment] Save failed, proceeding to dashboard anyway:', result.error)
    }
    navigate(ROUTES.POST_ENROLLMENT_DASHBOARD)
  }, [advanceStep, saveCompleteEnrollment, navigate, data])

  useEffect(() => {
    setStepNav({
      showBack: true,
      onBack: () => navigate('/enrollment/readiness'),
      onNext: () => void handleConfirm(),
      primaryLabel: t('enrollment.submit') as EnrollmentPrimaryLabel,
      nextDisabled: !data.agreedToTerms,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, handleConfirm, data.agreedToTerms, t])

  const confidenceMessage =
    employerContribution >= annualContribution * 0.5
      ? t('enrollment.review_page.confidence_high', { amount: employerContribution.toLocaleString(locale) })
      : t('enrollment.review_page.confidence_default', {
          age: personalization.retirementAge,
          pct: retirementIncome(projectedBalance, yearsToRetirement, data.salary).goalPct,
        })

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-[1040px] space-y-5">
        <StepHeader title={t('enrollment.review_page.title')} subtitle={t('enrollment.review_page.subtitle')} />

        {/* Projected balance, with the four figures behind it under one rule */}
        <Card tone="blue">
          <p className={SECTION_LABEL}>{t('enrollment.review_page.projected_label')}</p>
          <p className={cn('mt-1 text-[40px] font-extrabold leading-none tabular-nums', HEADING)}>{formatCurrency(projectedBalance)}</p>
          <p className={cn('mt-2 text-xs', MUTED_TEXT)}>{t('enrollment.review_page.projected_note', { years: yearsToRetirement })}</p>

          <dl className={cn('mt-5 grid grid-cols-2 gap-y-4 border-t pt-4 md:grid-cols-4 md:divide-x', RULE, DIVIDE)}>
            {(
              [
                {
                  Icon: DollarSign,
                  labelKey: 'stat_contrib' as const,
                  value: `$${annualContribution.toLocaleString(locale)}`,
                  sub: t('enrollment.review_page.per_year'),
                },
                {
                  Icon: Briefcase,
                  labelKey: 'stat_match' as const,
                  value: `$${employerContribution.toLocaleString(locale)}`,
                  sub: t('enrollment.review_page.per_year'),
                },
                {
                  Icon: TrendingUp,
                  labelKey: 'stat_growth' as const,
                  value: `~${(growthRate * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
                  sub: t('enrollment.review_page.stat_growth_sub', { risk: riskWord }),
                },
                {
                  Icon: Clock,
                  labelKey: 'stat_horizon' as const,
                  value: t('enrollment.review_page.stat_horizon_years', { years: yearsToRetirement }),
                  sub: t('enrollment.review_page.stat_horizon_sub', { age: personalization.retirementAge }),
                },
              ] as const
            ).map(({ Icon, labelKey, value, sub }) => (
              <div key={labelKey} className="md:px-4 md:first:pl-0 md:last:pr-0">
                <dt className={cn('flex items-center gap-1.5 text-xs font-medium', MUTED_TEXT)}>
                  <Icon className="h-3.5 w-3.5 text-primary dark:text-blue-300" aria-hidden />
                  {t(`enrollment.review_page.${labelKey}`)}
                </dt>
                <dd className={cn('mt-1 text-lg font-bold leading-tight tabular-nums', HEADING)}>{value}</dd>
                <dd className={cn('text-[11px]', MUTED_TEXT)}>{sub}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Plan summary: one card, each choice with its own Edit link */}
        <Card>
          <h2 className={CARD_TITLE}>{t('enrollment.review_page.setup_title')}</h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            {planSections.map((section) => (
              <div key={section.labelKey} className={cn('flex items-start justify-between gap-3 border-t pt-3', RULE)}>
                <div className="min-w-0">
                  <dt className={SECTION_LABEL}>{t(`enrollment.review_page.${section.labelKey}`)}</dt>
                  <dd className={cn('mt-1 text-sm font-semibold', HEADING)}>{section.value}</dd>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(section.editPath)}
                  aria-label={`${t('enrollment.edit')}: ${t(`enrollment.review_page.${section.labelKey}`)}`}
                  className={cn(TEXT_LINK, 'shrink-0 gap-1 text-xs')}
                >
                  <Edit3 className="h-3 w-3" aria-hidden /> {t('enrollment.edit')}
                </button>
              </div>
            ))}
          </dl>
        </Card>

        {/* Confidence banner */}
        <Card tone="warm" className="flex items-center gap-3 !py-4">
          <IconChip Icon={Sparkles} tone="amber" />
          <p className={cn('text-sm font-semibold', HEADING)}>{confidenceMessage}</p>
        </Card>

        {/* Terms */}
        <Card className="!py-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={data.agreedToTerms}
              onChange={(e) => updateData({ agreedToTerms: e.target.checked })}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-[var(--color-primary)]"
            />
            <span className={cn('text-sm', BODY_TEXT)}>
              {t('enrollment.review_page.terms')}{' '}
              <LegalHrefLink href={LEGAL.termsOfServiceHref} className={TEXT_LINK}>
                {t('enrollment.review_page.view_terms')} <ExternalLink className="h-3 w-3" />
              </LegalHrefLink>
            </span>
          </label>
        </Card>
      </div>
    </AnimatedPage>
  )
}
