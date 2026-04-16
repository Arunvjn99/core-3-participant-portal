import { ArrowRight, Pause, X } from 'lucide-react'
import { useEnrollment } from '@/core/hooks/useEnrollment'

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
  const missed = missedSavingsAmount.toLocaleString()
  const { data } = useEnrollment()
  const planLabel = data.plan === 'traditional' ? 'Traditional 401(k)' : 'Roth 401(k)'
  const rate = data.contributionPercent

  return (
    <div className="relative flex w-full flex-col">
      {showDismissButton && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-0 top-0 z-10 shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Close"
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
          No Auto Increase Configured
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Your {planLabel} contribution rate will stay at {rate}%. You can always enable auto increase later from your
          plan settings.
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
              Potential Missed Savings
            </p>
            <p className="mt-2 text-sm leading-relaxed text-red-700 dark:text-red-200/95">
              By skipping, you will be losing{' '}
              <span className="font-bold text-red-600 dark:text-red-100">${missed}</span> in potential retirement
              savings over 10 years.
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
          Reconsider Auto Increase
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>

        <p className="text-center text-sm leading-normal text-gray-500 dark:text-gray-400">
          Tap{' '}
          <button
            type="button"
            onClick={onContinueWithout}
            className="font-medium text-gray-600 underline decoration-gray-400 underline-offset-2 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            here
          </button>{' '}
          to skip this step
        </p>
      </div>
    </div>
  )
}
