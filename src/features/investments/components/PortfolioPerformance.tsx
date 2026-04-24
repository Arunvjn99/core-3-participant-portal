import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts'

const timeRanges: Record<string, { data: { date: string; portfolio: number; sp500: number }[] }> = {
  '1M': {
    data: [
      { date: 'Feb 16', portfolio: 278.2, sp500: 276.8 },
      { date: 'Feb 23', portfolio: 280.1, sp500: 278.3 },
      { date: 'Mar 2', portfolio: 282.5, sp500: 279.9 },
      { date: 'Mar 9', portfolio: 285.1, sp500: 282.4 },
      { date: 'Mar 16', portfolio: 287.5, sp500: 284.1 },
    ],
  },
  '3M': {
    data: [
      { date: 'Dec', portfolio: 265.3, sp500: 264.1 },
      { date: 'Jan', portfolio: 272.8, sp500: 271.2 },
      { date: 'Feb', portfolio: 278.2, sp500: 276.8 },
      { date: 'Mar', portfolio: 287.5, sp500: 284.1 },
    ],
  },
  YTD: {
    data: [
      { date: 'Jan', portfolio: 256.0, sp500: 255.2 },
      { date: 'Feb', portfolio: 265.3, sp500: 264.1 },
      { date: 'Mar', portfolio: 287.5, sp500: 284.1 },
    ],
  },
  '1Y': {
    data: [
      { date: "Mar '25", portfolio: 224.0, sp500: 226.3 },
      { date: 'May', portfolio: 232.5, sp500: 233.8 },
      { date: 'Jul', portfolio: 241.2, sp500: 240.5 },
      { date: 'Sep', portfolio: 248.9, sp500: 247.2 },
      { date: 'Nov', portfolio: 256.0, sp500: 253.8 },
      { date: "Jan '26", portfolio: 272.8, sp500: 271.2 },
      { date: 'Mar', portfolio: 287.5, sp500: 284.1 },
    ],
  },
  '5Y': {
    data: [
      { date: '2021', portfolio: 118.0, sp500: 122.0 },
      { date: '2022', portfolio: 142.5, sp500: 138.0 },
      { date: '2023', portfolio: 178.0, sp500: 172.0 },
      { date: '2024', portfolio: 224.0, sp500: 226.3 },
      { date: '2025', portfolio: 256.0, sp500: 253.8 },
      { date: '2026', portfolio: 287.5, sp500: 284.1 },
    ],
  },
}

const tabs = Object.keys(timeRanges)

function PortfolioPerformance() {
  const { t } = useTranslation()
  const [activeRange, setActiveRange] = useState('1Y')
  const currentData = timeRanges[activeRange].data

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-gray-900 dark:text-white">{t('investments.performance_title')}</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t('investments.performance_subtitle')}</p>
        </div>
        <div className="flex gap-1 self-start rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveRange(tab)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${
                activeRange === tab
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 240, minHeight: 240, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={currentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Line type="monotone" dataKey="portfolio" stroke="#3b82f6" strokeWidth={2} dot={false} name={t('investments.performance_portfolio')} />
            <Line type="monotone" dataKey="sp500" stroke="#9ca3af" strokeWidth={2} strokeDasharray="4 4" dot={false} name={t('investments.performance_benchmark')} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">{t('investments.performance_indexed')}</p>
    </div>
  )
}

export default PortfolioPerformance
