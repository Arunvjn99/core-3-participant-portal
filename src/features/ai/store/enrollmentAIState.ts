export type EnrollmentAIStep = 'setup' | 'review' | 'success'

export type EnrollmentAIState = {
  step: EnrollmentAIStep
  data: {
    plan?: string
    contribution?: number
    investment?: string
  }
}

export const ENROLLMENT_AI_STATE_KEY = 'enrollmentAI' as const
