import { PERIODS } from '@/features/plan/electionsData'
import type { Deferral } from '@/features/plan/electionsData'
import { activeLoans, recentLoanPaymentDates } from './planLoans'

/** Account activity (contributions, repayments, dividends). SAMPLE DATA derived from the participant's current deferral election. */
export type ActivityKind = 'deferral' | 'employer' | 'loan_repayment' | 'dividend'
export type ActivityGroup = 'deferral' | 'employer' | 'other'

export interface ActivityRow {
  id: string
  at: number
  kind: ActivityKind
  planId: '401k' | 'profit-sharing'
  amount: number
}

export const groupOf = (k: ActivityKind): ActivityGroup => (k === 'deferral' ? 'deferral' : k === 'employer' ? 'employer' : 'other')

const DAY = 86_400_000
const round2 = (n: number) => Math.round(n * 100) / 100

/** Most recent pay dates, newest first. */
function payDates(frequency: string, now: number, count: number): number[] {
  const out: number[] = []
  const n = new Date(now)
  if (frequency === 'monthly' || frequency === 'semimonthly') {
    // Month-end (and the 15th for semimonthly) pay dates that have already passed.
    let y = n.getFullYear()
    let m = n.getMonth()
    while (out.length < count) {
      const monthEnd = new Date(y, m + 1, 0).getTime()
      const mid = new Date(y, m, 15).getTime()
      for (const d of frequency === 'semimonthly' ? [monthEnd, mid] : [monthEnd]) if (d <= now && out.length < count) out.push(d)
      m -= 1
      if (m < 0) { m = 11; y -= 1 }
    }
    return out
  }
  const step = frequency === 'weekly' ? 7 * DAY : 14 * DAY
  for (let i = 0; i < count; i++) out.push(now - (i + 1) * step)
  return out
}

export function buildActivity(opts: { deferral: Deferral; salary: number; frequency: string; balance: number; now: number }): ActivityRow[] {
  const { deferral, salary, frequency, balance, now } = opts
  const periods = PERIODS[frequency] ?? 12
  const rows: ActivityRow[] = []

  const pctPerSource = (v: number) => (deferral.unit === 'percent' ? v : (v * periods * 100) / salary)
  const totalPct = pctPerSource(deferral.preTax) + pctPerSource(deferral.roth)
  const myDeferral = deferral.unit === 'dollar' ? deferral.preTax + deferral.roth : round2((salary * totalPct) / 100 / periods)
  const employer = round2((salary * Math.min(totalPct, 6)) / 100 / periods)

  payDates(frequency, now, 10).forEach((at, i) => {
    if (myDeferral > 0) rows.push({ id: `def-${i}`, at, kind: 'deferral', planId: '401k', amount: myDeferral })
    if (employer > 0) rows.push({ id: `emp-${i}`, at, kind: 'employer', planId: '401k', amount: employer })
  })
  // Each plan loan is repaid monthly, from the same records as the dashboard's loan card
  const loans = activeLoans(now)
  recentLoanPaymentDates(now, 3).forEach((at, i) => {
    loans.forEach((loan) => rows.push({ id: `loan-${loan.ref}-${i}`, at, kind: 'loan_repayment', planId: loan.planId, amount: loan.payment }))
  })
  // Quarterly dividend reinvestment and a yearly profit-sharing contribution.
  for (let i = 0; i < 2; i++) {
    const q = Math.floor(new Date(now).getMonth() / 3) - i
    const at = new Date(new Date(now).getFullYear(), q * 3, 0).getTime()
    rows.push({ id: `div-${i}`, at, kind: 'dividend', planId: '401k', amount: round2(balance * 0.0007) })
  }
  rows.push({ id: 'ps-0', at: new Date(new Date(now).getFullYear(), 0, 31).getTime(), kind: 'employer', planId: 'profit-sharing', amount: 1200 })
  return rows.filter((r) => r.at <= now).sort((a, b) => b.at - a.at)
}
