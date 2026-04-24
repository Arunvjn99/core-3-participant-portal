import { useTranslation } from 'react-i18next'
import { ArrowRight, Pause, X } from 'lucide-react'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { getAppDateLocale } from '@/lib/dateLocale'

export interface AutoIncreaseSkipPanelProps {
  /** Difference (with − without auto increase), shown in the alert */
  missedSavingsAmount: number
  onReconsider: () => void
  onContinueWithout: () => void
  /** Optional dismiss (e.g. modal backdrop / close control) */
  onDismiss?: () => void
  showDismissButton?: boolean
}

export function AutoIncreaseSkipPanel({
  missedSavingsAmount,
  onReconsider,
  onContinueWithout,
  onDismiss,
  showDismissButton = false,
}: AutoIncreaseSkipPanelProps) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const missed = missedSavingsAmount.toLocaleString(locale)
  const { data } = useEnrollment()
  const planLabel =
    data.plan === 'traditional'
      ? t('enrollment.auto_increase_skip.plan_traditional')
      : t('enrollment.auto_increase_skip.plan_roth')
  const rate = data.contributionPercent

  return (
    <div className="relative flex w-full flex-col">
      {showDismissButton && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-0 top-0 z-10 shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={t('enrollment.auto_increase_skip.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}

      {/* Confirmation copy: symmetric horizontal padding when close is shown so text stays optically centered */}
      <div
        className={`flex flex-col items-center text-center ${showDismissButton ? 'px-10 sm:px-11' : ''}`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Pause className="h-6 w-6 text-gray-500 dark:text-gray-400" strokeWidth={2.25} aria-hidden />
        </div>
        <h2
          id="auto-increase-skip-title"
          className="mt-4 text-lg font-bold leading-snug tracking-tight text-gray-900 dark:text-white sm:text-xl"
        >
          {t('enrollment.auto_increase_skip.title')}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {t('enrollment.auto_increase_skip.body', { plan: planLabel, rate })}
        </p>
      </div>

      <div
        className="mt-6 rounded-xl border border-red-200/90 bg-red-50 p-4 text-left dark:border-red-900/50 dark:bg-red-950/35"
        role="alert"
        aria-labelledby="auto-increase-skip-alert-title"
      >
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center self-start rounded-full bg-red-200/80 text-xs font-bold leading-none text-red-700 dark:bg-red-900/80 dark:text-red-200">
            ×
          </span>
          <div className="min-w-0 flex-1">
            <p id="auto-increase-skip-alert-title" className="text-sm font-bold text-red-800 dark:text-red-200">
              {t('enrollment.auto_increase_skip.alert_title')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-red-700 dark:text-red-200/95">
              {t('enrollment.auto_increase_skip.alert_body', { amount: `$${missed}` })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <button
          type="button"
          onClick={onReconsider}
          className="btn-brand flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl py-3.5 text-sm active:scale-[0.99]"
        >
          {t('enrollment.auto_increase_skip.reconsider')}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>

        <p className="text-center text-sm leading-normal text-gray-500 dark:text-gray-400">
          {t('enrollment.auto_increase_skip.tap_here')}{' '}
          <button
            type="button"
            onClick={onContinueWithout}
            className="font-medium text-gray-600 underline decoration-gray-400 underline-offset-2 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            {t('enrollment.auto_increase_skip.here')}
          </button>{' '}
          {t('enrollment.auto_increase_skip.skip_step')}
        </p>
      </div>
    </div>
  )
}
