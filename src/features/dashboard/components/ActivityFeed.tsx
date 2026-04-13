import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { Badge } from '../../../design-system/components/Badge'
import { staggerItem } from '../../../design-system/motion/variants'
import { formatDate, formatCurrency } from '../../../lib/utils'
import type { BadgeProps } from '../../../design-system/components/Badge'

interface Activity {
  id: string
  type: 'contribution' | 'distribution' | 'rebalance' | 'enrollment'
  description: string
  amount?: number
  date: string
  status: 'completed' | 'pending' | 'failed'
}

const mockActivities: Activity[] = [
  { id: '1', type: 'contribution', description: 'Employee contribution', amount: 800, date: '2026-04-01', status: 'completed' },
  { id: '2', type: 'contribution', description: 'Employer match', amount: 400, date: '2026-04-01', status: 'completed' },
  { id: '3', type: 'rebalance', description: 'Portfolio rebalanced', date: '2026-03-15', status: 'completed' },
  { id: '4', type: 'enrollment', description: 'Enrollment updated', date: '2026-03-01', status: 'completed' },
]

const statusVariant: Record<Activity['status'], BadgeProps['variant']> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
}

export function ActivityFeed() {
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <ul className="flex flex-col divide-y divide-border-default">
          {mockActivities.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-text-primary">{a.description}</p>
                <p className="text-xs text-text-muted">{formatDate(a.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                {a.amount && (
                  <span className="text-sm font-medium text-text-primary">
                    {formatCurrency(a.amount)}
                  </span>
                )}
                <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  )
}

export default ActivityFeed
