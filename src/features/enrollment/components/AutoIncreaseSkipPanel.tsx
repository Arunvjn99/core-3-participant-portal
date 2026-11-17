import { useTranslation } from 'react-i18next'
import { X, AlertTriangle } from 'lucide-react'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { getAppDateLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/cn'
import { BODY_TEXT, HEADING, IconChip, PILL_PRIMARY, PILL_SECONDARY } from '@/features/enrollment/enrollmentUi'

export interface AutoIncreaseSkipPanelProps {
  /** Dollars auto-increase would add over 10 years: the "with" projection minus the "without" projection.
   *  Shown in the warning tile. Omitted or <= 0: the tile is hidden. */
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
 * Confirmation for skipping auto-increase: one line of what will happen, a warning tile with the savings the
 * participant could miss, and two buttons. Turning it on is the primary action; keeping it off is secondary.
 */
export function AutoIncreaseSkipPanel({
  missedSavingsAmount,
  onReconsider,
  onContinueWithout,
  onDismiss,
  showDismissButton = false,
}: AutoIncreaseSkipPanelProps) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const { data } = useEnrollment()
  const planLabel =
    data.plan === 'traditional'
      ? t('enrollment.auto_increase_skip.plan_traditional')
      : t('enrollment.auto_increase_skip.plan_roth')
  const rate = data.contributionPercent
  const showContext = typeof missedSavingsAmount === 'number' && missedSavingsAmount > 0

  return (
    <div className="relative flex w-full flex-col">
      {showDismissButton && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-0 top-0 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0B1533] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label={t('enrollment.auto_increase_skip.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}

      <div
        className={`flex flex-col items-center text-center ${showDismissButton ? 'px-10 sm:px-11' : ''}`}
      >
        <IconChip Icon={X} tone="slate" />
        <h2
          id="auto-increase-skip-title"
          className={cn('mt-3 text-xl font-bold leading-snug', HEADING)}
        >
          {t('enrollment.auto_increase_skip.title')}
        </h2>
        <p className={cn('mt-2 max-w-md text-sm leading-relaxed', BODY_TEXT)}>
          {t('enrollment.auto_increase_skip.body', { plan: planLabel, rate })}
        </p>
      </div>

      {/* Warning tile: what skipping could cost. Only shows when we actually have a number to quote. */}
      {showContext && (
        <div
          className="mt-5 rounded-2xl bg-amber-50 p-3.5 text-left ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-400/25"
          role="note"
        >
          <div className="flex gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                {t('enrollment.auto_increase_skip.info_label')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                {t('enrollment.auto_increase_skip.info_body', {
                  amount: `$${missedSavingsAmount.toLocaleString(locale)}`,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* "Turn it on" is the primary action; "Keep it off" is the secondary one. On phones the primary sits on top. */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onContinueWithout}
          className={cn(PILL_SECONDARY, 'px-6')}
        >
          {t('enrollment.auto_increase_skip.keep_off')}
        </button>
        <button
          type="button"
          onClick={onReconsider}
          className={cn(PILL_PRIMARY, 'px-6')}
        >
          {t('enrollment.auto_increase_skip.turn_on')}
        </button>
      </div>
    </div>
  )
}
