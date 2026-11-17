import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useEnrollmentStepNav } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { AutoIncreaseSkipPanel } from '@/features/enrollment/components/AutoIncreaseSkipPanel'
import { ArrowRight, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BODY_TEXT, Card, CARD_TITLE, HEADING, IconChip, PILL_PRIMARY, PILL_SECONDARY, SECTION_LABEL, StepHeader, TitleBadge, badge } from '@/features/enrollment/enrollmentUi'
import { compareAutoIncrease } from '@/features/enrollment/enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'

export default function AutoIncrease() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization } = useEnrollment()
  const [showSkipModal, setShowSkipModal] = useState(false)

  const {
    fixed: fixedProjection,
    withIncrease: autoProjection,
    difference,
  } = compareAutoIncrease(
    {
      startingBalance: personalization.currentSavings,
      salary: data.salary,
      ratePercent: data.contributionPercent,
      sources: data.contributionSources,
      years: 10,
      growthRate: getGrowthRate(data.riskLevel),
    },
    { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax },
  )

  const handleSelect = (autoIncrease: boolean) => {
    updateData({ autoIncrease })
    if (autoIncrease) {
      navigate('/enrollment/auto-increase-setup')
    } else {
      setShowSkipModal(true)
    }
  }

  const handleConfirmSkip = () => {
    updateData({ autoIncrease: false })
    useEnrollmentDraftStore.getState().advanceStep({ enabled: false, amount: 0, max: 15 }, 'autoIncrease')
    setShowSkipModal(false)
    navigate('/enrollment/investment')
  }

  const handleReconsiderFromModal = () => {
    setShowSkipModal(false)
    updateData({ autoIncrease: true })
    navigate('/enrollment/auto-increase-setup')
  }

  useEffect(() => {
    setStepNav({
      showBack: true,
      onBack: () => navigate('/enrollment/contribution-source'),
      showNext: false,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate])

  useEffect(() => {
    if (!showSkipModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSkipModal(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showSkipModal])

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <StepHeader title={t('enrollment.auto_increase_page.title')} subtitle={t('enrollment.auto_increase_page.subtitle')} />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Fixed */}
          <Card className="flex flex-col">
            <div className="hidden min-h-[22px] sm:block" />
            <div className="flex items-center gap-3 sm:mt-2">
              <IconChip Icon={Minus} tone="slate" />
              <h2 className={CARD_TITLE}>{t('enrollment.auto_increase_page.fixed_title')}</h2>
            </div>
            <p className={cn('mt-3 text-sm leading-relaxed', BODY_TEXT)}>{t('enrollment.auto_increase_page.fixed_body', { pct: data.contributionPercent })}</p>
            <div className="mt-4 flex-1">
              <p className={SECTION_LABEL}>{t('enrollment.auto_increase_page.projected_10y')}</p>
              <p className={cn('mt-1 text-[32px] font-extrabold leading-none tabular-nums', HEADING)}>${fixedProjection.toLocaleString(locale)}</p>
            </div>
            <button type="button" onClick={() => handleSelect(false)} className={cn(PILL_SECONDARY, 'mt-5 w-full')}>
              {t('enrollment.auto_increase_page.skip_cta')}
            </button>
          </Card>

          {/* Auto Increase - Recommended */}
          <Card tone="selected" className="flex flex-col">
            <div className="flex min-h-[22px] items-center">
              <span className={badge('blue')}>{t('enrollment.auto_increase_page.recommended')}</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <TitleBadge Icon={TrendingUp} />
              <h2 className={CARD_TITLE}>{t('enrollment.auto_increase_page.enable_title')}</h2>
            </div>
            <p className={cn('mt-3 text-sm leading-relaxed', BODY_TEXT)}>
              {t('enrollment.auto_increase_page.enable_body', { amt: data.autoIncreaseAmount, max: data.autoIncreaseMax })}
            </p>
            <div className="mt-4 flex-1">
              <p className={SECTION_LABEL}>{t('enrollment.auto_increase_page.projected_10y')}</p>
              <p className="mt-1 text-[32px] font-extrabold leading-none tabular-nums text-primary dark:text-blue-300">${autoProjection.toLocaleString(locale)}</p>
            </div>
            <button type="button" onClick={() => handleSelect(true)} className={cn(PILL_PRIMARY, 'mt-5 w-full')}>
              {t('enrollment.auto_increase_page.enable_cta')} <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </Card>
        </div>

        {/* What auto-increase adds over ten years */}
        <Card className="flex items-center gap-3 !py-4">
          <IconChip Icon={TrendingUp} tone="emerald" />
          <p className={cn('text-sm font-semibold', HEADING)}>
            {t('enrollment.auto_increase_page.impact_banner', { amount: `+$${difference.toLocaleString(locale)}` })}
          </p>
        </Card>
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-app-blocking-overlay>
          <div
            className="absolute inset-0 bg-[#0B1533]/50 backdrop-blur-sm"
            onClick={() => setShowSkipModal(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-increase-skip-title"
            className="relative w-full max-w-lg rounded-[24px] bg-white p-6 text-left shadow-2xl ring-1 ring-slate-200/70 sm:p-8 dark:bg-[#0B1436] dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <AutoIncreaseSkipPanel
              missedSavingsAmount={difference}
              onReconsider={handleReconsiderFromModal}
              onContinueWithout={handleConfirmSkip}
              onDismiss={() => setShowSkipModal(false)}
              showDismissButton
            />
          </div>
        </div>
      )}
    </AnimatedPage>
  )
}
