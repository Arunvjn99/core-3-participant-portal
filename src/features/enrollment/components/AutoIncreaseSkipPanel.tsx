import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useEnrollment } from '@/core/hooks/useEnrollment'

export interface AutoIncreaseSkipPanelProps {
  /** @deprecated kept for prop-compat with callers; no longer displayed. */
  missedSavingsAmount?: number
  /** User chose to turn auto-increase on after all. */
  onReconsider: () => void
  /** User confirmed they want to continue without auto-increase. */
  onContinueWithout: () => void
  /** Optional dismiss (e.g. modal backdrop / close control) */
  onDismiss?: () => void
  showDismissButton?: boolean
}

/**
 * Neutral confirmation for skipping auto-increase. The earlier version
 * framed the choice as a mistake ("Potential Missed Savings — you will be
 * losing $61,322") and put "Reconsider Auto Increase" as the primary
 * button, with "skip this step" reduced to an underlined tap target. That
 * read as pressure, so this panel treats skipping as a plain choice: one
 * clear line of what will happen, two equal buttons, no loss tile.
 */
export function AutoIncreaseSkipPanel({
  onReconsider,
  onContinueWithout,
  onDismiss,
  showDismissButton = false,
}: AutoIncreaseSkipPanelProps) {
  const { t } = useTranslation()
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
          className="absolute right-0 top-0 z-10 shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={t('enrollment.auto_increase_skip.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}

      <div
        className={`flex flex-col items-center text-center ${showDismissButton ? 'px-10 sm:px-11' : ''}`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <X className="h-6 w-6 text-gray-500 dark:text-gray-400" strokeWidth={2.25} aria-hidden />
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

      {/* Two equal-weight choices, side by side. "Keep it off" is primary
          because that is the choice the viewer has already made; "Turn it
          on" is a plain outlined button, not a pushy one. */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onReconsider}
          className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 active:scale-[0.99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          {t('enrollment.auto_increase_skip.turn_on')}
        </button>
        <button
          type="button"
          onClick={onContinueWithout}
          className="btn-brand min-h-[48px] rounded-xl px-6 py-3 text-sm font-semibold active:scale-[0.99]"
        >
          {t('enrollment.auto_increase_skip.keep_off')}
        </button>
      </div>
    </div>
  )
}
