import { Pause, Play, X } from 'lucide-react'

export interface AutoIncreaseSkipPanelProps {
  planDisplayName: string
  contributionPercent: number
  missedSavingsAmount: number
  onReconsider: () => void
  onContinueWithout: () => void
  /** Optional dismiss (e.g. modal backdrop / close control) */
  onDismiss?: () => void
  showDismissButton?: boolean
}

/**
 * Shared layout for “no auto increase” messaging — matches enrollment design tokens
 * and supports light / dark surfaces (pass surface classes on the parent when used as a page).
 */
export function AutoIncreaseSkipPanel({
  planDisplayName,
  contributionPercent,
  missedSavingsAmount,
  onReconsider,
  onContinueWithout,
  onDismiss,
  showDismissButton = false,
}: AutoIncreaseSkipPanelProps) {
  const formatted = missedSavingsAmount.toLocaleString()

  return (
    <div
      className={`relative flex w-full flex-col ${showDismissButton ? 'pt-0.5 pr-9 sm:pr-10' : ''}`}
    >
      {showDismissButton && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-0 top-0 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:hover:bg-gray-800 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-gray-800">
          <Pause className="h-7 w-7 text-slate-500 dark:text-slate-400" strokeWidth={2} aria-hidden />
        </div>

        <h2
          id="auto-increase-skip-title"
          className="text-balance text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl"
        >
          No Auto Increase Configured
        </h2>

        <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Your {planDisplayName} contribution rate will stay at {contributionPercent}%. You can always enable auto
          increase later from your plan settings.
        </p>
      </div>

      <div
        className="mt-5 rounded-xl border border-rose-200/90 bg-rose-50/90 p-4 text-left dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
        aria-labelledby="auto-increase-skip-alert-title"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60">
            <X className="h-4 w-4 text-red-600 dark:text-red-300" strokeWidth={2.5} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p
              id="auto-increase-skip-alert-title"
              className="text-sm font-bold text-red-800 dark:text-red-200"
            >
              Potential Missed Savings
            </p>
            <p className="mt-2 text-sm leading-relaxed text-red-700 dark:text-red-200/95">
              By skipping, you will be losing{' '}
              <span className="font-bold text-red-600 dark:text-red-100">${formatted}</span> in potential retirement
              savings over 10 years.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <button
          type="button"
          onClick={onReconsider}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 dark:from-emerald-600 dark:via-teal-600 dark:to-sky-600 dark:focus-visible:ring-sky-500/70"
        >
          <Play className="h-4 w-4 shrink-0 text-white" strokeWidth={2.25} aria-hidden />
          Reconsider Auto Increase
        </button>

        <button
          type="button"
          onClick={onContinueWithout}
          className="text-center text-sm font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-700 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-slate-200 sm:max-w-[14rem] sm:text-right"
        >
          Click Continue to proceed without it
        </button>
      </div>
    </div>
  )
}
