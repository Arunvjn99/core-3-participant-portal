import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
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
import { Edit3, Sparkles, ExternalLink, ChevronDown } from 'lucide-react'

/** Collapsed-by-default Details row. Holds the per-year contribution and
 *  match numbers, the assumed return and the horizon. */
function ReviewDetails({
  annualContribution,
  employerContribution,
  yearsToRetirement,
  retirementAge,
  growthRate,
  locale,
}: {
  annualContribution: number
  employerContribution: number
  yearsToRetirement: number
  retirementAge: number
  growthRate: number
  locale: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rows: { label: string; value: string }[] = [
    {
      label: t('enrollment.review_page.stat_contrib'),
      value: `$${annualContribution.toLocaleString(locale)} ${t('enrollment.review_page.per_year')}`,
    },
    {
      label: t('enrollment.review_page.stat_match'),
      value: `$${employerContribution.toLocaleString(locale)} ${t('enrollment.review_page.per_year')}`,
    },
    {
      label: t('enrollment.review_page.stat_growth'),
      value: `~${(growthRate * 100).toFixed(0)}% ${t('enrollment.review_page.growth_assumption_suffix')}`,
    },
    {
      label: t('enrollment.review_page.stat_horizon'),
      value: t('enrollment.review_page.stat_horizon_full', { years: yearsToRetirement, age: retirementAge }),
    },
  ]
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-gray-700 dark:text-gray-200" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {t('enrollment.review_page.details_title')}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100 px-5 dark:divide-gray-800 dark:border-gray-800">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.78rem' }}>{row.label}</span>
              <span className="text-gray-900 dark:text-white tabular-nums" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

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

  // Reconcile with the Contribution step, which explicitly tells participants
  // the projection assumes 7% annual return. The old risk-based rate here
  // (4.5% to 9.5% depending on risk level) meant the "Projected" number on
  // Review could differ from the number the participant just saw, for no
  // reason they would understand.
  const growthRate = 0.07

  let projectedBalance = personalization.currentSavings
  for (let i = 0; i < yearsToRetirement; i++) {
    projectedBalance = (projectedBalance + totalAnnual) * (1 + growthRate)
  }

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString(locale)}K`
    return `$${Math.round(val).toLocaleString(locale)}`
  }

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
    advanceStep({ confirmedAt: Date.now(), agreed: true }, 'review')
    useEnrollmentDraftStore.getState().setEnrollmentStatus('complete')
    const split = data.contributionSources
    const splitTotal = split.preTax + split.roth + split.afterTax || 100
    useElectionsStore.getState().applyEnrollment({
      preTaxRate: Math.round(((data.contributionPercent * split.preTax) / splitTotal) * 100) / 100,
      rothRate: Math.round(((data.contributionPercent * split.roth) / splitTotal) * 100) / 100,
      autoIncrease: { enabled: data.autoIncrease, amount: data.autoIncreaseAmount, max: data.autoIncreaseMax },
      risk: data.riskLevel,
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

        {/* Projection hero — one headline number. The per-year contribution,
            match and horizon figures live inside the Details expander below
            so they're not shown twice on the same page. */}
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
        </div>

        {/* Plan summary — a plain label → value list, not a card grid.
            Each row links back to its step so the viewer can go fix something
            without scrolling to find an edit button. */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-gray-900 dark:text-white" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            {t('enrollment.review_page.setup_title')}
          </p>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {planSections.map((section) => (
              <li key={section.labelKey} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.78rem' }}>
                    {t(`enrollment.review_page.${section.labelKey}`)}
                  </p>
                  <p className="mt-0.5 break-words text-gray-900 dark:text-white tabular-nums" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {section.value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(section.editPath)}
                  className="shrink-0 inline-flex items-center gap-1 pt-1 text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  aria-label={`${t('enrollment.edit')} ${t(`enrollment.review_page.${section.labelKey}`)}`}
                >
                  <Edit3 className="h-3 w-3" /> {t('enrollment.edit')}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Details · assumptions · what happens next — the per-year dollar
            numbers and horizon, pulled out of the hero. Collapsed by default. */}
        <ReviewDetails
          annualContribution={annualContribution}
          employerContribution={employerContribution}
          yearsToRetirement={yearsToRetirement}
          retirementAge={personalization.retirementAge}
          growthRate={growthRate}
          locale={locale}
        />

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
