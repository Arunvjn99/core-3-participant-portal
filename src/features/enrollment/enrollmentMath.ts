import { PLAN_CONFIG, employerMatch, type PlanConfig } from './agent/planConfig'
import { ASSUMPTIONS } from '@/features/retirement/retirementModel'
import { PLANS } from '@/features/portfolio/portfolioData'

/** The participant's current 401(k) balance, from the same account data as Account Summary */
export const ACCOUNT_BALANCE = Math.round(PLANS[0].balance)

/** Savings to start projections from: what the participant entered, or their account balance when nothing was entered */
export function startingSavings(entered?: number | null): number {
  return entered != null && entered > 0 ? entered : ACCOUNT_BALANCE
}
import { RETIREMENT_INCOME_TARGET_RATIO } from '@/lib/retirementCalculations'

/** Yearly inflation used to turn a future balance into today's dollars (nominal growth minus the model's 3.5% real growth) */
export const ASSUMED_INFLATION = 0.03

/**
 * Yearly retirement income in today's dollars versus the goal of 80% of current pay.
 * Income = 4% a year from the projected balance (after inflation) plus an estimated Social Security benefit.
 */
export function retirementIncome(projectedBalance: number, years: number, salary: number) {
  const todaysDollars = projectedBalance / Math.pow(1 + ASSUMED_INFLATION, Math.max(0, years))
  const fromSavings = Math.round(todaysDollars * ASSUMPTIONS.withdrawalRate)
  const socialSecurity = Math.round(Math.min(salary * ASSUMPTIONS.socialSecurityPctOfSalary, ASSUMPTIONS.socialSecurityMax))
  const goal = Math.round(salary * RETIREMENT_INCOME_TARGET_RATIO)
  const total = fromSavings + socialSecurity
  return {
    fromSavings,
    socialSecurity,
    total,
    goal,
    gap: Math.max(0, goal - total),
    readinessPct: goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0,
  }
}

/** How the total contribution rate is split across sources, in percent of that rate (sums to 100). */
export interface SourceSplit {
  preTax: number
  roth: number
  afterTax: number
}

/**
 * The part of the contribution rate the employer matches. Pre-tax and Roth are both elective deferrals and both
 * count toward the match; after-tax (non-Roth) contributions are not elective deferrals and are not matched.
 */
export function matchableRate(ratePercent: number, sources: SourceSplit): number {
  const total = sources.preTax + sources.roth + sources.afterTax
  if (total <= 0) return ratePercent
  return (ratePercent * (sources.preTax + sources.roth)) / total
}

/** Yearly employer match for a total contribution rate and its source split, under the plan's formula. */
export function annualEmployerMatch(
  salary: number,
  ratePercent: number,
  sources: SourceSplit,
  config: PlanConfig = PLAN_CONFIG,
): number {
  return employerMatch(salary, matchableRate(ratePercent, sources), config)
}

/** Splits a whole-dollar amount by percentage shares so the parts add back up exactly (any rounding dollar goes to the largest share). */
export function splitWhole(amount: number, shares: number[]): number[] {
  const parts = shares.map((s) => Math.round((amount * s) / 100))
  const diff = amount - parts.reduce((a, b) => a + b, 0)
  if (diff !== 0) parts[shares.indexOf(Math.max(...shares))] += diff
  return parts
}

/** Extra yearly match available by saving enough (pre-tax or Roth) to reach the match cap. */
export function missedEmployerMatch(salary: number, ratePercent: number, sources: SourceSplit, config: PlanConfig = PLAN_CONFIG): number {
  return Math.max(0, employerMatch(salary, config.match.capPercent, config) - annualEmployerMatch(salary, ratePercent, sources, config))
}

export interface ProjectionInput {
  startingBalance: number
  salary: number
  ratePercent: number
  sources: SourceSplit
  years: number
  growthRate: number
  /** When set, the rate rises by `amount` points after each year until it reaches `max` */
  autoIncrease?: { amount: number; max: number } | null
}

/** Balance in `years` with the contribution held fixed versus rising by the auto-increase, and the gap between them. */
export function compareAutoIncrease(input: Omit<ProjectionInput, 'autoIncrease'>, autoIncrease: { amount: number; max: number }) {
  const fixed = Math.round(projectBalance(input))
  const withIncrease = Math.round(projectBalance({ ...input, autoIncrease }))
  return { fixed, withIncrease, difference: withIncrease - fixed }
}

/** Balance after `years` of yearly contributions plus employer match, growing at `growthRate`. */
export function projectBalance({ startingBalance, salary, ratePercent, sources, years, growthRate, autoIncrease }: ProjectionInput): number {
  let balance = startingBalance
  let rate = ratePercent
  const ceiling = autoIncrease ? Math.max(autoIncrease.max, ratePercent) : ratePercent
  for (let y = 0; y < Math.max(0, Math.floor(years)); y++) {
    balance = (balance + (salary * rate) / 100 + annualEmployerMatch(salary, rate, sources)) * (1 + growthRate)
    if (autoIncrease) rate = Math.min(rate + autoIncrease.amount, ceiling)
  }
  return balance
}
