import { useTranslation } from 'react-i18next'
import { Card } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'

type ResumeWhereYouLeftOffProps = {
  /** 0–100 */
  progressPct: number
  onResume: () => void
}

/**
 * V1-style single draft row: title, step progress %, bar, Resume (right-aligned on desktop).
 */
export function ResumeWhereYouLeftOff({ progressPct, onResume }: ResumeWhereYouLeftOffProps) {
  const { t } = useTranslation()
  const w = `${Math.min(100, Math.max(0, progressPct))}%`

  return (
    <Card padding="md" className="rounded-lg border border-border-default">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-text-primary">{t('transactions.resume_loan_application')}</h3>
          <p className="mt-1 text-sm text-text-secondary">{t('transactions.resume_progress', { pct: progressPct })}</p>
          <div
            className="mt-3 h-2 w-full max-w-md overflow-hidden rounded bg-primary/15 dark:bg-primary/25"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded bg-primary transition-[width] duration-300" style={{ width: w }} />
          </div>
        </div>
        <div className="flex shrink-0 justify-end sm:pb-0.5">
          <Button type="button" variant="primary" size="md" onClick={onResume}>
            {t('transactions.resume_button')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
