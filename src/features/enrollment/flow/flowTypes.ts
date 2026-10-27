import type { RiskKey } from '../investmentCatalog'

/** Everything the agent may need to ask: the "about you" questions plus the one real decision (tax treatment). */
export type QuestionId = 'birth' | 'retire' | 'location' | 'salary' | 'savings' | 'comfort' | 'tax'
export type TaxMode = 'pretax' | 'roth' | 'mix'

export interface Answers {
  birthMonth: string
  birthYear: number
  retirementAge: number
  location: string
  salary: number
  savings: number
  risk: RiskKey
  tax: TaxMode
}

/** The enrolment the agent prepares; every value can be changed before confirming. */
export interface PlanChoice {
  rate: number
  tax: TaxMode
  auto: { enabled: boolean; amount: number; max: number }
  risk: RiskKey
}

export type EditTarget = 'rate' | 'tax' | 'auto' | 'risk'

/** The agent's background work, in order. */
export const TASKS = ['profile', 'eligibility', 'rules', 'contribution', 'investments', 'projection'] as const
export type TaskId = (typeof TASKS)[number]
export type TaskStatus = 'pending' | 'running' | 'waiting' | 'done' | 'error'
