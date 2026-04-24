import { ArrowUpRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import {
  FINANCIAL_GUIDANCE_INSIGHTS,
  GUIDANCE_ICON_MAP,
  type FinancialGuidanceBadgeType,
} from '@/features/transactions/config/financialGuidanceInsights'

const BADGE_TYPE_CLASS: Record<FinancialGuidanceBadgeType, string> = {
  opportunity:
    'border border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300',
  warning:
    'border border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300',
  info: 'border border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300',
  positive:
    'border border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:text-emerald-200',
}

function guidanceGridClass(count: number) {
  return cn(
    'grid w-full min-w-0 gap-4 sm:gap-5',
    count <= 1 && 'grid-cols-1',
    count === 2 && 'grid-cols-1 sm:grid-cols-2',
    count === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    count >= 4 && 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  )
}

function FinancialGuidanceCompact() {
  const { t } = useTranslation()
  const items = FINANCIAL_GUIDANCE_INSIGHTS
  const base = 'transactions.guidance_insights'

  return (
    <div className={guidanceGridClass(items.length)} role="list">
      {items.map((def, idx) => {
        const Icon = GUIDANCE_ICON_MAP[def.iconKey]
        const itemKey = `${base}.items.${def.id}`
        const title = t(`${itemKey}.title`)
        const description = t(`${itemKey}.description`)
        const cta = t(`${itemKey}.cta`)
        const badge = t(`${base}.badges.${def.badgeType}`)

        return (
          <motion.article
            key={def.id}
            role="listitem"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.45, ease: 'easeOut' }}
            whileHover={{ y: -2 }}
            className={cn(
              'group relative flex min-h-0 min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-border-default',
              'bg-surface-card p-5 shadow-card transition-shadow duration-200',
              'hover:border-violet-500/35 hover:shadow-[0_8px_24px_rgba(139,92,246,0.12)]',
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, color-mix(in srgb, var(--color-primary) 4%, transparent) 100%)',
              }}
              aria-hidden
            />

            <div className="pointer-events-none absolute right-4 top-4 opacity-30 transition-opacity duration-200 group-hover:opacity-60">
              <Sparkles className="h-3 w-3 text-violet-500 dark:text-violet-400" aria-hidden />
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="mb-3.5 flex items-start justify-between gap-2">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-violet-500/25',
                    'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-md px-2.5 py-0.5 text-[10.5px] font-bold leading-tight',
                    BADGE_TYPE_CLASS[def.badgeType],
                  )}
                >
                  {badge}
                </span>
              </div>

              <h3 className="mb-1.5 text-sm font-bold tracking-[-0.3px] text-text-primary">{title}</h3>
              <p className="mb-4 flex-1 text-[13px] font-medium leading-relaxed text-text-secondary">
                {description}
              </p>

              <div className="mt-auto flex items-center text-[13px] font-semibold text-violet-600 transition-opacity group-hover:opacity-90 dark:text-violet-400">
                <span>{cta}</span>
                <ArrowUpRight
                  className="ml-1 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </div>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}

export default FinancialGuidanceCompact
