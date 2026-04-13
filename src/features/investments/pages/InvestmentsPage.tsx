import { useState } from 'react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { TrendingUp, PieChart, RefreshCw } from 'lucide-react'

const TABS = [
  { key: 'portfolio', label: 'Portfolio', icon: PieChart },
  { key: 'performance', label: 'Performance', icon: TrendingUp },
  { key: 'rebalance', label: 'Rebalance', icon: RefreshCw },
] as const

type TabKey = typeof TABS[number]['key']

const FUNDS = [
  { name: 'Large Cap Growth', ticker: 'LCGF', allocation: 40, ytd: 12.4, oneYear: 18.2, color: '#3b82f6' },
  { name: 'Bond Index', ticker: 'BIDX', allocation: 30, ytd: 3.1, oneYear: 4.8, color: '#10b981' },
  { name: 'International Equity', ticker: 'INTL', allocation: 20, ytd: 8.7, oneYear: 11.3, color: '#f59e0b' },
  { name: 'Small Cap Value', ticker: 'SCVF', allocation: 10, ytd: -1.2, oneYear: 6.5, color: '#8b5cf6' },
]

export function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('portfolio')

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Investments</h1>

        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800 sm:inline-flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'portfolio' && <PortfolioTab />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'rebalance' && <RebalanceTab />}
        </div>
      </div>
    </AnimatedPage>
  )
}

function PortfolioTab() {
  const totalValue = 48250
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Portfolio Value</p>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">${totalValue.toLocaleString()}</p>
        <p className="mt-1 text-sm font-medium text-green-600">+$2,340 (5.1%) this year</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FUNDS.map((fund) => (
          <div key={fund.ticker} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{fund.name}</p>
                <p className="text-xs text-gray-400">{fund.ticker}</p>
              </div>
              <span className="text-lg font-bold" style={{ color: fund.color }}>{fund.allocation}%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div className="h-full rounded-full transition-all" style={{ width: `${fund.allocation}%`, backgroundColor: fund.color }} />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Value: ${Math.round(totalValue * fund.allocation / 100).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PerformanceTab() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-5 py-3.5 text-left font-medium text-gray-500 dark:text-gray-400">Fund</th>
              <th className="px-5 py-3.5 text-right font-medium text-gray-500 dark:text-gray-400">Allocation</th>
              <th className="px-5 py-3.5 text-right font-medium text-gray-500 dark:text-gray-400">YTD</th>
              <th className="px-5 py-3.5 text-right font-medium text-gray-500 dark:text-gray-400">1 Year</th>
            </tr>
          </thead>
          <tbody>
            {FUNDS.map((fund) => (
              <tr key={fund.ticker} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-gray-900 dark:text-white">{fund.name}</p>
                  <p className="text-xs text-gray-400">{fund.ticker}</p>
                </td>
                <td className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-300">{fund.allocation}%</td>
                <td className={`px-5 py-3.5 text-right font-medium ${fund.ytd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fund.ytd >= 0 ? '+' : ''}{fund.ytd}%
                </td>
                <td className={`px-5 py-3.5 text-right font-medium ${fund.oneYear >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fund.oneYear >= 0 ? '+' : ''}{fund.oneYear}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RebalanceTab() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Rebalance Portfolio</h2>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">Adjust your target allocations below.</p>
      <div className="space-y-5">
        {FUNDS.map((fund) => (
          <div key={fund.ticker}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fund.name}</span>
              <span className="text-sm font-semibold" style={{ color: fund.color }}>{fund.allocation}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={fund.allocation}
              className="w-full"
              style={{ color: fund.color }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Submit Rebalance Request
      </button>
    </div>
  )
}

export default InvestmentsPage
