import { useCallback } from 'react'
import { useAuth } from '@/core/hooks/useAuth'
import { saveEnrollmentStep } from '@/core/user/userService'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'

export function useEnrollmentSave() {
  const { user } = useAuth()

  const saveToSupabase = useCallback(
    async (stepKey: string, stepData: Record<string, unknown>) => {
      if (!user?.id) return
      const { currentStep, highestCompletedStep } = useEnrollmentDraftStore.getState()
      try {
        await saveEnrollmentStep(user.id, stepKey, stepData, currentStep, highestCompletedStep)
      } catch (e) {
        console.error('[enrollment save]', e)
      }
    },
    [user?.id]
  )

  /** Persist entire draft snapshot into review_data + mark columns (used on final submit). */
  const saveCompleteEnrollment = useCallback(async () => {
    if (!user?.id) return
    const state = useEnrollmentDraftStore.getState()
    const { draftData, currentStep, highestCompletedStep } = state
    const snapshot = {
      ...draftData,
      savedAt: new Date().toISOString(),
    }
    try {
      await saveEnrollmentStep(user.id, 'review', snapshot as Record<string, unknown>, currentStep, Math.max(highestCompletedStep, 7))
    } catch (e) {
      console.error('[enrollment save complete]', e)
    }
  }, [user?.id])

  return { saveToSupabase, saveCompleteEnrollment }
}
