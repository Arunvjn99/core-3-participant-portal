import { assistantMessage } from '../messageUtils'
import { getUserFinancials } from '../userFinancials'
import type {
  CoreAIStructuredPayload,
  SelectionCardPayload,
  SuccessCardPayload,
  WithdrawalReviewPayload,
  WithdrawalSliderPayload,
  WithdrawalTypeCardPayload,
} from '../../types'
import { WITHDRAWAL_AI_STATE_KEY, type WithdrawalAIState } from '../../store/withdrawalAIState'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'

const TAX_RATE = 0.1

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function withdrawalNextState(withdrawalAI: WithdrawalAIState): LocalFlowState {
  return { type: 'withdrawal', step: 1, context: { guided: true, [WITHDRAWAL_AI_STATE_KEY]: withdrawalAI } }
}

function typeSelectionPayload(): WithdrawalTypeCardPayload {
  return {
    options: [
      { id: 'hardship', label: 'Hardship Withdrawal', description: 'For immediate financial need — medical, housing, education', eligible: true },
      { id: 'in_service', label: 'In-Service Withdrawal', description: 'Available if your plan allows while still employed', eligible: true, note: 'Age 59½ required for penalty-free' },
      { id: 'rmd', label: 'Required Minimum Distribution', description: 'Mandatory annual withdrawals starting at age 73', eligible: false, note: 'Contact your plan administrator' },
    ],
  }
}

function withdrawalSliderPayload(max: number, value: number, withdrawalType?: string): WithdrawalSliderPayload {
  const amt = Math.min(max, Math.max(500, value))
  const tax = Math.round(amt * TAX_RATE)
  return { min: 500, max, value: amt, tax, net: amt - tax, withdrawalType }
}

function methodPayload(): SelectionCardPayload {
  return {
    title: 'How should we send the funds?',
    options: [
      { label: 'Bank transfer (ACH)', value: 'eft', description: 'Typically arrives in 2–3 business days' },
      { label: 'Check by mail', value: 'check', description: 'Usually takes 5–7 business days' },
    ],
    insight: 'ACH is the fastest and most secure option.',
  }
}

function withdrawalReviewPayload(withdrawalAI: WithdrawalAIState): WithdrawalReviewPayload {
  const amount = withdrawalAI.data.amount ?? 2_000
  const tax = Math.round(amount * TAX_RATE)
  return { amount, tax, net: amount - tax, withdrawalType: withdrawalAI.data.withdrawalType, method: withdrawalAI.data.method }
}

function buildSuccessPayload(): SuccessCardPayload {
  return {
    title: 'Withdrawal submitted successfully',
    description: 'Your request is being processed.',
    processingTime: '2–3 business days',
    reassuranceMessage: "We'll email you when the transfer is complete. You can track the status in the transactions center.",
    actionLabel: 'View transactions',
  }
}

export function startWithdrawalGuidedFlow(): LocalAIResult {
  const withdrawalAI: WithdrawalAIState = { step: 'type_selection' as WithdrawalAIState['step'], data: {} }
  return {
    messages: [
      assistantMessage(
        'To get started, I need to know the type of withdrawal you need. Different types have different rules and eligibility requirements.',
        {
          interactiveType: 'withdrawal_type_card',
          interactivePayload: typeSelectionPayload(),
          flowStep: { current: 1, total: 4, label: 'Withdrawal Type' },
        },
      ),
    ],
    nextState: withdrawalNextState(withdrawalAI),
  }
}

export function runWithdrawalGuidedFlow(
  state: LocalFlowState,
  _input: string,
  structured: CoreAIStructuredPayload | null,
): LocalAIResult {
  const ctx = state.context
  const withdrawalAI = ctx[WITHDRAWAL_AI_STATE_KEY] as WithdrawalAIState
  const financials = getUserFinancials()
  const maxWithdraw = financials.maxWithdrawal

  if (structured) {
    // Step 1 → 2: Type selected, move to amount
    if (structured.action === 'withdrawal_type_selected') {
      const next: WithdrawalAIState = {
        ...withdrawalAI,
        step: 'amount_selection',
        data: { withdrawalType: structured.withdrawalType, withdrawalTypeLabel: structured.withdrawalTypeLabel },
      }
      return {
        messages: [
          assistantMessage(
            `${structured.withdrawalTypeLabel} — got it. Set your withdrawal amount below. Keep in mind there's an estimated 10% tax withholding on top of income taxes.`,
            {
              interactiveType: 'withdrawal_slider_card',
              interactivePayload: withdrawalSliderPayload(maxWithdraw, Math.round(maxWithdraw * 0.5), structured.withdrawalType),
              flowStep: { current: 2, total: 4, label: 'Set Amount' },
            },
          ),
        ],
        nextState: withdrawalNextState(next),
      }
    }

    // Step 2 → 3: Amount set, move to delivery method
    if (withdrawalAI.step === 'amount_selection' && structured.action === 'withdrawal_amount_continue') {
      const next: WithdrawalAIState = {
        ...withdrawalAI,
        step: 'method',
        data: { ...withdrawalAI.data, amount: structured.value },
      }
      return {
        messages: [
          assistantMessage(`${money(structured.value)} — noted. How do you want to receive the funds?`, {
            interactiveType: 'selection_card',
            interactivePayload: methodPayload(),
            flowStep: { current: 3, total: 4, label: 'Delivery Method' },
          }),
        ],
        nextState: withdrawalNextState(next),
      }
    }

    // Step 3 → 4: Method set, show review
    if (withdrawalAI.step === 'method' && structured.action === 'selection_card_pick') {
      const next: WithdrawalAIState = {
        ...withdrawalAI,
        step: 'review',
        data: { ...withdrawalAI.data, method: structured.value },
      }
      return {
        messages: [
          assistantMessage("One last look before we process this. Check the numbers and confirm when you're ready.", {
            interactiveType: 'withdrawal_review_card',
            interactivePayload: withdrawalReviewPayload(next),
            flowStep: { current: 4, total: 4, label: 'Review & Confirm' },
          }),
        ],
        nextState: withdrawalNextState(next),
      }
    }

    // Step 4: Submit
    if (withdrawalAI.step === 'review' && structured.action === 'withdrawal_review_submit') {
      const next: WithdrawalAIState = { ...withdrawalAI, step: 'success' }
      return {
        messages: [
          assistantMessage('Your withdrawal request has been submitted.', {
            interactiveType: 'success_card',
            interactivePayload: buildSuccessPayload(),
          }),
        ],
        nextState: withdrawalNextState(next),
      }
    }

    if (withdrawalAI.step === 'success' && structured.action === 'success_card_dismiss') {
      return { messages: [], nextState: null, navigate: '/transactions' }
    }
  }

  // Text fallback — re-show current step
  const fallbackMap: Record<
    string,
    { type: string; payload: unknown; step: { current: number; total: number; label: string } }
  > = {
    type_selection: { type: 'withdrawal_type_card', payload: typeSelectionPayload(), step: { current: 1, total: 4, label: 'Withdrawal Type' } },
    amount_selection: {
      type: 'withdrawal_slider_card',
      payload: withdrawalSliderPayload(maxWithdraw, withdrawalAI.data.amount ?? Math.round(maxWithdraw * 0.5), withdrawalAI.data.withdrawalType),
      step: { current: 2, total: 4, label: 'Set Amount' },
    },
    method: { type: 'selection_card', payload: methodPayload(), step: { current: 3, total: 4, label: 'Delivery Method' } },
    review: { type: 'withdrawal_review_card', payload: withdrawalReviewPayload(withdrawalAI), step: { current: 4, total: 4, label: 'Review & Confirm' } },
    success: { type: 'success_card', payload: buildSuccessPayload(), step: { current: 4, total: 4, label: 'Complete' } },
  }

  const current = fallbackMap[withdrawalAI.step as string]
  if (current) {
    return {
      messages: [
        assistantMessage('Use the panel to continue your withdrawal request.', {
          interactiveType: current.type,
          interactivePayload: current.payload,
          flowStep: current.step,
        }),
      ],
      nextState: withdrawalNextState(withdrawalAI),
    }
  }

  return { messages: [assistantMessage("Let's start your withdrawal. Pick the type that applies to you.")], nextState: withdrawalNextState({ step: 'type_selection' as WithdrawalAIState['step'], data: {} }) }
}

export function isWithdrawalGuidedContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[WITHDRAWAL_AI_STATE_KEY] != null
}
