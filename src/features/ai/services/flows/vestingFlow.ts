import type { CoreAIStructuredPayload } from '../../types'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'
import { isVestedGuidedContext, runVestedGuidedFlow, startVestedGuidedFlow } from './vestedGuidedFlow'

export function vestingFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null = null): LocalAIResult {
  const ctx = state.context
  if (state.step === 0) return startVestedGuidedFlow()
  if (state.step === 1 && isVestedGuidedContext(ctx)) return runVestedGuidedFlow(state, input.trim(), structured)
  return { messages: [], nextState: null }
}
