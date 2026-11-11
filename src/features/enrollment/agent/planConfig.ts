/**
 * The plan the one-click enrolment agent enrols participants into: the single source of truth for its rules.
 *
 * SAMPLE DATA. No plan-rules API is connected yet, so these values are illustrative and labelled as such in the UI.
 * When the recordkeeper API is available, return this shape from `getPlanRules()` in `enrollmentService.ts`
 * and nothing else needs to change.
 */
export interface PlanConfig {
  /** Shown next to plan facts so participants know the data is illustrative */
  isSample: boolean
  plan: {
    /** Route id used by the plan pages */
    id: 'trad-401k'
    /** Plan identifier shown to participants */
    planId: string
    nameKey: string
  }
  eligibility: { minAge: number }
  /** Employer match: `ratePercent` of what you save, on contributions up to `capPercent` of pay */
  match: { ratePercent: number; capPercent: number }
  contribution: { min: number; max: number }
  autoIncrease: { amount: readonly [number, number]; cap: readonly [number, number]; default: { enabled: boolean; amount: number; max: number } }
  /** Employer match vesting, years of service to 100% (0 = immediate) */
  vestingYears: number
  /** Ordered disclosures the participant reviews before consenting */
  disclosures: readonly DisclosureId[]
}

export type DisclosureId = 'plan_terms' | 'fees' | 'investment_risk' | 'default_investment' | 'auto_increase' | 'not_advice'

export const PLAN_CONFIG: PlanConfig = {
  isSample: true,
  plan: { id: 'trad-401k', planId: 'PLAN-TRAD-401K-001', nameKey: 'enrollment.manage_page.plans.trad-401k.name' },
  eligibility: { minAge: 21 },
  match: { ratePercent: 100, capPercent: 6 },
  contribution: { min: 1, max: 25 },
  autoIncrease: { amount: [1, 3], cap: [10, 15], default: { enabled: true, amount: 1, max: 10 } },
  vestingYears: 0,
  disclosures: ['plan_terms', 'fees', 'investment_risk', 'default_investment', 'auto_increase', 'not_advice'],
}

/** Ranges for the one-click controls, from the plan configuration. */
export const PLAN_LIMITS = {
  rate: [PLAN_CONFIG.contribution.min, PLAN_CONFIG.contribution.max],
  autoAmount: PLAN_CONFIG.autoIncrease.amount,
  autoCap: PLAN_CONFIG.autoIncrease.cap,
} as const

/** Yearly employer match for a contribution rate, under the plan's formula. */
export function employerMatch(salary: number, ratePercent: number, config: PlanConfig = PLAN_CONFIG): number {
  const matched = Math.min(ratePercent, config.match.capPercent)
  return Math.round((salary * matched * config.match.ratePercent) / 100 / 100)
}
