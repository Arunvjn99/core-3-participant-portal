/**
 * Retirement readiness model. Simple, transparent projections for the demo, not financial advice:
 * everything is in today's dollars using a 3.5% real (after-inflation) return, a 4% annual withdrawal rate, and placeholder Social Security
 * and state-tax assumptions. Replace with the plan's projection engine when available.
 */
export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
] as const

/** States with no income tax on retirement account withdrawals. */
const NO_TAX = new Set(['Alaska', 'Florida', 'Nevada', 'New Hampshire', 'South Dakota', 'Tennessee', 'Texas', 'Washington', 'Wyoming'])
/** States that exempt most retirement income. */
const EXEMPT = new Set(['Illinois', 'Mississippi', 'Pennsylvania'])

/** Rough effective state income-tax rate on retirement withdrawals (illustrative). */
export function stateTaxRate(state: string): number {
  if (NO_TAX.has(state) || EXEMPT.has(state)) return 0
  const high = new Set(['California', 'Oregon', 'Minnesota', 'New Jersey', 'New York', 'Hawaii', 'Vermont', 'District of Columbia', 'Maine', 'Connecticut'])
  return high.has(state) ? 0.06 : 0.04
}

export const ASSUMPTIONS = { realGrowth: 0.035, withdrawalRate: 0.04, matchCapPercent: 6, socialSecurityPctOfSalary: 0.35, socialSecurityMax: 42_000 }

export interface AutoIncreaseInput {
  enabled: boolean
  amount: number
  cap: number
}

export interface ModelInput {
  currentAge: number
  retirementAge: number
  salary: number
  monthlySpending: number
  outsideSavings: number
  /** Current 401(k) balance */
  balance: number
  preTaxPct: number
  rothPct: number
  autoIncrease: AutoIncreaseInput
  state: string
}

export interface ModelResult {
  yearsRemaining: number
  expectedExpense: number
  projected401k: number
  projectedOutside: number
  socialSecurity: number
  withdrawals: number
  stateTax: number
  allIncome: number
  shortfall: number
  readinessPct: number
}

export function runModel(m: ModelInput): ModelResult {
  const years = Math.max(m.retirementAge - m.currentAge, 0)
  let balance = m.balance
  let pct = m.preTaxPct + m.rothPct
  for (let y = 0; y < years; y++) {
    const employer = (m.salary * Math.min(pct, ASSUMPTIONS.matchCapPercent)) / 100
    balance = (balance + (m.salary * pct) / 100 + employer) * (1 + ASSUMPTIONS.realGrowth)
    if (m.autoIncrease.enabled) pct = Math.min(pct + m.autoIncrease.amount, Math.max(m.autoIncrease.cap, pct))
  }
  const outside = m.outsideSavings * Math.pow(1 + ASSUMPTIONS.realGrowth, years)
  const withdrawals = (balance + outside) * ASSUMPTIONS.withdrawalRate
  const preTaxShare = m.preTaxPct + m.rothPct > 0 ? m.preTaxPct / (m.preTaxPct + m.rothPct) : 1
  const stateTax = balance * ASSUMPTIONS.withdrawalRate * preTaxShare * stateTaxRate(m.state)
  const socialSecurity = Math.min(m.salary * ASSUMPTIONS.socialSecurityPctOfSalary, ASSUMPTIONS.socialSecurityMax)
  const allIncome = Math.max(withdrawals + socialSecurity - stateTax, 0)
  const expectedExpense = m.monthlySpending * 12
  return {
    yearsRemaining: years,
    expectedExpense,
    projected401k: balance,
    projectedOutside: outside,
    socialSecurity,
    withdrawals,
    stateTax,
    allIncome,
    shortfall: Math.max(expectedExpense - allIncome, 0),
    readinessPct: expectedExpense > 0 ? Math.min(Math.round((allIncome / expectedExpense) * 100), 100) : 0,
  }
}
