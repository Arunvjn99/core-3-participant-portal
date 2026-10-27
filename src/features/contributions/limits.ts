import { EMPLOYER_MATCH_CAP_PERCENT } from '@/features/enrollment/quickEnrollmentDefaults'

/** IRS plan-year limits. Verify against the plan's recordkeeper before publishing a new year. */
export interface IrsLimits {
  /** 402(g) elective deferral limit */
  deferral: number
  /** Catch-up for age 50+ */
  catchUp: number
  /** SECURE 2.0 catch-up for ages 60–63 (replaces the regular catch-up) */
  superCatchUp: number
  /** 415(c) combined employee + employer limit (excludes catch-up) */
  annualAdditions: number
}

export const IRS_LIMITS: Record<number, IrsLimits> = {
  2025: { deferral: 23_500, catchUp: 7_500, superCatchUp: 11_250, annualAdditions: 70_000 },
  2026: { deferral: 24_500, catchUp: 8_000, superCatchUp: 11_250, annualAdditions: 72_000 },
}

export function limitsForYear(year: number): IrsLimits {
  const years = Object.keys(IRS_LIMITS).map(Number).sort((a, b) => a - b)
  const usable = years.filter((y) => y <= year)
  return IRS_LIMITS[usable.length ? usable[usable.length - 1] : years[0]]
}

export function catchUpForAge(age: number, limits: IrsLimits): number {
  if (age >= 60 && age <= 63) return limits.superCatchUp
  if (age >= 50) return limits.catchUp
  return 0
}

export interface ContributionLimitsInput {
  salary: number
  /** Elected employee deferral, % of pay */
  contributionPercent: number
  age: number
  /** Employee contributions already made this year; estimated from pay periods when omitted */
  ytdEmployee?: number
  now?: Date
  payPeriodsPerYear?: number
}

export interface ContributionLimitsResult {
  year: number
  baseLimit: number
  catchUp: number
  /** baseLimit + catchUp */
  employeeLimit: number
  ytdEmployee: number
  ytdIsEstimate: boolean
  remaining: number
  percentUsed: number
  /** Fraction of the plan year elapsed (0–1) */
  yearFraction: number
  projectedYearEnd: number
  /** True when the current rate will hit the limit before year end */
  reachesLimit: boolean
  /** Rate needed for the rest of the year to exactly use the limit; null if not achievable (>100%) or no pay left */
  percentToMax: number | null
  /** Only set when percentToMax is achievable */
  perPaycheckToMax: number | null
  match: {
    capPercent: number
    gapPercent: number
    /** Annual employer match left on the table at the current rate */
    missedAnnual: number
    ytdEmployer: number
  }
  combined: { limit: number; ytd: number; remaining: number }
}

const round = (n: number) => Math.round(n)

export function computeContributionLimits(input: ContributionLimitsInput): ContributionLimitsResult {
  const now = input.now ?? new Date()
  const year = now.getFullYear()
  const periods = input.payPeriodsPerYear ?? 26
  const startOfYear = new Date(year, 0, 1).getTime()
  const startOfNext = new Date(year + 1, 0, 1).getTime()
  const yearFraction = Math.min(Math.max((now.getTime() - startOfYear) / (startOfNext - startOfYear), 0), 1)
  const periodsElapsed = Math.floor(yearFraction * periods)
  const periodsLeft = periods - periodsElapsed

  const limits = limitsForYear(year)
  const catchUp = catchUpForAge(input.age, limits)
  const employeeLimit = limits.deferral + catchUp

  const perPeriod = (input.salary * input.contributionPercent) / 100 / periods
  const ytdIsEstimate = input.ytdEmployee === undefined
  const ytdEmployee = Math.min(round(input.ytdEmployee ?? perPeriod * periodsElapsed), employeeLimit)

  const remaining = Math.max(employeeLimit - ytdEmployee, 0)
  const projectedYearEnd = Math.min(round(ytdEmployee + perPeriod * periodsLeft), employeeLimit)
  const reachesLimit = ytdEmployee + perPeriod * periodsLeft >= employeeLimit

  const payLeft = (input.salary / periods) * periodsLeft
  const rawToMax = payLeft > 0 ? (remaining / payLeft) * 100 : null
  const percentToMax = rawToMax !== null && rawToMax <= 100 ? Math.ceil(rawToMax * 10) / 10 : null
  const perPaycheckToMax =
    percentToMax !== null && periodsLeft > 0 && remaining > 0 ? round(remaining / periodsLeft) : null

  const matchPercent = Math.min(input.contributionPercent, EMPLOYER_MATCH_CAP_PERCENT)
  const gapPercent = Math.max(EMPLOYER_MATCH_CAP_PERCENT - input.contributionPercent, 0)
  const ytdEmployer = round((input.salary * matchPercent) / 100 * yearFraction)

  const combinedYtd = ytdEmployee + ytdEmployer
  return {
    year,
    baseLimit: limits.deferral,
    catchUp,
    employeeLimit,
    ytdEmployee,
    ytdIsEstimate,
    remaining,
    percentUsed: employeeLimit > 0 ? Math.min((ytdEmployee / employeeLimit) * 100, 100) : 0,
    yearFraction,
    projectedYearEnd,
    reachesLimit,
    percentToMax,
    perPaycheckToMax,
    match: {
      capPercent: EMPLOYER_MATCH_CAP_PERCENT,
      gapPercent,
      missedAnnual: round((input.salary * gapPercent) / 100),
      ytdEmployer,
    },
    combined: {
      limit: limits.annualAdditions,
      ytd: combinedYtd,
      remaining: Math.max(limits.annualAdditions - combinedYtd, 0),
    },
  }
}
