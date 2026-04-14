export type VestedAIStep = 'overview' | 'insight'

export type VestedAIState = {
  step: VestedAIStep
  data: Record<string, unknown>
}

export const VESTED_AI_STATE_KEY = 'vestedAI' as const
