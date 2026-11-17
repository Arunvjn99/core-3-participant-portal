import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useElectionsStore } from './electionsStore'
import { DeferralPanel } from './DeferralPanel'
import { InvestmentsPanel } from './InvestmentsPanel'
import { HistoryPanel } from './HistoryPanel'

const TABS = ['deferrals', 'investments', 'history'] as const
type Tab = (typeof TABS)[number]

/** Deferrals, investments and change history for the participant's plan, with editing. */
export function PlanElections() {
  const { t } = useTranslation()
  const optedOut = useElectionsStore((s) => s.optedOut)
  const seed = useElectionsStore((s) => s.seed)
  const [tab, setTab] = useState<Tab>('deferrals')

  useEffect(() => {
    seed()
  }, [seed])

  // Tabs follow the usual keyboard pattern: arrow keys move between them, Home and End jump to the ends
  const onTabKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.indexOf(tab)
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1
    if (next < 0) return
    e.preventDefault()
    setTab(TABS[next])
    document.getElementById(`plan-tab-${TABS[next]}`)?.focus()
  }

  return (
    <section className="rounded-[20px] bg-surface-card p-5 shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 sm:p-6 dark:ring-white/10">
      {optedOut && (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-[14px] text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/25">
          <span>{t('plan.opt.banner')}</span>
          <Link to="/enrollment/quick" className="rounded font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t('plan.opt.reenroll')}</Link>
        </div>
      )}
      {/* Segmented tabs, the same pill look as the dashboard's controls */}
      <div role="tablist" aria-label={t('plan.tabs_label')} className="mb-5 flex w-full gap-1 rounded-full bg-slate-100 p-1 sm:inline-flex sm:w-auto dark:bg-white/5">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`plan-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="plan-tabpanel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            onKeyDown={onTabKey}
            className={cn(
              'h-9 min-w-0 flex-1 whitespace-nowrap rounded-full px-2 text-[13px] font-semibold transition-colors sm:flex-none sm:px-4 sm:text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              tab === id
                ? 'bg-white text-[#0B1533] shadow-[0_6px_14px_-8px_rgba(11,21,51,0.4)] ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-white/15'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
            )}
          >
            {t(`plan.tab_${id}`)}
          </button>
        ))}
      </div>
      <div id="plan-tabpanel" role="tabpanel" aria-labelledby={`plan-tab-${tab}`} tabIndex={0} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {tab === 'deferrals' && <DeferralPanel />}
        {tab === 'investments' && <InvestmentsPanel />}
        {tab === 'history' && <HistoryPanel />}
      </div>
    </section>
  )
}
