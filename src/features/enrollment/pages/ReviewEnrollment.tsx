import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useEnrollmentSave } from '@/core/hooks/useEnrollmentSave'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { LEGAL } from '@/lib/constants'
import { getAppDateLocale } from '@/lib/dateLocale'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'
import { useEnrollmentStepNav, type EnrollmentPrimaryLabel } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { Edit3, DollarSign, Briefcase, TrendingUp, Clock, Sparkles, ExternalLink } from 'lucide-react'

export default function ReviewEnrollment() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization } = useEnrollment()
  const { advanceStep } = useEnrollmentDraftStore()
  const { saveCompleteEnrollment } = useEnrollmentSave()

  const yearsToRetirement = personalization.retirementAge - personalization.currentAge
  const matchPercent = Math.min(data.contributionPercent, 6)
  const annualContribution = Math.round((data.salary * data.contributionPercent) / 100)
  const employerContribution = Math.round((data.salary * matchPercent) / 100)
  const totalAnnual = annualContribution + employerContribution

  const growthRates: Record<string, number> = { conservative: 0.045, balanced: 0.068, growth: 0.082, aggressive: 0.095 }
  const growthRate = growthRates[data.riskLevel] || 0.068

  let projectedBalance = personalization.currentSavings
  for (let i = 0; i < yearsToRetirement; i++) {
    projectedBalance = (projectedBalance + totalAnnual) * (1 + growthRate)
  }

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
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
      value: `${t(`enrollment.review_page.risk_${data.riskLevel}`)}${t('enrollment.review_page.portfolio_suffix')}`,
      editStep: 5,
      editPath: '/enrollment/investment',
    },
  ]

  const handleConfirm = useCallback(async () => {
    setPersistError(null)
    advanceStep({ confirmedAt: Date.now(), agreed: true }, 'review')
    const result = await saveCompleteEnrollment()
    if (!result.ok) {
      console.warn('[Enrollment] Save failed, proceeding to success anyway:', result.error)
    }
    navigate('/enrollment/success')
  }, [advanceStep, saveCompleteEnrollment, navigate])

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
      : t('enrollment.review_page.confidence_default', { age: personalization.retirementAge })

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-5xl space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 dark:text-white">{t('enrollment.review_page.title')}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>
            {t('enrollment.review_page.subtitle')}
          </p>
        </div>

        {/* Hero — light blue */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 p-6 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-800/50">
          <p className="text-blue-600 dark:text-blue-400" style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('enrollment.review_page.projected_label')}
          </p>
          <p className="mt-1 tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '2.6rem', fontWeight: 700 }}>
            {formatCurrency(projectedBalance)}
          </p>
          <p className="mt-0.5 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>
            {t('enrollment.review_page.projected_note', { years: yearsToRetirement })}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
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
              <div key={labelKey} className="rounded-xl bg-white/70 border border-blue-200 px-3.5 py-3 dark:bg-blue-900/20 dark:border-blue-700/50">
                <div className="mb-1 flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                  <span className="text-blue-600 dark:text-blue-400" style={{ fontSize: '0.62rem', fontWeight: 500 }}>
                    {t(`enrollment.review_page.${labelKey}`)}
                  </span>
                </div>
                <p className="text-gray-900 dark:text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{value}</p>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.6rem' }}>
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Summary Grid */}
        <div>
          <p className="mb-3 text-gray-900 dark:text-white" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            {t('enrollment.review_page.setup_title')}
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {planSections.map((section) => (
              <div
                key={section.labelKey}
                className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 dark:border-gray-700 dark:bg-gray-900"
              >
                <div>
                  <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t(`enrollment.review_page.${section.labelKey}`)}
                  </p>
                  <p className="mt-1 text-gray-900 dark:text-white" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                    {section.value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(section.editPath)}
                  className="mt-2.5 flex items-center gap-1 self-start text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  style={{ fontSize: '0.7rem', fontWeight: 500 }}
                >
                  <Edit3 className="h-3 w-3" /> {t('enrollment.edit')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 dark:border-amber-800/40 dark:bg-amber-950/30">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-amber-800 dark:text-amber-400" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
            {confidenceMessage}
          </p>
        </div>

        {/* Terms Checkbox */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <label className="flex cursor-pointer items-start gap-3">
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={data.agreedToTerms}
                onChange={(e) => updateData({ agreedToTerms: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 accent-blue-600"
              />
            </div>
            <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.82rem' }}>
              {t('enrollment.review_page.terms')}{' '}
              <LegalHrefLink
                href={LEGAL.termsOfServiceHref}
                className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {t('enrollment.review_page.view_terms')} <ExternalLink className="h-3 w-3" />
              </LegalHrefLink>
            </span>
          </label>
        </div>
      </div>
    </AnimatedPage>
  )
}
