import PortfolioSnapshot from '../components/PortfolioSnapshot'
import PortfolioPerformance from '../components/PortfolioPerformance'
import PortfolioAllocation from '../components/PortfolioAllocation'
import RetirementPlanning from '../components/RetirementPlanning'
import RecommendedActions from '../components/RecommendedActions'

export default function InvestmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">Investment Portfolio</p>
              <h1 className="text-gray-900 dark:text-white text-2xl font-bold">Your Investments</h1>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
