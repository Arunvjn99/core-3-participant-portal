export type RebalanceAIStep = 'overview' | 'target_selection' | 'review' | 'success'

export type RebalanceAIState = {
  step: RebalanceAIStep
  data: {
    presetId?: string
    presetLabel?: string
  }
}

export const REBALANCE_AI_STATE_KEY = 'rebalanceAI' as const
