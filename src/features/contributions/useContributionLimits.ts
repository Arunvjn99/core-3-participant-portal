import { useMemo } from 'react'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { buildQuickEnrollmentDefaults } from '@/features/enrollment/quickEnrollmentDefaults'
import { computeContributionLimits } from './limits'

/**
 * Remaining-limit view for the signed-in participant, based on their elected rate and salary.
 * Year-to-date is estimated from pay periods elapsed until a contribution-history source exists.
 */
export function useContributionLimits() {
  const draft = useEnrollmentDraftStore((s) => s.draftData)
  return useMemo(() => {
    const d = buildQuickEnrollmentDefaults(draft)
    // Use the elected rate as-is: the quick-enrol default floor (match cap) must not mask a low rate.
    const rate = draft.contribution?.percent ?? draft.contribution?.rate ?? d.contributionPercent
    return computeContributionLimits({ salary: d.salary, contributionPercent: rate, age: d.currentAge })
  }, [draft])
}
