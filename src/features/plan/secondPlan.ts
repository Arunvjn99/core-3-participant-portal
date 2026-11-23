import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'

/** The second plan: a 457(b) with its own yearly limit and no employer match */
export const SECOND_PLAN = { planId: 'PLAN-457B-001', limit: 23_500, minRate: 1, maxRate: 25 }

/** The second plan as saved in the enrollment draft, or null when the participant has only one plan */
export const useSecondPlan = () => {
  const sp = useEnrollmentDraftStore((s) => s.draftData.secondPlan)
  return sp?.offered ? sp : null
}
