import { assistantMessage } from './messageUtils'
import type { LocalAIResult, ResolvedIntent } from '../store/flowTypes'

export function buildResponse(intent: ResolvedIntent): LocalAIResult {
  if (intent.kind === 'answer') {
    return { messages: [assistantMessage(intent.content)], nextState: null }
  }

  if (intent.kind === 'navigate') {
    return { messages: [assistantMessage('On it — opening that now.')], nextState: null, navigate: intent.route }
  }

  if (intent.kind === 'action') {
    return { messages: [assistantMessage('Yep — sending you to the right screen.')], nextState: null, action: intent.action }
  }

  return { messages: [], nextState: null }
}
