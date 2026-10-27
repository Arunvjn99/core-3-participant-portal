import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export interface SummaryRow {
  key: string
  label: string
  /** Undefined while the agent is still working it out */
  value?: string
  /** Shown on wide screens only, to keep the summary small on phones */
  secondary?: boolean
}

/**
 * A small summary that fills in as the agent learns and decides things. Values that change briefly highlight.
 * Floats at the side on wide screens and sits at the top on narrow ones.
 */
export function SummaryCard({ rows, sample, progress }: { rows: SummaryRow[]; sample: boolean; progress?: { done: number; total: number } }) {
  const { t } = useTranslation()
  return (
    <aside aria-label={t('enrollment.flow.summary_title')} className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <div className="flex items-center justify-between gap-2">
        <p className="text-slate-900 dark:text-white" style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t('enrollment.flow.summary_title')}</p>
        {sample && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-gray-800 dark:text-gray-400" style={{ fontSize: '0.68rem', fontWeight: 600 }}>{t('enrollment.agent.summary.sample_badge')}</span>}
      </div>
      {progress && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800" role="progressbar" aria-label={t('enrollment.chat.progress_label')} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
            <motion.div className="h-full rounded-full bg-blue-600" initial={false} animate={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-slate-500 dark:text-gray-400" style={{ fontSize: '0.78rem' }}>{t('enrollment.chat.progress', { done: progress.done, total: progress.total })}</p>
        </div>
      )}
      <dl className="mt-3 space-y-2.5" aria-live="polite">
        {rows.map((r) => (
          <div key={r.key} className={cn('items-baseline justify-between gap-3', r.secondary ? 'hidden lg:flex' : 'flex')}>
            <dt className="text-slate-500 dark:text-gray-400" style={{ fontSize: '0.82rem' }}>{r.label}</dt>
            <dd className="min-w-0 text-right" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              <AnimatePresence mode="wait" initial={false}>
                {r.value ? (
                  <motion.span
                    key={r.value}
                    initial={{ opacity: 0, backgroundColor: 'rgba(37,99,235,0.14)' }}
                    animate={{ opacity: 1, backgroundColor: 'rgba(37,99,235,0)' }}
                    transition={{ duration: 0.9 }}
                    className="-mx-1 rounded px-1 text-slate-900 dark:text-white"
                  >
                    {r.value}
                  </motion.span>
                ) : (
                  <span key="pending" className={cn('inline-block h-3 w-16 animate-pulse rounded bg-slate-100 align-middle dark:bg-gray-800')} aria-label={t('enrollment.flow.pending')} />
                )}
              </AnimatePresence>
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
