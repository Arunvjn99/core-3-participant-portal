import { useMemo, useState } from 'react'
import { useTransactionTracker } from '@/features/transactions/tracking/trackerStore'
import { computeFeeReport } from './computeFees'
import { ADMIN_FEES, HOLDINGS, PARTICIPANT_BALANCE, SERVICE_FEES } from './feeSchedule'

export function useFeeReport() {
  const tracked = useTransactionTracker((s) => s.items)
  const [year] = useState(() => new Date().getFullYear())

  return useMemo(() => {
    const serviceFees = tracked
      .filter((tx) => SERVICE_FEES[tx.type] && new Date(tx.submittedAt).getFullYear() === year)
      .map((tx) => ({ id: tx.id, type: tx.type, amount: SERVICE_FEES[tx.type], at: tx.submittedAt }))
      .sort((a, b) => b.at - a.at)
    return { year, balance: PARTICIPANT_BALANCE, report: computeFeeReport({ balance: PARTICIPANT_BALANCE, holdings: HOLDINGS, admin: ADMIN_FEES, serviceFees }) }
  }, [tracked, year])
}
