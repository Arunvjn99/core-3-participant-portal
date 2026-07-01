import type { CoreAIStructuredPayload } from '../../types'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'
import { isRebalanceGuidedContext, runRebalanceGuidedFlow, startRebalanceGuidedFlow } from './rebalanceGuidedFlow'

export function rebalanceFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null = null): LocalAIResult {
  const ctx = state.context
  if (state.step === 0) return startRebalanceGuidedFlow()
  if (state.step === 1 && isRebalanceGuidedContext(ctx)) return runRebalanceGuidedFlow(state, input.trim(), structured)
  return { messages: [], nextState: null }
}
