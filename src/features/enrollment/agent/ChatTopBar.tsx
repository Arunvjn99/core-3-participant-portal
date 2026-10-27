import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The chat's header: who the participant is talking to, what the agent is doing, and a pill with the current
 * plan that opens the full summary. Stays at the top of the screen as the conversation scrolls.
 */
export function ChatTopBar({
  thinking,
  pill,
  summaryOpen,
  onSummaryOpen,
  summary,
}: {
  thinking: boolean
  /** Short plan line for the pill, e.g. "6% · $425/pay"; hidden until there's a plan */
  pill?: string
  summaryOpen: boolean
  onSummaryOpen: (open: boolean) => void
  /** The full summary, shown when the pill is opened */
  summary?: React.ReactNode
}) {
  const { t } = useTranslation()
  const wrapRef = useRef<HTMLDivElement>(null)

  // Escape or a click elsewhere closes the summary
  useEffect(() => {
    if (!summaryOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSummaryOpen(false)
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onSummaryOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [summaryOpen, onSummaryOpen])

  return (
    <div ref={wrapRef} className="sticky top-0 z-30 -mx-4 -mt-6 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25" aria-hidden>
          <Sparkles className="h-5 w-5" />
          <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-950', thinking ? 'animate-pulse bg-amber-400' : 'bg-emerald-500')} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-slate-900 dark:text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            {t('enrollment.agent.title_short')}
          </h1>
          <p className="truncate text-slate-500 dark:text-gray-400" style={{ fontSize: '0.82rem' }} aria-live="polite">
            {thinking ? t('enrollment.agent.status_thinking') : t('enrollment.agent.status_online')}
          </p>
        </div>
        {pill && (
          <button
            type="button"
            onClick={() => onSummaryOpen(!summaryOpen)}
            aria-expanded={summaryOpen}
            aria-controls="chat-summary"
            className={cn(
              'inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-3.5 transition-colors',
              summaryOpen
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
            )}
            style={{ fontSize: '0.9rem', fontWeight: 600 }}
          >
            <span className="tabular-nums">{pill}</span>
            <span className={cn('hidden sm:inline', summaryOpen ? 'text-blue-100' : 'text-slate-400')}>·</span>
            <span className="hidden sm:inline">{t('enrollment.agent.summary_pill')}</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', summaryOpen && 'rotate-180')} aria-hidden />
          </button>
        )}
      </div>

      <AnimatePresence>
        {summaryOpen && summary && (
          <motion.div
            id="chat-summary"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-4 top-[calc(100%+8px)] w-[min(420px,calc(100vw-2rem))] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl shadow-2xl sm:right-6 lg:right-[max(1.5rem,calc((100%-48rem)/2))]"
          >
            {summary}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
