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

export default function AutoIncrease() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData } = useEnrollment()
  const [showSkipModal, setShowSkipModal] = useState(false)

  const fixedProjection = 124621
  const autoProjection = 185943
  const difference = autoProjection - fixedProjection

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t('enrollment.auto_increase_page.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            {t('enrollment.auto_increase_page.subtitle')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Fixed */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Minus className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-gray-900 dark:text-white">{t('enrollment.auto_increase_page.fixed_title')}</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.85rem' }}>
              {t('enrollment.auto_increase_page.fixed_body', { pct: data.contributionPercent })}
            </p>
            <div className="mt-4 flex-1">
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.75rem' }}>
                {t('enrollment.auto_increase_page.projected_10y')}
              </p>
              <p className="text-gray-900 dark:text-white" style={{ fontSize: '2rem', fontWeight: 700 }}>
                ${fixedProjection.toLocaleString(locale)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelect(false)}
              className="mt-5 flex min-h-[2.75rem] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t('enrollment.auto_increase_page.skip_cta')}
            </button>
          </div>

          {/* Auto Increase - Recommended */}
          <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-white p-5 shadow-sm dark:bg-gray-900">
            <span
              className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 text-white"
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              {t('enrollment.auto_increase_page.recommended')}
            </span>
            <div className="mb-3 mt-1 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-gray-900 dark:text-white">{t('enrollment.auto_increase_page.enable_title')}</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.85rem' }}>
              {t('enrollment.auto_increase_page.enable_body')}
            </p>
            <div className="mt-4 flex-1">
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.75rem' }}>
                {t('enrollment.auto_increase_page.projected_10y')}
              </p>
              <p className="text-primary" style={{ fontSize: '2rem', fontWeight: 700 }}>
                ${autoProjection.toLocaleString(locale)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelect(true)}
              className="btn-brand mt-5 flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm active:scale-[0.98]"
            >
              {t('enrollment.auto_increase_page.enable_cta')} <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Impact Banner — soft blue wash */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-center dark:border-blue-500/20 dark:bg-blue-950/25">
          <p className="text-text-primary dark:text-gray-200" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {t('enrollment.auto_increase_page.impact_banner', {
              amount: `+$${difference.toLocaleString(locale)}`,
            })}
          </p>
        </div>
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-app-blocking-overlay>
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSkipModal(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-increase-skip-title"
            className="relative w-full max-w-lg rounded-[28px] border border-slate-200/90 bg-white p-6 text-left shadow-2xl sm:p-8 dark:border-gray-700 dark:bg-gray-900"
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
