import { PLANS } from '@/features/portfolio/portfolioData'

/**
 * Loans taken from the participant's 401(k) plan. The one source for the dashboard's loan card and the activity
 * history, so the balances, payments and repayments shown in each always agree. Payments come out on the 15th.
 */
export interface PlanLoan {
  ref: string
  /** The plan the loan was taken from */
  planId: '401k' | 'profit-sharing'
  purpose: 'general' | 'residential'
  /** ISO date the loan was paid out */
  originated: string
  /** Amount borrowed */
  amount: number
  /** Monthly repayment */
  payment: number
}

export const LOAN_PAYMENT_DAY = 15

export const PLAN_LOANS: PlanLoan[] = [
  { ref: 'LOAN-2024-001', planId: '401k', purpose: 'general', originated: '2024-01-15', amount: 6_000, payment: 125 },
  { ref: 'LOAN-2025-014', planId: '401k', purpose: 'residential', originated: '2025-03-01', amount: 20_000, payment: 310 },
]

export interface LoanStatus extends PlanLoan {
  planName: string
  balance: number
  paidPct: number
  paymentsLeft: number
}

/** Monthly payments made from the month after the loan was paid out up to `now` */
function paymentsMade(loan: PlanLoan, now: Date): number {
  const start = new Date(`${loan.originated}T00:00:00`)
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(0, months - (now.getDate() < LOAN_PAYMENT_DAY ? 1 : 0))
}

/** Where each plan loan stands today; loans already paid off are left out. */
export function activeLoans(now: number = Date.now()): LoanStatus[] {
  const today = new Date(now)
  return PLAN_LOANS.map((loan) => {
    const balance = Math.max(0, loan.amount - paymentsMade(loan, today) * loan.payment)
    return {
      ...loan,
      planName: PLANS.find((p) => p.id === loan.planId)?.name ?? '',
      balance,
      paidPct: Math.round(((loan.amount - balance) / loan.amount) * 100),
      paymentsLeft: Math.ceil(balance / loan.payment),
    }
  }).filter((l) => l.balance > 0)
}

/** Dates of the most recent `count` loan payments (the 15th of each month), newest first. */
export function recentLoanPaymentDates(now: number, count: number): number[] {
  const today = new Date(now)
  const lastMonth = today.getDate() >= LOAN_PAYMENT_DAY ? today.getMonth() : today.getMonth() - 1
  return Array.from({ length: count }, (_, i) => new Date(today.getFullYear(), lastMonth - i, LOAN_PAYMENT_DAY).getTime())
}
