export type WithdrawalAIStep = 'amount_selection' | 'method' | 'review' | 'success'

export type WithdrawalAIState = {
  step: WithdrawalAIStep
  data: {
    amount?: number
    tax?: number
    net?: number
    method?: 'eft' | 'check'
  }
}

export const WITHDRAWAL_AI_STATE_KEY = 'withdrawalAI' as const
