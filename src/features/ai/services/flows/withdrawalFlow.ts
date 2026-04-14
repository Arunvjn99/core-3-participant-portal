import type { CoreAIStructuredPayload } from '../../types'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'
import { isWithdrawalGuidedContext, runWithdrawalGuidedFlow, startWithdrawalGuidedFlow } from './withdrawalGuidedFlow'

export function withdrawalFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null = null): LocalAIResult {
  const ctx = state.context
  if (state.step === 0) return startWithdrawalGuidedFlow()
  if (state.step === 1 && isWithdrawalGuidedContext(ctx)) return runWithdrawalGuidedFlow(state, input.trim(), structured)
  return { messages: [], nextState: null }
}
