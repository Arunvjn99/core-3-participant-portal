import type { CoreAIStructuredPayload } from '../../types'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'
import { isEnrollmentGuidedContext, runEnrollmentGuidedFlow, startEnrollmentGuidedFlow } from './enrollmentGuidedFlow'

export function enrollmentFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null = null): LocalAIResult {
  const ctx = state.context
  if (state.step === 0) return startEnrollmentGuidedFlow()
  if (state.step === 1 && isEnrollmentGuidedContext(ctx)) return runEnrollmentGuidedFlow(state, input.trim(), structured)
  return { messages: [], nextState: null }
}
