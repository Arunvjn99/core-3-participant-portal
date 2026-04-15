import { assistantMessage } from '../messageUtils'
import { getUserFinancials } from '../userFinancials'
import type { CoreAIStructuredPayload, SelectionCardPayload, SuccessCardPayload, WithdrawalReviewPayload, WithdrawalSliderPayload } from '../../types'
import { WITHDRAWAL_AI_STATE_KEY, type WithdrawalAIState } from '../../store/withdrawalAIState'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'

const TAX_RATE = 0.1

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function withdrawalNextState(withdrawalAI: WithdrawalAIState): LocalFlowState {
  return { type: 'withdrawal', step: 1, context: { guided: true, [WITHDRAWAL_AI_STATE_KEY]: withdrawalAI } }
}

function withdrawalSliderPayload(max: number, value: number): WithdrawalSliderPayload {
  const amt = Math.min(max, Math.max(500, value))
  const tax = Math.round(amt * TAX_RATE)
  return { min: 500, max, value: amt, tax, net: amt - tax }
}

function methodPayload(): SelectionCardPayload {
  return { title: 'Where should we send the money?', options: [{ label: 'Bank transfer (ACH)', value: 'eft' }, { label: 'Check (mailed)', value: 'check' }], insight: 'ACH is usually fastest; checks often take about 5–7 business days.' }
}

function withdrawalReviewPayload(withdrawalAI: WithdrawalAIState): WithdrawalReviewPayload {
  const amount = withdrawalAI.data.amount ?? 2000
  const tax = Math.round(amount * TAX_RATE)
  return { amount, tax, net: amount - tax }
}

function buildSuccessPayload(): SuccessCardPayload {
  return { title: 'Withdrawal is on its way', description: 'Funds usually land in about 2–3 business days.', processingTime: '2–3 business days', reassuranceMessage: "We'll ping you when the transfer wraps up.", actionLabel: 'Done' }
}

export function startWithdrawalGuidedFlow(): LocalAIResult {
  const financials = getUserFinancials()
  const maxWithdraw = Math.min(5000, Math.round(financials.vestedBalance * 0.3))
  const withdrawalAI: WithdrawalAIState = { step: 'amount_selection', data: {} }
  return {
    messages: [assistantMessage(`So in this demo you can pull up to about ${money(maxWithdraw)} — slide to whatever feels reasonable, then hit continue.`, { interactiveType: 'withdrawal_slider_card', interactivePayload: withdrawalSliderPayload(maxWithdraw, 2000) })],
    nextState: withdrawalNextState(withdrawalAI),
  }
}

export function runWithdrawalGuidedFlow(state: LocalFlowState, _input: string, structured: CoreAIStructuredPayload | null): LocalAIResult {
  const ctx = state.context
  const withdrawalAI = ctx[WITHDRAWAL_AI_STATE_KEY] as WithdrawalAIState
  const financials = getUserFinancials()
  const maxWithdraw = Math.min(5000, Math.round(financials.vestedBalance * 0.3))

  if (structured) {
    if (withdrawalAI.step === 'amount_selection' && structured.action === 'withdrawal_amount_continue') {
      const next: WithdrawalAIState = { ...withdrawalAI, step: 'method', data: { ...withdrawalAI.data, amount: structured.value } }
      return { messages: [assistantMessage('Direct deposit or old-school check — what works for you?', { interactiveType: 'selection_card', interactivePayload: methodPayload() })], nextState: withdrawalNextState(next) }
    }
    if (withdrawalAI.step === 'method' && structured.action === 'selection_card_pick') {
      const next: WithdrawalAIState = { ...withdrawalAI, step: 'review', data: { ...withdrawalAI.data, method: structured.value } }
      return { messages: [assistantMessage('Skim this — taxes and timing are the parts people miss.', { interactiveType: 'withdrawal_review_card', interactivePayload: withdrawalReviewPayload(next) })], nextState: withdrawalNextState(next) }
    }
    if (withdrawalAI.step === 'review' && structured.action === 'withdrawal_review_submit') {
      const next: WithdrawalAIState = { ...withdrawalAI, step: 'success' }
      return { messages: [assistantMessage('Kicking that off now — shouldn\'t take long.', { interactiveType: 'success_card', interactivePayload: buildSuccessPayload() })], nextState: withdrawalNextState(next) }
    }
    if (withdrawalAI.step === 'success' && structured.action === 'success_card_dismiss') {
      return { messages: [], nextState: null, navigate: '/transactions' }
    }
  }

  const amt = withdrawalAI.data.amount ?? 2000
  if (withdrawalAI.step === 'amount_selection') return { messages: [assistantMessage('Drag the slider, then continue — you can always change your mind before it\'s final.', { interactiveType: 'withdrawal_slider_card', interactivePayload: withdrawalSliderPayload(maxWithdraw, amt) })], nextState: withdrawalNextState(withdrawalAI) }
  if (withdrawalAI.step === 'method') return { messages: [assistantMessage('ACH or check — your call.', { interactiveType: 'selection_card', interactivePayload: methodPayload() })], nextState: withdrawalNextState(withdrawalAI) }
  if (withdrawalAI.step === 'review') return { messages: [assistantMessage('If the numbers look sane, submit. If not, don\'t — seriously.', { interactiveType: 'withdrawal_review_card', interactivePayload: withdrawalReviewPayload(withdrawalAI) })], nextState: withdrawalNextState(withdrawalAI) }
  if (withdrawalAI.step === 'success') return { messages: [assistantMessage('That\'s a wrap — hit done when you\'re ready to close this.', { interactiveType: 'success_card', interactivePayload: buildSuccessPayload() })], nextState: withdrawalNextState(withdrawalAI) }

  return { messages: [assistantMessage('The card above is where the action is.')], nextState: withdrawalNextState(withdrawalAI) }
}

export function isWithdrawalGuidedContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[WITHDRAWAL_AI_STATE_KEY] != null
}
