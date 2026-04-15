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
    messages: [assistantMessage(`Here's how much you can take in this demo — up to **${money(maxWithdraw)}**. Drag the slider to pick an amount, then tap continue.`, { interactiveType: 'withdrawal_slider_card', interactivePayload: withdrawalSliderPayload(maxWithdraw, 2000) })],
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
      return { messages: [assistantMessage('How would you like this sent — bank transfer or check?', { interactiveType: 'selection_card', interactivePayload: methodPayload() })], nextState: withdrawalNextState(next) }
    }
    if (withdrawalAI.step === 'method' && structured.action === 'selection_card_pick') {
      const next: WithdrawalAIState = { ...withdrawalAI, step: 'review', data: { ...withdrawalAI.data, method: structured.value } }
      return { messages: [assistantMessage('Give this a quick once-over before we send it.', { interactiveType: 'withdrawal_review_card', interactivePayload: withdrawalReviewPayload(next) })], nextState: withdrawalNextState(next) }
    }
    if (withdrawalAI.step === 'review' && structured.action === 'withdrawal_review_submit') {
      const next: WithdrawalAIState = { ...withdrawalAI, step: 'success' }
      return { messages: [assistantMessage('Hang tight — we\'re processing that now.', { interactiveType: 'success_card', interactivePayload: buildSuccessPayload() })], nextState: withdrawalNextState(next) }
    }
    if (withdrawalAI.step === 'success' && structured.action === 'success_card_dismiss') {
      return { messages: [], nextState: null, navigate: '/transactions' }
    }
  }

  const amt = withdrawalAI.data.amount ?? 2000
  if (withdrawalAI.step === 'amount_selection') return { messages: [assistantMessage('Slide to the amount you want, then hit **Continue**.', { interactiveType: 'withdrawal_slider_card', interactivePayload: withdrawalSliderPayload(maxWithdraw, amt) })], nextState: withdrawalNextState(withdrawalAI) }
  if (withdrawalAI.step === 'method') return { messages: [assistantMessage('Choose how you\'d like to receive it.', { interactiveType: 'selection_card', interactivePayload: methodPayload() })], nextState: withdrawalNextState(withdrawalAI) }
  if (withdrawalAI.step === 'review') return { messages: [assistantMessage('Looks good? Tap **Submit withdrawal** when you\'re ready.', { interactiveType: 'withdrawal_review_card', interactivePayload: withdrawalReviewPayload(withdrawalAI) })], nextState: withdrawalNextState(withdrawalAI) }
  if (withdrawalAI.step === 'success') return { messages: [assistantMessage('All set — tap **Done** when you\'re finished here.', { interactiveType: 'success_card', interactivePayload: buildSuccessPayload() })], nextState: withdrawalNextState(withdrawalAI) }

  return { messages: [assistantMessage('Use the card above to keep going.')], nextState: withdrawalNextState(withdrawalAI) }
}

export function isWithdrawalGuidedContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[WITHDRAWAL_AI_STATE_KEY] != null
}
