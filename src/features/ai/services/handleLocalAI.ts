import { dashboardPath } from '@/lib/constants'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
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
  'Rebalance my portfolio',
  'Roll over an old 401k',
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
      return {
        messages: [assistantMessage("That one hit a snag — try asking again a different way.", { suggestions: FALLBACK_SUGGESTIONS })],
        nextState: null,
      }
    }

    if (!flowState?.type) {
      if (structured.action === 'success_card_dismiss') return { messages: [], nextState: null, navigate: '/transactions/loan' }
      if (structured.action === 'vested_dismiss') {
        return {
          messages: [],
          nextState: null,
          navigate: dashboardPath(useEnrollmentDraftStore.getState().enrollmentStatus === 'complete'),
        }
      }
      return {
        messages: [
          assistantMessage("I can't resume that flow from here. Start fresh by typing what you'd like to do.", {
            suggestions: FALLBACK_SUGGESTIONS,
          }),
        ],
        nextState: null,
      }
    }
    return runFlow(flowState, '', structured)
  }

  const trimmed = input.trim()
  if (!trimmed) return { messages: [], nextState: flowState }

  if (/^(cancel|stop|never mind|forget it|exit|quit)\b/i.test(trimmed)) {
    return { messages: [assistantMessage("No problem — I'm here whenever you need help.", { suggestions: FALLBACK_SUGGESTIONS })], nextState: null }
  }

  if (flowState?.type) return runFlow(flowState, trimmed, null)

  // Informational questions ("what is X?", "how does X work?", "explain X", "tell me about X")
  // should go to LLM for rich domain answers instead of being caught by keyword matchers.
  const isInformational = /^(what\s+is|what\s+are|what'?s|how\s+does|how\s+do|how\s+is|explain|tell\s+me\s+(about|more)|why\s+(is|do|does)|define|describe|difference\s+between|pros?\s+and\s+cons?|should\s+i|is\s+it\s+(worth|good|better)|can\s+you\s+explain)/i.test(trimmed.trim())
  if (isInformational) return { messages: [], nextState: null, isLLMFallback: true }

  // Rebalance intent detection — action phrases only
  if (/\b(rebalance|reallocate|change.*allocation|adjust.*portfolio|new.*allocation)\b/i.test(trimmed)) {
    return runFlow({ type: 'rebalance', step: 0, context: {} }, trimmed, null)
  }

  // Rollover intent detection — action phrases only
  if (/\b(rollover|roll over|roll.*old.*401|transfer.*old|bring.*old)\b/i.test(trimmed)) {
    return runFlow({ type: 'rollover', step: 0, context: {} }, trimmed, null)
  }

  // Loan intent detection
  const loanDiscovery = /\b(apply|take|get|need)\s+(a\s+)?loan\b|\bloan\s+options?\b|\bhow\s+(do|can)\s+i\s+borrow\b|\bcan\s+i\s+take\s+(?:out\s+)?(?:a\s+)?loan\b/i.test(trimmed)
  if (loanDiscovery) return runFlow({ type: 'loan', step: 0, context: {} }, trimmed, null)

  const parsedLoan = parseLoanInput(trimmed)
  if (
    parsedLoan.amount != null &&
    (/\b(loan|borrow|401\s*k|lending|lend)\b/i.test(trimmed) ||
      (parsedLoan.purpose !== 'general' && !/\b(contribution|deferral|enroll|withdraw|distribution)\b/i.test(trimmed)))
  ) {
    return runFlow({ type: 'loan', step: 0, context: {} }, trimmed, null)
  }

  const intent = resolveIntent(trimmed)
  if (intent.kind === 'flow') return runFlow({ type: intent.flow, step: 0, context: {} }, trimmed, null)
  if (intent.kind === 'answer' || intent.kind === 'navigate' || intent.kind === 'action') return buildResponse(intent)

  return {
    messages: [
      assistantMessage(
        "I didn't catch that — here are some things I can help you with:",
        { suggestions: FALLBACK_SUGGESTIONS },
      ),
    ],
    nextState: null,
    isLLMFallback: true,
  }
}
