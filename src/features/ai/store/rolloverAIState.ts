export type RolloverAIStep = 'type_selection' | 'details' | 'review' | 'success'

export type RolloverAIState = {
  step: RolloverAIStep
  data: {
    rolloverType?: string
    rolloverTypeLabel?: string
    estimatedAmount?: number
  }
}

export const ROLLOVER_AI_STATE_KEY = 'rolloverAI' as const
