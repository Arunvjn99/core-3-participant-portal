import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, HandCoins, DollarSign, ArrowLeftRight, PieChart, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { buildTimeline, type TrackedTransaction } from './timeline'
import { useTrackedTransactions } from './useTrackedTransactions'
import { TransactionTimeline } from './TransactionTimeline'
import type { TrackedType } from './stages'

const ICONS: Record<TrackedType, typeof HandCoins> = {
  loan: HandCoins,
  withdrawal: DollarSign,
  transfer: ArrowLeftRight,
  rebalance: PieChart,
  rollover: RefreshCcw,
}

function TrackerCard({ tx, timeline, defaultOpen }: { tx: TrackedTransaction; timeline: ReturnType<typeof buildTimeline>; defaultOpen: boolean }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const [open, setOpen] = useState(defaultOpen)
  const Icon = ICONS[tx.type]
  const fmt = (ms: number) => new Date(ms).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  const current = timeline.steps[timeline.currentIndex]

  return (
    <div className="rounded-lg border border-border-default bg-surface-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-status-info-bg text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="text-[14px] font-semibold text-text-primary">{t(`tracking.type.${tx.type}`)}</span>
            {tx.amount !== undefined && (
              <span className="text-[13px] text-text-secondary">${tx.amount.toLocaleString(locale)}</span>
            )}
          </span>
          <span
            className={cn(
              'mt-0.5 block text-[12px] font-medium',
              timeline.complete ? 'text-status-success' : 'text-primary',
            )}
          >
            {t(`tracking.stage.${current.key}`)}
            <span className="font-normal text-text-secondary">
              {' · '}
              {timeline.complete
                ? t('tracking.completed_on', { date: fmt(timeline.expectedAt) })
                : t('tracking.expected_by', { date: fmt(timeline.expectedAt) })}
            </span>
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-border-default px-4 pb-4 pt-4">
          <p className="mb-3 text-[11px] text-text-muted">
            {t('tracking.submitted_on', { date: fmt(tx.submittedAt) })}
          </p>
          <TransactionTimeline timeline={timeline} />
        </div>
      )}
    </div>
  )
}

export function TransactionTracker() {
  const { t } = useTranslation()
  const rows = useTrackedTransactions()

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-text-muted">{t('tracking.empty')}</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ tx, timeline }, i) => (
        <TrackerCard key={tx.id} tx={tx} timeline={timeline} defaultOpen={i === 0} />
      ))}
    </div>
  )
}

export default TransactionTracker
