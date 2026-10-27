import type { EnrollmentDraftData } from '@/core/store/enrollmentDraftStore'
import { PLAN_CONFIG } from './agent/planConfig'

export type RiskLevel = 'conservative' | 'balanced' | 'growth' | 'aggressive'

/** Employer match cap used across the enrollment flow (see Contribution / ReviewEnrollment). From the plan configuration. */
export const EMPLOYER_MATCH_CAP_PERCENT = PLAN_CONFIG.match.capPercent

export interface QuickEnrollmentDefaults {
  plan: 'traditional' | 'roth'
  contributionPercent: number
  sources: { preTax: number; roth: number; afterTax: number }
  autoIncrease: { enabled: boolean; amount: number; max: number }
  riskLevel: RiskLevel
  salary: number
  currentAge: number
  retirementAge: number
}

/** Younger participants get a longer horizon, so a growth-oriented default; older ones a steadier one. */
function riskForAge(age: number): RiskLevel {
  if (age < 40) return 'growth'
  if (age < 55) return 'balanced'
  return 'conservative'
}

/**
 * Smart defaults for one-click enrolment, derived from whatever the participant has already told us
 * (personalization modal, salary). Always contributes at least enough to capture the full employer match.
 */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Age today from the birth date the personalization questions collect. */
export function ageFromBirth(year: number, month = 'January', day = 1, now = new Date()): number {
  const m = Math.max(MONTHS.indexOf(month), 0)
  let age = now.getFullYear() - year
  if (now.getMonth() < m || (now.getMonth() === m && now.getDate() < day)) age--
  return age
}

/** True once the questions from the "Start my enrolment" popup have been answered. */
export function hasProfile(draft: EnrollmentDraftData): boolean {
  const p = draft.personalization
  return !!p && (p.currentAge != null || p.birthYear != null) && p.retirementAge != null && p.riskTolerance != null
}

export function buildQuickEnrollmentDefaults(draft: EnrollmentDraftData): QuickEnrollmentDefaults {
  const p = draft.personalization
  const currentAge = p?.currentAge ?? (p?.birthYear ? ageFromBirth(p.birthYear, p.birthMonth, p.birthDay) : 35)
  const retirementAge = draft.personalization?.retirementAge ?? 65
  const salary = draft.savings?.salary ?? draft.personalization?.salary ?? 85000

  const plan = draft.plan?.type ?? 'traditional'
  const contributionPercent = Math.max(
    draft.contribution?.percent ?? draft.contribution?.rate ?? 0,
    EMPLOYER_MATCH_CAP_PERCENT,
  )

  return {
    plan,
    contributionPercent,
    sources: plan === 'roth' ? { preTax: 0, roth: 100, afterTax: 0 } : { preTax: 100, roth: 0, afterTax: 0 },
    autoIncrease: { ...PLAN_CONFIG.autoIncrease.default },
    riskLevel: p?.riskTolerance ?? draft.investment?.riskLevel ?? riskForAge(currentAge),
    salary,
    currentAge,
    retirementAge,
  }
}

const GROWTH_RATES: Record<RiskLevel, number> = {
  conservative: 0.045,
  balanced: 0.068,
  growth: 0.082,
  aggressive: 0.095,
}

/** Same projection used on the Review step, so the numbers match if the participant customises. */
export function projectBalance(d: QuickEnrollmentDefaults, currentSavings: number): number {
  const match = Math.min(d.contributionPercent, EMPLOYER_MATCH_CAP_PERCENT)
  const annual = Math.round((d.salary * d.contributionPercent) / 100) + Math.round((d.salary * match) / 100)
  let balance = currentSavings
  for (let i = 0; i < Math.max(d.retirementAge - d.currentAge, 0); i++) {
    balance = (balance + annual) * (1 + GROWTH_RATES[d.riskLevel])
  }
  return balance
}
