import { Card } from '../../../design-system/components/Card'
import { Badge } from '../../../design-system/components/Badge'
import { formatCurrency, formatDate } from '../../../lib/utils'
import type { BadgeProps } from '../../../design-system/components/Badge'

interface TransactionSummaryProps {
  type: string
  amount: number
  fromAccount?: string
  toAccount?: string
  estimatedDate?: string
  status?: 'pending' | 'completed' | 'failed'
}

const statusVariant: Record<string, BadgeProps['variant']> = {
  pending: 'warning',
  completed: 'success',
  failed: 'danger',
}

export function TransactionSummary({
  type,
  amount,
  fromAccount,
  toAccount,
  estimatedDate,
  status = 'pending',
}: TransactionSummaryProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">{type} Summary</h3>
        <Badge variant={statusVariant[status]}>{status}</Badge>
      </div>
      <dl className="flex flex-col gap-3">
        <div className="flex justify-between">
          <dt className="text-sm text-text-muted">Amount</dt>
          <dd className="text-sm font-semibold text-text-primary">{formatCurrency(amount)}</dd>
        </div>
        {fromAccount && (
          <div className="flex justify-between">
            <dt className="text-sm text-text-muted">From</dt>
            <dd className="text-sm text-text-primary">{fromAccount}</dd>
          </div>
        )}
        {toAccount && (
          <div className="flex justify-between">
            <dt className="text-sm text-text-muted">To</dt>
            <dd className="text-sm text-text-primary">{toAccount}</dd>
          </div>
        )}
        {estimatedDate && (
          <div className="flex justify-between">
            <dt className="text-sm text-text-muted">Estimated date</dt>
            <dd className="text-sm text-text-primary">{formatDate(estimatedDate)}</dd>
          </div>
        )}
      </dl>
    </Card>
  )
}

export default TransactionSummary
