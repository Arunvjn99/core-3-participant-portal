import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import type { TransactionTimeline as Timeline } from './timeline'

/** `ns` is the i18n namespace holding `stage.*` and `detail.*` labels (transactions use `tracking`). */
export function TransactionTimeline({ timeline, ns = 'tracking' }: { timeline: Timeline; ns?: string }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(locale, { month: 'short', day: 'numeric' })

  return (
    <ol className="relative space-y-4">
      {timeline.steps.map((step, i) => {
        const last = i === timeline.steps.length - 1
        return (
          <li key={step.key} className="relative flex gap-3" aria-current={step.state === 'current' ? 'step' : undefined}>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-4px)] w-0.5',
                  step.state === 'done' ? 'bg-status-success' : 'bg-border-default',
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                'relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                step.state === 'done' && 'border-status-success bg-status-success text-white',
                step.state === 'current' && 'border-primary bg-surface-card',
                step.state === 'upcoming' && 'border-border-default bg-surface-card',
              )}
            >
              {step.state === 'done' ? (
                <Check className="h-3.5 w-3.5" />
              ) : step.state === 'current' ? (
                <span className="h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p
                  className={cn(
                    'text-[13px]',
                    step.state === 'upcoming' ? 'text-text-muted' : 'font-semibold text-text-primary',
                  )}
                >
                  {t(`${ns}.stage.${step.key}`)}
                </p>
                <p className="text-[11px] text-text-muted">
                  {step.state === 'upcoming' ? t('tracking.expected_on', { date: fmt(step.at) }) : fmt(step.at)}
                </p>
              </div>
              {step.state === 'current' && step.detailKey && (
                <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">
                  {t(`${ns}.detail.${step.detailKey}`)}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default TransactionTimeline
