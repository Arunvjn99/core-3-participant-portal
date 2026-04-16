import { AlertTriangle, ArrowRight, TrendingUp, X } from 'lucide-react'

export interface AutoIncreaseSkipPanelProps {
  /** Estimated balance in 10 years without automatic increases */
  projectedWithout: number
  /** Estimated balance in 10 years with automatic increases */
  projectedWith: number
  /** Difference (with − without), shown in the alert */
  missedSavingsAmount: number
  onReconsider: () => void
  onContinueWithout: () => void
  /** Optional dismiss (e.g. modal backdrop / close control) */
  onDismiss?: () => void
  showDismissButton?: boolean
}

/** Shared height for the top row so “Recommended” lines up with the neutral card’s spacer */
const BADGE_ROW_H = 'min-h-[26px]'

export function AutoIncreaseSkipPanel({
  projectedWithout,
  projectedWith,
  missedSavingsAmount,
  onReconsider,
  onContinueWithout,
  onDismiss,
  showDismissButton = false,
}: AutoIncreaseSkipPanelProps) {
  const missed = missedSavingsAmount.toLocaleString()
  const without = projectedWithout.toLocaleString()
  const withAmt = projectedWith.toLocaleString()

  return (
    <div className="relative flex w-full flex-col">
      {/* Header: icon + title left, close in flow (avoids overlap with title) */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50">
            <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" strokeWidth={2.25} aria-hidden />
          </div>
          <h2
            id="auto-increase-skip-title"
            className="min-w-0 flex-1 pt-1 text-left text-lg font-bold leading-snug tracking-tight text-gray-900 dark:text-white sm:text-xl"
          >
            Skip automatic increases?
          </h2>
        </div>
        {showDismissButton && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      {/* Comparison: equal-width columns, stretch heights, aligned baselines */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
        <div className="flex min-h-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800/50">
          <div className={`flex ${BADGE_ROW_H} shrink-0 items-center`} aria-hidden />
          <p className="text-left text-sm font-medium leading-snug text-gray-500 dark:text-gray-400">
            — Without Auto Increase
          </p>
          <p className="mt-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
            Est. savings in 10 years
          </p>
          <p className="mt-1 text-left text-2xl font-bold tabular-nums leading-none text-gray-700 dark:text-gray-300">
            ${without}
          </p>
        </div>

        <div className="flex min-h-0 flex-col rounded-2xl border-2 border-green-500 bg-white p-4 dark:bg-gray-800/50">
          <div className={`flex ${BADGE_ROW_H} shrink-0 items-center`}>
            <span className="inline-flex rounded-full bg-green-600 px-2.5 py-0.5 text-[11px] font-semibold leading-none text-white shadow-sm">
              Recommended
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-left text-sm font-semibold leading-snug text-green-600 dark:text-green-400">
            <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
            <span>With Auto Increase</span>
          </div>
          <p className="mt-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
            Est. savings in 10 years
          </p>
          <p className="mt-1 text-left text-2xl font-bold tabular-nums leading-none text-green-600 dark:text-green-400">
            ${withAmt}
          </p>
        </div>
      </div>

      <div
        className="mt-5 rounded-xl border border-red-200/90 bg-red-50 p-4 text-left dark:border-red-900/50 dark:bg-red-950/35"
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
          className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
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
