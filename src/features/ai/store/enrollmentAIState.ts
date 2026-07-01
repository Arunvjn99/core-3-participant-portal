export type EnrollmentAIStep = 'setup' | 'contribution' | 'investment' | 'review' | 'success'

export type EnrollmentAIState = {
  step: EnrollmentAIStep
  data: {
    planId?: string
    planLabel?: string
    contribution?: number
    investment?: string
    investmentLabel?: string
  }
}

export const ENROLLMENT_AI_STATE_KEY = 'enrollmentAI' as const
