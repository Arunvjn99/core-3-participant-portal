import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  Download,
  ArrowLeftRight,
  HandCoins,
  DollarSign,
  RefreshCcw,
  Repeat,
  ChevronDown,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Transaction {
  id: string
  type: 'Loan' | 'Withdrawal' | 'Transfer' | 'Rebalance' | 'Rollover'
  amount: string
  status: 'Completed' | 'Processing' | 'Cancelled'
  date: string
  description: string
  transactionId: string
  processedBy: string
}

const mockTransactions: Transaction[] = [
  {
    id: '4',
    type: 'Transfer',
    amount: '$1,500',
    status: 'Completed',
    date: 'March 5, 2026',
    description: 'Reallocation from Conservative to Growth Fund',
    transactionId: 'TRX-2026-0305-001',
    processedBy: 'System',
  },
  {
    id: '5',
    type: 'Loan',
    amount: '$2,000',
    status: 'Completed',
    date: 'February 28, 2026',
    description: 'General Purpose Loan - 12 month term',
    transactionId: 'LN-2026-0228-045',
    processedBy: 'Plan Administrator',
  },
  {
    id: '6',
    type: 'Withdrawal',
    amount: '$1,000',
    status: 'Completed',
    date: 'February 15, 2026',
    description: 'Hardship withdrawal for medical expenses',
    transactionId: 'WD-2026-0215-023',
    processedBy: 'Compliance Team',
  },
  {
    id: '7',
    type: 'Rebalance',
    amount: '—',
    status: 'Completed',
    date: 'January 20, 2026',
    description: 'Quarterly portfolio rebalance to target allocation',
    transactionId: 'RB-2026-0120-012',
    processedBy: 'System',
  },
  {
    id: '8',
    type: 'Transfer',
    amount: '$800',
    status: 'Completed',
    date: 'January 10, 2026',
    description: 'Moved funds to International Equity Fund',
    transactionId: 'TRX-2026-0110-088',
    processedBy: 'System',
  },
  {
    id: '9',
    type: 'Withdrawal',
    amount: '$500',
    status: 'Processing',
    date: 'January 5, 2026',
    description: 'In-service distribution request',
    transactionId: 'WD-2026-0105-067',
    processedBy: 'Pending Review',
  },
  {
    id: '10',
    type: 'Rollover',
    amount: '$18,500',
    status: 'Completed',
    date: 'December 12, 2025',
    description: 'Rollover from Acme Corp 401(k) via Fidelity',
    transactionId: 'RO-2025-1212-003',
    processedBy: 'Plan Administrator',
  },
]

type FilterId = 'all' | 'loans' | 'withdrawals' | 'transfers' | 'rebalance' | 'rollovers'

const FILTER_IDS: FilterId[] = ['all', 'loans', 'withdrawals', 'transfers', 'rebalance', 'rollovers']

const typeIcons: Record<Transaction['type'], React.ReactNode> = {
  Loan: <HandCoins className="h-[13px] w-[13px]" />,
  Withdrawal: <DollarSign className="h-[13px] w-[13px]" />,
  Transfer: <ArrowLeftRight className="h-[13px] w-[13px]" />,
  Rebalance: <RefreshCcw className="h-[13px] w-[13px]" />,
  Rollover: <Repeat className="h-[13px] w-[13px]" />,
}

const typeColors: Record<Transaction['type'], { bg: string; color: string }> = {
  Loan: { bg: 'var(--status-info-bg)', color: 'var(--brand-primary)' },
  Withdrawal: { bg: 'var(--status-danger-tint)', color: 'var(--status-danger)' },
  Transfer: { bg: 'var(--status-info-bg)', color: 'var(--brand-primary)' },
  Rebalance: { bg: 'var(--status-success-tint)', color: 'var(--status-success)' },
  Rollover: { bg: 'var(--status-info-bg)', color: 'var(--brand-primary)' },
}

function transactionMatchesFilter(transaction: Transaction, filter: FilterId): boolean {
  if (filter === 'all') return true
  if (filter === 'loans') return transaction.type === 'Loan'
  if (filter === 'withdrawals') return transaction.type === 'Withdrawal'
  if (filter === 'transfers') return transaction.type === 'Transfer'
  if (filter === 'rebalance') return transaction.type === 'Rebalance'
  if (filter === 'rollovers') return transaction.type === 'Rollover'
  return true
}

function txTypeKey(type: Transaction['type']): string {
  return `transactions.${type.toLowerCase()}`
}

function txStatusKey(status: Transaction['status']): string {
  switch (status) {
    case 'Completed':
      return 'common.completed'
    case 'Processing':
      return 'common.processing'
    case 'Cancelled':
      return 'common.cancelled'
  }
}

function RecentTransactionsCompact({ maxItems }: { maxItems?: number } = {}) {
  const { t } = useTranslation()
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('all')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const filteredTransactions = useMemo(
    () => mockTransactions.filter((tx) => transactionMatchesFilter(tx, selectedFilter)),
    [selectedFilter],
  )

  const displayedTransactions = maxItems ? filteredTransactions.slice(0, maxItems) : filteredTransactions

  const filterLabel = (id: FilterId) => t(`transactions.recent_tx.filters.${id}`)

  const tableHeaderKeys = ['tc_col_type', 'tc_col_description', 'tc_col_amount', 'tc_col_status', 'tc_col_date'] as const

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed':
        return { bg: 'var(--status-success-tint)', color: 'var(--status-success-text)', dot: 'var(--status-success)' }
      case 'Processing':
        return { bg: 'var(--c-blue-tint)', color: 'var(--brand-primary)', dot: 'var(--brand-primary)' }
      case 'Cancelled':
        return { bg: 'var(--c-subtle)', color: 'var(--c-text-muted)', dot: 'var(--c-text-faint)' }
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div
          className="hidden items-center gap-1 border border-slate-100 bg-slate-50 p-1 dark:border-gray-700 dark:bg-gray-800 sm:flex"
          style={{ borderRadius: 12 }}
        >
          {FILTER_IDS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`transition-all duration-200 ${
                selectedFilter === filter
                  ? 'border border-slate-200 bg-white text-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-blue-400'
                  : 'border border-transparent bg-transparent text-slate-500 dark:text-gray-400'
              }`}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: selectedFilter === filter ? 700 : 500,
                boxShadow: selectedFilter === filter ? '0 1px 3px rgba(0,0,0,0.06)' : undefined,
              }}
            >
              {filterLabel(filter)}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:hidden">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex w-full items-center justify-between border border-slate-200 bg-white text-slate-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
            style={{ padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}
          >
            <span>
              {t('transactions.recent_tx.filter_prefix')} {filterLabel(selectedFilter)}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform dark:text-gray-500 ${mobileFilterOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {mobileFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            >
              {FILTER_IDS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(filter)
                    setMobileFilterOpen(false)
                  }}
                  className={`w-full text-left transition-colors ${
                    selectedFilter === filter
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'bg-transparent text-slate-600 dark:text-gray-300'
                  }`}
                  style={{ padding: '10px 16px', fontSize: 13, fontWeight: selectedFilter === filter ? 700 : 500 }}
                >
                  {filterLabel(filter)}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <span className="hidden text-slate-400 dark:text-gray-500 sm:block" style={{ fontSize: 12, fontWeight: 500 }}>
          {t('transactions.recent_tx.showing', { count: filteredTransactions.length })}
        </span>
      </div>

      <div className="space-y-3 sm:hidden">
        {displayedTransactions.map((transaction, idx) => {
          const badge = getStatusBadge(transaction.status)
          const tc = typeColors[transaction.type]
          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="border border-slate-100 bg-white dark:border-gray-800 dark:bg-gray-900"
              style={{ padding: '14px 16px', borderRadius: 14 }}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex items-center justify-center"
                    style={{ width: 30, height: 30, borderRadius: 8, background: tc.bg, color: tc.color }}
                  >
                    {typeIcons[transaction.type]}
                  </span>
                  <div>
                    <p className="text-slate-900 dark:text-white" style={{ fontSize: 13, fontWeight: 700 }}>
                      {t(txTypeKey(transaction.type))}
                    </p>
                    <p className="font-mono text-slate-400 dark:text-gray-500" style={{ fontSize: 10, fontWeight: 500 }}>
                      {transaction.transactionId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-900 dark:text-white" style={{ fontSize: 14, fontWeight: 800 }}>
                    {transaction.amount}
                  </p>
                  <span
                    className="inline-flex items-center gap-1"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: badge.bg,
                      color: badge.color,
                    }}
                  >
                    <span
                      className={`rounded-full ${transaction.status === 'Processing' ? 'animate-pulse' : ''}`}
                      style={{ width: 5, height: 5, background: badge.dot }}
                    />
                    {t(txStatusKey(transaction.status))}
                  </span>
                </div>
              </div>

              <p
                className="line-clamp-2 text-slate-600 dark:text-gray-300"
                style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}
              >
                {transaction.description}
              </p>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-gray-800">
                <span className="text-slate-400 dark:text-gray-500" style={{ fontSize: 11, fontWeight: 500 }}>
                  {transaction.date}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex items-center justify-center border border-slate-200 bg-white text-slate-500 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    title={t('transactions.recent_tx.view_details')}
                    style={{ width: 28, height: 28, borderRadius: 7 }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center border border-slate-200 bg-white text-slate-500 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    title={t('transactions.recent_tx.download_receipt')}
                    style={{ width: 28, height: 28, borderRadius: 7 }}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {filteredTransactions.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-slate-400 dark:text-gray-500" style={{ fontSize: 13, fontWeight: 500 }}>
              {t('transactions.recent_tx.empty')}
            </p>
          </div>
        )}

        <div className="pt-1 text-center">
          <span className="text-slate-400 dark:text-gray-500" style={{ fontSize: 11, fontWeight: 500 }}>
            {t('transactions.recent_tx.tx_count', { count: filteredTransactions.length })}
          </span>
        </div>
      </div>

      <div
        className="hidden overflow-x-auto border border-slate-100 dark:border-gray-800 sm:block"
        style={{ borderRadius: 14 }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
              {tableHeaderKeys.map((headerKey) => (
                <th
                  key={headerKey}
                  className="text-left uppercase text-slate-500 dark:text-gray-400"
                  style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.5px' }}
                >
                  {t(`transactions.${headerKey}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedTransactions.map((transaction, idx) => {
              const badge = getStatusBadge(transaction.status)
              const tc = typeColors[transaction.type]
              return (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group border-b border-slate-100 transition-colors duration-200 hover:bg-slate-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center justify-center"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: tc.bg,
                          color: tc.color,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {typeIcons[transaction.type]}
                      </span>
                      <span className="text-slate-900 dark:text-white" style={{ fontSize: 13, fontWeight: 600 }}>
                        {t(txTypeKey(transaction.type))}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                    <span className="block truncate text-slate-600 dark:text-gray-300" style={{ fontSize: 13, fontWeight: 500 }}>
                      {transaction.description}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="text-slate-900 dark:text-white" style={{ fontSize: 13, fontWeight: 700 }}>
                      {transaction.amount}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: badge.bg,
                        color: badge.color,
                      }}
                    >
                      <span
                        className={`rounded-full ${transaction.status === 'Processing' ? 'animate-pulse' : ''}`}
                        style={{ width: 6, height: 6, background: badge.dot }}
                      />
                      {t(txStatusKey(transaction.status))}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="text-slate-500 dark:text-gray-400" style={{ fontSize: 12, fontWeight: 500 }}>
                      {transaction.date}
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-400 dark:text-gray-500" style={{ fontSize: 13, fontWeight: 500 }}>
              {t('transactions.recent_tx.empty')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentTransactionsCompact
