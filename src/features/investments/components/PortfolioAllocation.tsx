import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

function PortfolioAllocation() {
  const { t } = useTranslation()

  const allocationData = [
    {
      groupKey: 'investments.allocation_growth' as const,
      percentage: 55,
      color: 'var(--chart-blue)', // #3b82f6
      items: ['US Large Cap (35%)', "Int'l Stocks (12%)", 'Small Cap (8%)'],
    },
    {
      groupKey: 'investments.allocation_income' as const,
      percentage: 30,
      color: 'var(--chart-purple)', // #8b5cf6 (brand-purple-light)
      items: ['Investment Grade Bonds (18%)', 'TIPS (7%)', 'High Yield (5%)'],
    },
    {
      groupKey: 'investments.allocation_defensive' as const,
      percentage: 15,
      color: 'var(--chart-cyan)', // #06b6d4
      items: ['Money Market (8%)', 'Stable Value (5%)', 'Cash (2%)'],
    },
  ]

  const pieData = allocationData.map((d) => ({ name: t(d.groupKey), value: d.percentage, color: d.color }))

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <h3 className="mb-1 text-gray-900 dark:text-white">{t('investments.allocation_title')}</h3>
      <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">{t('investments.allocation_subtitle')}</p>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative shrink-0" style={{ width: 160, height: 160, minHeight: 160, minWidth: 160 }}>
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>
              3
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{t('investments.allocation_classes')}</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-4">
          {allocationData.map((group) => (
            <div key={group.groupKey}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                  <span className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 500 }}>
                    {t(group.groupKey)}
                  </span>
                </div>
                <span className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>
                  {group.percentage}%
                </span>
              </div>
              <div className="mb-1.5 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${group.percentage}%`, backgroundColor: group.color }}
                />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {group.items.map((item) => (
                  <span key={item} className="text-[11px] text-gray-400">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PortfolioAllocation
