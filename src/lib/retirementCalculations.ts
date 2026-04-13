/** Minimal projection helpers for retirement readiness (Figma Make parity). */

export type RiskLevel = 'conservative' | 'balanced' | 'growth' | 'aggressive'

export const RETIREMENT_INCOME_TARGET_RATIO = 0.8

const GROWTH_RATES: Record<RiskLevel, number> = {
  conservative: 0.045,
  balanced: 0.068,
  growth: 0.082,
  aggressive: 0.095,
}

export function getGrowthRate(risk: RiskLevel): number {
  return GROWTH_RATES[risk]
}

export function projectBalanceConstantAnnualContributions(
  startingBalance: number,
  annualEmployee: number,
  annualEmployer: number,
  years: number,
  growthRate: number,
): number {
  let balance = startingBalance
  const y = Math.max(0, Math.floor(years))
  for (let i = 0; i < y; i++) {
    balance = (balance + annualEmployee + annualEmployer) * (1 + growthRate)
  }
  return balance
}
