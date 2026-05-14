import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../design-system/components/Card'
import { Badge } from '../../../design-system/components/Badge'
import { formatCurrency } from '../../../lib/utils'

const ALLOCATION = [
  { name: 'US Equity', pct: 45, color: '#0052CC' }, // closest: --chart-blue
  { name: 'Intl Equity', pct: 20, color: '#4C9AFF' }, // closest: --chart-blue variant
  { name: 'Bonds', pct: 25, color: '#0747A6' }, // closest: --chart-blue dark
  { name: 'Stable Value', pct: 10, color: '#6B778C' }, // closest: --chart-gray
]

const chartData = ALLOCATION.map((a) => ({ name: a.name, value: a.pct }))

export function PortfolioSummary() {
  const totalValue = 128_450.75
  const ytdReturn = 7.43
  const isPositive = ytdReturn >= 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Summary</CardTitle>
          <Badge variant={isPositive ? 'success' : 'danger'}>
            {isPositive ? '+' : ''}
            {ytdReturn}% YTD
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {ALLOCATION.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0)}%`, 'Allocation']}
                  contentStyle={{
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-status-success" />
              ) : (
                <TrendingDown className="h-6 w-6 text-status-danger" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalValue)}</p>
            <p className="mt-0.5 text-sm text-text-muted">Total portfolio value</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {ALLOCATION.map((seg) => (
                <div key={seg.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                    {seg.name}
                  </span>
                  <span className="font-medium text-text-primary">{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PortfolioSummary
