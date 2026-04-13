import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'

const FUNDS = [
  { name: 'Target Date 2050', pct: 30, color: '#0052CC' },
  { name: 'US Equity Index', pct: 25, color: '#4C9AFF' },
  { name: 'International Equity', pct: 20, color: '#0747A6' },
  { name: 'Bond Index', pct: 15, color: '#DEEBFF' },
  { name: 'Stable Value', pct: 10, color: '#6B778C' },
]

const chartData = FUNDS.map((f) => ({ name: f.name, value: f.pct }))

export function AllocationChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fund Allocation</CardTitle>
      </CardHeader>
      <div className="mt-2 flex flex-col items-center gap-6 lg:flex-row">
        <div className="h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
              >
                {FUNDS.map((f) => (
                  <Cell key={f.name} fill={f.color} stroke="var(--surface-card)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0)}%`, 'Share']}
                contentStyle={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {FUNDS.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 truncate text-sm text-text-secondary">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: f.color }} />
                <span className="truncate">{f.name}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-text-primary">{f.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

export default AllocationChart
