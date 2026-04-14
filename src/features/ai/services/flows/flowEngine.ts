import type { CoreAIStructuredPayload } from '../../types'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'
import { loanFlow } from './loanFlow'
import { withdrawalFlow } from './withdrawalFlow'
import { enrollmentFlow } from './enrollmentFlow'
import { vestingFlow } from './vestingFlow'

export function runFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null = null): LocalAIResult {
  switch (state.type) {
    case 'loan': return loanFlow(state, input, structured)
    case 'withdrawal': return withdrawalFlow(state, input, structured)
    case 'enrollment': return enrollmentFlow(state, input, structured)
    case 'vesting': return vestingFlow(state, input, structured)
    default: return { messages: [], nextState: null }
  }
}
