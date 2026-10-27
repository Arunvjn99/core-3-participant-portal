import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { PlanFundsTable } from '@/features/plan/PlanFundsTable'
import { AssetClassPerformance } from '@/features/portfolio/AssetClassPerformance'
import { PortfolioInvestmentsTable } from '@/features/portfolio/PortfolioInvestmentsTable'
import { SdbPanel } from '@/features/portfolio/SdbPanel'
import PortfolioSnapshot from '../components/PortfolioSnapshot'
import PortfolioPerformance from '../components/PortfolioPerformance'
import PortfolioAllocation from '../components/PortfolioAllocation'
import RetirementPlanning from '../components/RetirementPlanning'
import RecommendedActions from '../components/RecommendedActions'

const TABS = ['portfolio', 'plan', 'sdb'] as const
type Tab = (typeof TABS)[number]

export default function InvestmentsPage() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: Tab = TABS.includes(requested as Tab) ? (requested as Tab) : 'portfolio'

  const updatedLabel = useMemo(() => {
    const date = new Date()
    const formatted = date.toLocaleDateString(getAppDateLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
    return t('investments.page_updated', { date: formatted })
  }, [t, i18n.language])

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 sm:mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-0.5 text-sm text-gray-500 dark:text-gray-400">{t('investments.page_kicker')}</p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('investments.page_heading')}</h1>
            </div>
            <div className="flex flex-col gap-1 sm:items-end">
              <div className="flex gap-4">
                <Link to="/account-summary" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{t('portfolio.view_summary')}</Link>
                <Link to="/fees" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{t('fees.view_report')}</Link>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">{updatedLabel}</p>
            </div>
          </div>

          <div role="tablist" aria-label={t('investments.page_heading')} className="mt-4 inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`inv-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="inv-panel"
                onClick={() => setParams(id === 'portfolio' ? {} : { tab: id }, { replace: true })}
                className={cn('rounded-lg px-3.5 py-2 text-sm font-medium transition-all', tab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white')}
              >
                {t(`portfolio.tab_${id}`)}
              </button>
            ))}
          </div>
        </div>

        <div id="inv-panel" role="tabpanel" aria-labelledby={`inv-tab-${tab}`} className="space-y-5 sm:space-y-6">
          {tab === 'portfolio' && (
            <>
              <PortfolioSnapshot />
              <AssetClassPerformance />
              <PortfolioInvestmentsTable />
              <PortfolioPerformance />
              <PortfolioAllocation />
              <RetirementPlanning />
              <RecommendedActions />
            </>
          )}
          {tab === 'plan' && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('plan.inv.plan_investments')}</h2>
              <p className="mb-4 mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t('portfolio.plan_tab_sub')}</p>
              <PlanFundsTable showHeading={false} />
            </section>
          )}
          {tab === 'sdb' && <SdbPanel />}
        </div>
      </div>
    </div>
  )
}

export { InvestmentsPage }
