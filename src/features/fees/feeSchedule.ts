/**
 * Plan fee schedule and the participant's holdings used by the fee report.
 * Placeholder data: expense ratios mirror the lineup in the transfer flow, service fees mirror the
 * loan and withdrawal flows, and the balance matches the Investments page. Replace with plan data.
 */
export interface Holding {
  name: string
  ticker: string
  /** Share of the participant's balance, % (sums to 100) */
  weight: number
  /** Fund expense ratio, % per year */
  expenseRatioPct: number
}

export const HOLDINGS: Holding[] = [
  { name: 'Large Cap Equity Fund', ticker: 'LCEF', weight: 35, expenseRatioPct: 0.04 },
  { name: 'Target Date 2050 Fund', ticker: 'TD50', weight: 25, expenseRatioPct: 0.08 },
  { name: 'International Growth Fund', ticker: 'IGRF', weight: 15, expenseRatioPct: 0.12 },
  { name: 'Stable Value Bond Fund', ticker: 'SVBF', weight: 15, expenseRatioPct: 0.03 },
  { name: 'Small Cap Growth Fund', ticker: 'SCGF', weight: 5, expenseRatioPct: 0.15 },
  { name: 'Money Market Fund', ticker: 'MMKT', weight: 5, expenseRatioPct: 0.01 },
]

export const PARTICIPANT_BALANCE = 287_450.82

export const ADMIN_FEES = {
  /** Plan administration, charged as % of assets */
  assetBasedPct: 0.07,
  /** Recordkeeping, flat per year */
  recordkeepingFlat: 36,
}

/** One-time fees charged when a request is processed (matches the loan and withdrawal flows). */
export const SERVICE_FEES: Record<string, number> = {
  loan: 100,
  withdrawal: 25,
}
