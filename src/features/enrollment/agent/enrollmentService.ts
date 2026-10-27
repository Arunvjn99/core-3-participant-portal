import { PLAN_CONFIG, type PlanConfig } from './planConfig'

/**
 * SIMULATED enrolment service for the one-click agent. No recordkeeper API is connected: these functions wait a
 * realistic moment and answer from the sample plan configuration. Nothing is sent anywhere.
 *
 * To test failure states, add `?sim=rules-error` (the first plan-rules load fails) or `?sim=submit-error` (the first submit
 * attempt fails; retrying succeeds) to the page URL.
 */

export type ServiceErrorCode = 'rules_unavailable' | 'submit_failed'

export class ServiceError extends Error {
  code: ServiceErrorCode
  constructor(code: ServiceErrorCode) {
    super(code)
    this.code = code
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const simFlag = () => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('sim'))

export interface EligibilityResult {
  eligible: boolean
  /** Why not, when ineligible */
  reason?: 'under_min_age'
  minAge: number
}

/** Plan eligibility from the participant's age, under the plan's rule. */
export async function checkEligibility(age: number, config: PlanConfig = PLAN_CONFIG): Promise<EligibilityResult> {
  await delay(600)
  return age >= config.eligibility.minAge
    ? { eligible: true, minAge: config.eligibility.minAge }
    : { eligible: false, reason: 'under_min_age', minAge: config.eligibility.minAge }
}

/** The plan's rules. Returns the sample configuration; replace with the recordkeeper call when available. */
/** `attempt` counts retries (0 = first try); the simulated rules failure only affects the first try. */
export async function getPlanRules(attempt = 0): Promise<PlanConfig> {
  await delay(700)
  if (simFlag() === 'rules-error' && attempt === 0) throw new ServiceError('rules_unavailable')
  return PLAN_CONFIG
}

export interface EnrollmentSubmission {
  planId: string
  ratePercent: number
  preTaxPercent: number
  rothPercent: number
  autoIncrease: { enabled: boolean; amount: number; max: number }
  allocation: Record<string, number>
  /** The participant ticked the consent box. Submission is refused without it. */
  consented: boolean
}

export interface EnrollmentConfirmation {
  confirmationId: string
  /** Also the time consent was recorded */
  submittedAt: number
  /** First paycheck the election applies to (simulated: about two weeks out) */
  effectiveDate: Date
  simulated: true
}

let submitAttempts = 0

/** Simulated submission. Requires recorded consent; never runs without it. */
export async function submitEnrollment(payload: EnrollmentSubmission): Promise<EnrollmentConfirmation> {
  if (!payload.consented) throw new ServiceError('submit_failed')
  submitAttempts += 1
  await delay(1400)
  if (simFlag() === 'submit-error' && submitAttempts === 1) throw new ServiceError('submit_failed')
  const now = Date.now()
  return {
    confirmationId: `SIM-${now.toString(36).toUpperCase().slice(-6)}`,
    submittedAt: now,
    effectiveDate: new Date(now + 14 * 86_400_000),
    simulated: true,
  }
}
