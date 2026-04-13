import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { Card } from '../../../design-system/components/Card'
import { Badge } from '../../../design-system/components/Badge'
import { staggerItem } from '../../../design-system/motion/variants'
import { formatCurrency } from '../../../lib/utils'

interface AccountSummaryCardProps {
  balance: number
  changePercent: number
  changeAmount: number
  planName: string
}

export function AccountSummaryCard({ balance, changePercent, changeAmount, planName }: AccountSummaryCardProps) {
  const isPositive = changePercent >= 0

  return (
    <motion.div variants={staggerItem}>
      <Card className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">Total Account Balance</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{formatCurrency(balance)}</p>
          </div>
          <Badge variant={isPositive ? 'success' : 'danger'}>
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className={`h-4 w-4 ${isPositive ? 'text-status-success' : 'text-status-danger'}`} />
          <span className={isPositive ? 'text-status-success' : 'text-status-danger'}>
            {isPositive ? '+' : ''}{formatCurrency(changeAmount)} this year
          </span>
        </div>

        <div className="border-t border-border-default pt-3">
          <p className="text-xs text-text-muted">Plan</p>
          <p className="text-sm font-medium text-text-primary mt-0.5">{planName}</p>
        </div>
      </Card>
    </motion.div>
  )
}

export default AccountSummaryCard
