import { buildResponse } from './responseBuilder'
import { resolveIntent } from './intentResolver'
import { assistantMessage } from './messageUtils'
import { runFlow } from './flows/flowEngine'
import type { CoreAIStructuredPayload } from '../types'
import type { LocalAIResult, LocalFlowState } from '../store/flowTypes'
import { parseLoanInput } from './parseLoanInput'
import { getFAQById } from './faqAnswers'

const FALLBACK_SUGGESTIONS = [
  'Apply for a loan',
  'Withdraw money',
  'Start enrollment',
  'What is my vested balance?',
]

export function handleLocalAI(
  input: string,
  flowState: LocalFlowState | null,
  structured: CoreAIStructuredPayload | null = null,
): LocalAIResult {
  if (structured) {
    if (structured.action === 'info_card_suggestion') {
      return handleLocalAI(structured.suggestion, null, null)
    }

    if (structured.action === 'FAQ_DETAIL') {
      const entry = getFAQById(structured.faqId)
      if (entry) return { messages: [assistantMessage(entry.fullAnswer)], nextState: null }
      return { messages: [assistantMessage("I couldn't load that help topic. Try asking again in your own words, or pick a suggestion below.", { suggestions: FALLBACK_SUGGESTIONS })], nextState: null }
    }

    if (!flowState?.type) {
      if (structured.action === 'success_card_dismiss') return { messages: [], nextState: null, navigate: '/transactions/loan' }
      if (structured.action === 'vested_dismiss') return { messages: [], nextState: null, navigate: '/dashboard' }
      return { messages: [assistantMessage("That step couldn't be resumed in this chat. Say **apply loan** to continue.", { suggestions: ['Apply for a loan'] })], nextState: null }
    }
    return runFlow(flowState, '', structured)
  }

  const trimmed = input.trim()
  if (!trimmed) return { messages: [], nextState: flowState }

  if (/^(cancel|stop|never mind|forget it)\b/i.test(trimmed)) {
    return { messages: [assistantMessage("No problem — ask me anything about your plan when you're ready.")], nextState: null }
  }

  if (flowState?.type) return runFlow(flowState, trimmed, null)

  const loanDiscovery = /\b(apply|take|get|need)\s+(a\s+)?loan\b|\bloan\s+options?\b|\bhow\s+(do|can)\s+i\s+borrow\b|\bcan\s+i\s+take\s+(?:out\s+)?(?:a\s+)?loan\b/i.test(trimmed)
  if (loanDiscovery) return runFlow({ type: 'loan', step: 0, context: {} }, trimmed, null)

  const parsedLoan = parseLoanInput(trimmed)
  if (parsedLoan.amount != null && (/\b(loan|borrow|401\s*k|lending|lend)\b/i.test(trimmed) || (parsedLoan.purpose !== 'general' && !/\b(contribution|deferral|enroll|withdraw|distribution)\b/i.test(trimmed)))) {
    return runFlow({ type: 'loan', step: 0, context: {} }, trimmed, null)
  }

  const intent = resolveIntent(trimmed)
  if (intent.kind === 'flow') return runFlow({ type: intent.flow, step: 0, context: {} }, trimmed, null)
  if (intent.kind === 'answer' || intent.kind === 'navigate' || intent.kind === 'action') return buildResponse(intent)

  return { messages: [assistantMessage('I can help with **loans**, **withdrawals**, **enrollment**, **vesting**, contributions, and common plan questions. What would you like to do?', { suggestions: FALLBACK_SUGGESTIONS })], nextState: null }
}
