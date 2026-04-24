import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/design-system/components/Button'
import { cn } from '@/lib/cn'

type AttentionDef = {
  id: string
  titleKey: string
  descKey: string
  amount?: string
  actionKey: string
}

const ATTENTION_DEFS: AttentionDef[] = [
  {
    id: 'loan-docs',
    titleKey: 'attention.loan_title',
    descKey: 'attention.loan_detail',
    amount: '$5,000',
    actionKey: 'attention.resolve',
  },
  {
    id: 'withdrawal-verify',
    titleKey: 'attention.withdrawal_title',
    descKey: 'attention.withdrawal_detail',
    amount: '$2,500',
    actionKey: 'attention.review',
  },
]

interface AttentionRequiredTimelineProps {
  onResolve?: () => void
}

/**
 * Warning-style alert cards: title, description, amount, primary CTA.
 */
function AttentionRequiredTimeline({ onResolve }: AttentionRequiredTimelineProps) {
  const { t } = useTranslation()

  const items = useMemo(
    () =>
      ATTENTION_DEFS.map((def) => ({
        ...def,
        onAction: onResolve,
      })),
    [onResolve]
  )

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-text-muted">{t('attention.no_action')}</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.2 }}
          className={cn(
            'rounded-lg border p-4',
            'border-status-warning bg-status-warning-bg',
            'dark:border-amber-800/60 dark:bg-amber-950/30'
          )}
        >
          <div className="flex gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-status-warning/15 text-status-warning dark:bg-amber-900/40 dark:text-amber-300"
              aria-hidden
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text-primary">{t(item.titleKey)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{t(item.descKey)}</p>
              {item.amount ? (
                <p className="mt-2 text-sm font-semibold text-text-primary">
                  {t('attention.amount_prefix', { amount: item.amount })}
                </p>
              ) : null}
              {item.onAction ? (
                <div className="mt-3 flex justify-end border-t border-status-warning/40 pt-3 dark:border-amber-800/50">
                  <Button type="button" variant="primary" size="sm" onClick={item.onAction}>
                    {t(item.actionKey)}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default AttentionRequiredTimeline
