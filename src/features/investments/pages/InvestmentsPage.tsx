import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getAppDateLocale } from '@/lib/dateLocale'
import PortfolioSnapshot from '../components/PortfolioSnapshot'
import PortfolioPerformance from '../components/PortfolioPerformance'
import PortfolioAllocation from '../components/PortfolioAllocation'
import RetirementPlanning from '../components/RetirementPlanning'
import RecommendedActions from '../components/RecommendedActions'

export default function InvestmentsPage() {
  const { t, i18n } = useTranslation()

  const updatedLabel = useMemo(() => {
    const date = new Date()
    const formatted = date.toLocaleDateString(getAppDateLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
    return t('investments.page_updated', { date: formatted })
  }, [t, i18n.language])

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-0.5 text-sm text-gray-500 dark:text-gray-400">{t('investments.page_kicker')}</p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('investments.page_heading')}</h1>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{updatedLabel}</p>
          </div>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <PortfolioSnapshot />
          <PortfolioPerformance />
          <PortfolioAllocation />
          <RetirementPlanning />
          <RecommendedActions />
        </div>
      </div>
    </div>
  )
}

export { InvestmentsPage }
