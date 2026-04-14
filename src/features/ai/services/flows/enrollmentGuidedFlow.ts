import { assistantMessage } from '../messageUtils'
import type { CoreAIStructuredPayload, EnrollmentReviewPayload, EnrollmentSetupPayload, SuccessCardPayload } from '../../types'
import { ENROLLMENT_AI_STATE_KEY, type EnrollmentAIState } from '../../store/enrollmentAIState'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'

function enrollmentNextState(enrollmentAI: EnrollmentAIState): LocalFlowState {
  return { type: 'enrollment', step: 1, context: { guided: true, [ENROLLMENT_AI_STATE_KEY]: enrollmentAI } }
}

function setupPayload(): EnrollmentSetupPayload {
  return {
    planOptions: [{ label: 'Pre-tax (Traditional 401k)', value: 'traditional' }, { label: 'Roth 401k', value: 'roth' }],
    contributionMin: 1, contributionMax: 20, contributionValue: 5,
    investmentOptions: ['Target Date Fund', 'Manual Allocation', 'Advisor Recommended'],
  }
}

function enrollmentReviewPayload(enrollmentAI: EnrollmentAIState): EnrollmentReviewPayload {
  return { plan: enrollmentAI.data.plan ?? 'roth', contribution: enrollmentAI.data.contribution ?? 5, investment: enrollmentAI.data.investment ?? 'target' }
}

function buildSuccessPayload(): SuccessCardPayload {
  return { title: "You're enrolled!", description: 'Your retirement plan is now active', processingTime: 'Active immediately', reassuranceMessage: 'Your first contribution will be taken from your next paycheck.', actionLabel: 'Done' }
}

export function startEnrollmentGuidedFlow(): LocalAIResult {
  const enrollmentAI: EnrollmentAIState = { step: 'setup', data: {} }
  return {
    messages: [assistantMessage('Set up your plan in one step.', { interactiveType: 'enrollment_setup_card', interactivePayload: setupPayload() })],
    nextState: enrollmentNextState(enrollmentAI),
  }
}

export function runEnrollmentGuidedFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null): LocalAIResult {
  const ctx = state.context
  const enrollmentAI = ctx[ENROLLMENT_AI_STATE_KEY] as EnrollmentAIState

  if (structured) {
    if (enrollmentAI.step === 'setup' && structured.action === 'enrollment_setup_continue') {
      const next: EnrollmentAIState = { ...enrollmentAI, step: 'review', data: { plan: structured.plan, contribution: structured.contribution, investment: structured.investment } }
      return { messages: [assistantMessage('Review and submit.', { interactiveType: 'enrollment_review_card', interactivePayload: enrollmentReviewPayload(next) })], nextState: enrollmentNextState(next) }
    }
    if (enrollmentAI.step === 'review' && structured.action === 'enrollment_review_submit') {
      const next: EnrollmentAIState = { ...enrollmentAI, step: 'success' }
      return { messages: [assistantMessage('Congratulations!', { interactiveType: 'success_card', interactivePayload: buildSuccessPayload() })], nextState: enrollmentNextState(next) }
    }
    if (enrollmentAI.step === 'success' && structured.action === 'success_card_dismiss') {
      return { messages: [], nextState: null, navigate: '/enrollment/plan' }
    }
  }

  const trimmed = input.trim()
  if (/^(yes|continue|ok)\b/i.test(trimmed)) {
    if (enrollmentAI.step === 'setup') return { messages: [assistantMessage('Use the card above to set plan, contribution, and investment.', { interactiveType: 'enrollment_setup_card', interactivePayload: setupPayload() })], nextState: enrollmentNextState(enrollmentAI) }
    if (enrollmentAI.step === 'review') return { messages: [assistantMessage('Tap **Submit enrollment** on the card.', { interactiveType: 'enrollment_review_card', interactivePayload: enrollmentReviewPayload(enrollmentAI) })], nextState: enrollmentNextState(enrollmentAI) }
  }

  if (enrollmentAI.step === 'success') return { messages: [assistantMessage('Tap **Done** to continue.', { interactiveType: 'success_card', interactivePayload: buildSuccessPayload() })], nextState: enrollmentNextState(enrollmentAI) }

  return { messages: [assistantMessage('Use the controls above to continue.', { interactiveType: enrollmentAI.step === 'setup' ? 'enrollment_setup_card' : 'enrollment_review_card', interactivePayload: enrollmentAI.step === 'setup' ? setupPayload() : enrollmentReviewPayload(enrollmentAI) })], nextState: enrollmentNextState(enrollmentAI) }
}

export function isEnrollmentGuidedContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[ENROLLMENT_AI_STATE_KEY] != null
}
