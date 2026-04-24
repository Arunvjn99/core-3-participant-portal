import { useTranslation } from 'react-i18next'
import { Card } from '@/design-system/components/Card'
import { cn } from '@/lib/cn'

export type TcRecentRow = {
  id: string
  description: string
  type: string
  amount: string
  status: string
  date: string
}

const DEMO_ROWS: TcRecentRow[] = [
  {
    id: '1',
    description: 'Reallocation from Conservative to Growth Fund',
    type: 'Transfer',
    amount: '$1,500',
    status: 'Completed',
    date: 'Mar 5, 2026',
  },
  {
    id: '2',
    description: 'General Purpose Loan — 12 month term',
    type: 'Loan',
    amount: '$2,000',
    status: 'Completed',
    date: 'Feb 28, 2026',
  },
  {
    id: '3',
    description: 'Hardship withdrawal for medical expenses',
    type: 'Withdrawal',
    amount: '$1,000',
    status: 'Completed',
    date: 'Feb 15, 2026',
  },
  {
    id: '4',
    description: 'In-service distribution request',
    type: 'Withdrawal',
    amount: '$500',
    status: 'Processing',
    date: 'Jan 5, 2026',
  },
]

function statusClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'completed') return 'text-status-success bg-status-success-bg'
  if (s === 'processing') return 'text-status-info bg-status-info-bg'
  return 'text-text-muted bg-surface-elevated'
}

/** V1-style recent activity table (fixed column order for Transaction Center). */
export function TransactionCenterRecentTable({ rows = DEMO_ROWS }: { rows?: TcRecentRow[] }) {
  const { t } = useTranslation()

  const headers: { labelKey: string }[] = [
    { labelKey: 'transactions.tc_col_description' },
    { labelKey: 'transactions.tc_col_type' },
    { labelKey: 'transactions.tc_col_amount' },
    { labelKey: 'transactions.tc_col_status' },
    { labelKey: 'transactions.tc_col_date' },
  ]

  return (
    <Card padding="none" className="overflow-hidden rounded-lg border border-border-default">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-elevated">
              {headers.map((h) => (
                <th
                  key={h.labelKey}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-secondary"
                >
                  {t(h.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border-default last:border-b-0">
                <td className="max-w-[220px] px-3 py-2.5 text-text-primary">{row.description}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-text-primary">{row.type}</td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-text-primary">{row.amount}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span
                    className={cn(
                      'inline-flex rounded px-2 py-0.5 text-xs font-medium',
                      statusClass(row.status)
                    )}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-text-secondary">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
