import { assistantMessage } from './messageUtils'
import type { LocalAIResult, ResolvedIntent } from '../store/flowTypes'

export function buildResponse(intent: ResolvedIntent): LocalAIResult {
  if (intent.kind === 'answer') {
    return { messages: [assistantMessage(intent.content)], nextState: null }
  }

  if (intent.kind === 'navigate') {
    return { messages: [assistantMessage("Sure — I'll take you there.")], nextState: null, navigate: intent.route }
  }

  if (intent.kind === 'action') {
    return { messages: [assistantMessage('Got it. Jumping you to the screen that handles that.')], nextState: null, action: intent.action }
  }

  return { messages: [], nextState: null }
}
