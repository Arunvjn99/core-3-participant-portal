import type { RetirementExtras } from '@/features/enrollment/enrollmentMath'
import { stateTaxRate } from './retirementModel'

/** The saved retirement goal, as the readiness calculation needs it */
interface SavedGoal {
  checkedAt: number | null
  location: string
  monthlySpending: number
  outsideSavings: number
}

/**
 * What the participant told the Retirement readiness page, as extras for the shared income model, so the dashboard,
 * the enrollment steps and the readiness page all score the same plan the same way. Until the goal has been saved,
 * the plain defaults apply (goal = 80% of pay, no outside savings, no state tax).
 */
export function goalExtras(goal: SavedGoal, sources: { preTax: number; roth: number; afterTax: number }, growthRate: number): RetirementExtras {
  if (!goal.checkedAt) return {}
  const total = sources.preTax + sources.roth + sources.afterTax
  return {
    annualGoal: goal.monthlySpending * 12,
    outsideSavings: goal.outsideSavings,
    growthRate,
    stateTaxRate: stateTaxRate(goal.location),
    taxableShare: total > 0 ? sources.preTax / total : 1,
  }
}
