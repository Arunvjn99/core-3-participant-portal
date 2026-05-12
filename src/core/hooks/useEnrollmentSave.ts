import { useCallback } from 'react'
import { useAuth } from '@/core/hooks/useAuth'
import { resolveAuthUserId, saveEnrollmentStep } from '@/core/user/userService'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { ENV } from '@/lib/constants'

export type EnrollmentPersistResult =
  | { ok: true }
  | { ok: false; error: string }

function pickErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return String(err ?? 'Unknown error')
}

function extractPersistError(result: { error?: unknown } | null): string | null {
  if (!result || result.error == null) return null
  return pickErrorMessage(result.error)
}

export function useEnrollmentSave() {
  const { user } = useAuth()

  const saveToSupabase = useCallback(
    async (stepKey: string, stepData: Record<string, unknown>): Promise<EnrollmentPersistResult> => {
      const userId = await resolveAuthUserId(user?.id)
      if (!userId) {
        if (ENV.DEMO_MODE) {
          console.info('[Enrollment] Demo mode — enrollment not synced to cloud (local draft only).')
          return { ok: true }
        }
        console.warn(
          '[Enrollment] Skipping cloud save: no authenticated user. Sign in before completing enrollment so progress can sync to the database.',
        )
        return { ok: false, error: 'no_user' }
      }
      const { currentStep, highestCompletedStep } = useEnrollmentDraftStore.getState()
      try {
        const result = await saveEnrollmentStep(userId, stepKey, stepData, currentStep, highestCompletedStep)
        const msg = extractPersistError(result as { error?: unknown })
        if (msg) {
          console.error('[Enrollment] Supabase save failed:', msg, result)
          return { ok: false, error: msg }
        }
        return { ok: true }
      } catch (e) {
        console.error('[Enrollment] save threw:', e)
        return { ok: false, error: pickErrorMessage(e) }
      }
    },
    [user?.id]
  )

  /** Persist entire draft snapshot into review_data + mark columns (used on final submit). */
  const saveCompleteEnrollment = useCallback(async (): Promise<EnrollmentPersistResult> => {
    const userId = await resolveAuthUserId(user?.id)
    if (!userId) {
      if (ENV.DEMO_MODE) {
        console.info('[Enrollment] Demo mode — enrollment not synced to cloud (local draft only).')
        return { ok: true }
      }
      console.warn(
        '[Enrollment] Skipping cloud save: no authenticated user. Sign in before completing enrollment so progress can sync to the database.',
      )
      return { ok: false, error: 'no_user' }
    }
    const state = useEnrollmentDraftStore.getState()
    const { draftData, currentStep, highestCompletedStep } = state
    const snapshot = {
      ...draftData,
      savedAt: new Date().toISOString(),
    }
    try {
      const result = await saveEnrollmentStep(
        userId,
        'review',
        snapshot as Record<string, unknown>,
        currentStep,
        Math.max(highestCompletedStep, 7),
      )
      const msg = extractPersistError(result as { error?: unknown })
      if (msg) {
        console.error('[Enrollment] Supabase complete-save failed:', msg, result)
        return { ok: false, error: msg }
      }
      return { ok: true }
    } catch (e) {
      console.error('[Enrollment] saveCompleteEnrollment threw:', e)
      return { ok: false, error: pickErrorMessage(e) }
    }
  }, [user?.id])

  return { saveToSupabase, saveCompleteEnrollment }
}
