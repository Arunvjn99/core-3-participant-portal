import type { CoreAIStructuredPayload } from '../../types'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'
import { isRolloverGuidedContext, runRolloverGuidedFlow, startRolloverGuidedFlow } from './rolloverGuidedFlow'

export function rolloverFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null = null): LocalAIResult {
  const ctx = state.context
  if (state.step === 0) return startRolloverGuidedFlow()
  if (state.step === 1 && isRolloverGuidedContext(ctx)) return runRolloverGuidedFlow(state, input.trim(), structured)
  return { messages: [], nextState: null }
}
