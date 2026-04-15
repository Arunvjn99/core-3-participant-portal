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
  'Start enrolment',
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
      return { messages: [assistantMessage("That one glitched on me — mind asking again a different way? Or tap a suggestion.", { suggestions: FALLBACK_SUGGESTIONS })], nextState: null }
    }

    if (!flowState?.type) {
      if (structured.action === 'success_card_dismiss') return { messages: [], nextState: null, navigate: '/transactions/loan' }
      if (structured.action === 'vested_dismiss')
        return {
          messages: [],
          nextState: null,
          navigate: dashboardPath(useEnrollmentDraftStore.getState().enrollmentStatus === 'complete'),
        }
      return { messages: [assistantMessage("Yeah, I can't resume that halfway from here — annoying, I know. Say **apply loan** and we'll run it from the top.", { suggestions: ['Apply for a loan'] })], nextState: null }
    }
    return runFlow(flowState, '', structured)
  }

  const trimmed = input.trim()
  if (!trimmed) return { messages: [], nextState: flowState }

  if (/^(cancel|stop|never mind|forget it)\b/i.test(trimmed)) {
    return { messages: [assistantMessage("No stress — when something pops up, just ask.")], nextState: null }
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

  return { messages: [assistantMessage("I didn't quite get that — want to try loans, a withdrawal, enrolment, or something about vesting? Or tap below.", { suggestions: FALLBACK_SUGGESTIONS })], nextState: null }
}
