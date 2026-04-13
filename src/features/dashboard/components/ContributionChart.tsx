import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { staggerItem } from '../../../design-system/motion/variants'

const mockData = [
  { month: 'Jan', employee: 800, employer: 400 },
  { month: 'Feb', employee: 800, employer: 400 },
  { month: 'Mar', employee: 850, employer: 425 },
  { month: 'Apr', employee: 800, employer: 400 },
  { month: 'May', employee: 900, employer: 450 },
  { month: 'Jun', employee: 800, employer: 400 },
]

export function ContributionChart() {
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle>Monthly contributions</CardTitle>
        </CardHeader>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border-default opacity-60" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`$${Number(value ?? 0)}`, '']}
              />
              <Legend />
              <Bar dataKey="employee" name="Employee" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="employer" name="Employer match" fill="var(--color-primary-subtle)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  )
}

export default ContributionChart
