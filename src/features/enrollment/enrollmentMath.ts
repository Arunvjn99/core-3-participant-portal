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
 * Readiness score out of 100 from the share of the income goal covered: meeting the goal exactly scores 80 (on track),
 * and the last 20 points spread over 100% to 150% of the goal, so a plan that already meets it still moves with every choice.
 */
export function readinessScore(goalShare: number): number {
  if (goalShare <= 0) return 0
  const score = goalShare <= 1 ? goalShare * 80 : 80 + ((goalShare - 1) / 0.5) * 20
  return Math.min(100, Math.round(score))
}

/** Earliest age Social Security retirement benefits can start */
export const SOCIAL_SECURITY_START_AGE = 62

/** What the Retirement readiness page adds on top of the basic projection; every field is optional. */
export interface RetirementExtras {
  /** Age at retirement: before 62 no Social Security is counted */
  retirementAge?: number
  /** The participant's own yearly spending goal in today's dollars; without it the goal is 80% of current pay */
  annualGoal?: number
  /** Savings held outside the plan today; they grow at `growthRate` alongside the 401(k) */
  outsideSavings?: number
  growthRate?: number
  /** State income-tax rate on taxable (pre-tax) withdrawals, and the share of the 401(k) that is pre-tax */
  stateTaxRate?: number
  taxableShare?: number
}

/**
 * Yearly retirement income in today's dollars versus the yearly goal (80% of current pay unless one is given).
 * Income = 4% a year from the projected balance and any outside savings (after inflation), plus an estimated Social
 * Security benefit from age 62, less state tax on the pre-tax part of the withdrawals.
 */
export function retirementIncome(projectedBalance: number, years: number, salary: number, extras: RetirementExtras = {}) {
  const yrs = Math.max(0, years)
  const deflate = (v: number) => v / Math.pow(1 + ASSUMED_INFLATION, yrs)
  const todaysDollars = deflate(projectedBalance)
  const outsideToday = extras.outsideSavings && extras.outsideSavings > 0 ? deflate(extras.outsideSavings * Math.pow(1 + (extras.growthRate ?? 0), yrs)) : 0
  const fromPlan = todaysDollars * ASSUMPTIONS.withdrawalRate
  const fromSavings = Math.round(fromPlan + outsideToday * ASSUMPTIONS.withdrawalRate)
  const stateTax = Math.round(fromPlan * (extras.taxableShare ?? 1) * (extras.stateTaxRate ?? 0))
  const socialSecurity =
    extras.retirementAge !== undefined && extras.retirementAge < SOCIAL_SECURITY_START_AGE
      ? 0
      : Math.round(Math.min(salary * ASSUMPTIONS.socialSecurityPctOfSalary, ASSUMPTIONS.socialSecurityMax))
  const goal = Math.round(extras.annualGoal && extras.annualGoal > 0 ? extras.annualGoal : salary * RETIREMENT_INCOME_TARGET_RATIO)
  const total = Math.max(0, fromSavings + socialSecurity - stateTax)
  return {
    fromSavings,
    socialSecurity,
    stateTax,
    total,
    goal,
    gap: Math.max(0, goal - total),
    /** How much of the income goal the plan covers, in percent; can pass 100 */
    goalPct: goal > 0 ? Math.round((total / goal) * 100) : 0,
    readinessPct: readinessScore(goal > 0 ? total / goal : 0),
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
