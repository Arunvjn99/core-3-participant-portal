import type { Holding } from './feeSchedule'

export interface FeeInputs {
  balance: number
  holdings: Holding[]
  admin: { assetBasedPct: number; recordkeepingFlat: number }
  /** One-time fees already charged this year */
  serviceFees: { id: string; type: string; amount: number; at: number }[]
  /** Years and gross annual growth for the "impact over time" illustration */
  impactYears?: number
  grossGrowthPct?: number
}

export interface FundFeeLine {
  name: string
  ticker: string
  value: number
  expenseRatioPct: number
  annualCost: number
  /** Share of total investment fees, % */
  shareOfFees: number
}

export interface FeeReport {
  funds: FundFeeLine[]
  investmentFees: number
  adminAssetFee: number
  adminFlatFee: number
  /** Ongoing fees per year: investment + administration */
  totalAnnual: number
  /** Ongoing fees as a % of the balance */
  effectivePct: number
  /** Ongoing fees per $1,000 invested */
  per1000: number
  serviceFeesTotal: number
  serviceFees: FeeInputs['serviceFees']
  impact: { years: number; growthPct: number; withoutFees: number; withFees: number; difference: number }
}

const cents = (n: number) => Math.round(n * 100) / 100

export function computeFeeReport(input: FeeInputs): FeeReport {
  const { balance, holdings, admin, serviceFees } = input

  const lines = holdings.map((h) => {
    const value = (balance * h.weight) / 100
    return { name: h.name, ticker: h.ticker, value: cents(value), expenseRatioPct: h.expenseRatioPct, annualCost: cents((value * h.expenseRatioPct) / 100) }
  })
  const investmentFees = cents(lines.reduce((s, l) => s + l.annualCost, 0))
  const funds: FundFeeLine[] = lines.map((l) => ({
    ...l,
    shareOfFees: investmentFees > 0 ? (l.annualCost / investmentFees) * 100 : 0,
  }))

  const adminAssetFee = cents((balance * admin.assetBasedPct) / 100)
  const adminFlatFee = admin.recordkeepingFlat
  const totalAnnual = cents(investmentFees + adminAssetFee + adminFlatFee)
  const effectivePct = balance > 0 ? (totalAnnual / balance) * 100 : 0

  // Illustration only: lump sum, no further contributions, constant growth.
  const years = input.impactYears ?? 20
  const growthPct = input.grossGrowthPct ?? 6
  const withoutFees = balance * Math.pow(1 + growthPct / 100, years)
  const withFees = balance * Math.pow(1 + (growthPct - effectivePct) / 100, years)

  return {
    funds,
    investmentFees,
    adminAssetFee,
    adminFlatFee,
    totalAnnual,
    effectivePct,
    per1000: effectivePct * 10,
    serviceFeesTotal: serviceFees.reduce((s, f) => s + f.amount, 0),
    serviceFees,
    impact: { years, growthPct, withoutFees, withFees, difference: withoutFees - withFees },
  }
}
