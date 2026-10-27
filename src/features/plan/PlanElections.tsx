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

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      {optedOut && (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <span>{t('plan.opt.banner')}</span>
          <Link to="/enrollment/quick" className="font-semibold underline">{t('plan.opt.reenroll')}</Link>
        </div>
      )}
      <div role="tablist" aria-label={t('plan.tabs_label')} className="mb-5 flex gap-1 border-b border-gray-100 dark:border-gray-800">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`plan-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="plan-tabpanel"
            onClick={() => setTab(id)}
            className={cn('-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', tab === id ? 'border-blue-600 text-blue-700 dark:text-blue-300' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200')}
          >
            {t(`plan.tab_${id}`)}
          </button>
        ))}
      </div>
      <div id="plan-tabpanel" role="tabpanel" aria-labelledby={`plan-tab-${tab}`}>
        {tab === 'deferrals' && <DeferralPanel />}
        {tab === 'investments' && <InvestmentsPanel />}
        {tab === 'history' && <HistoryPanel />}
      </div>
    </section>
  )
}
