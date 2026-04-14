import type { ChatMessage } from '../types'

export type LocalFlowType = 'loan' | 'withdrawal' | 'enrollment' | 'vesting'

export interface LocalFlowState {
  type: LocalFlowType
  step: number
  context: Record<string, unknown>
}

export type ResolvedIntent =
  | { kind: 'flow'; flow: LocalFlowType }
  | { kind: 'answer'; content: string; title?: string }
  | { kind: 'action'; action: string }
  | { kind: 'navigate'; route: string }
  | { kind: 'fallback' }

export interface LocalAIResult {
  messages: ChatMessage[]
  nextState: LocalFlowState | null
  action?: string
  navigate?: string
}
