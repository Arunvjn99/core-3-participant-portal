import { assistantMessage } from '../messageUtils'
import type {
  CoreAIStructuredPayload,
  RolloverReviewPayload,
  RolloverTypeCardPayload,
  SuccessCardPayload,
} from '../../types'
import { ROLLOVER_AI_STATE_KEY, type RolloverAIState } from '../../store/rolloverAIState'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'

function rolloverNextState(rolloverAI: RolloverAIState): LocalFlowState {
  return { type: 'rollover', step: 1, context: { guided: true, [ROLLOVER_AI_STATE_KEY]: rolloverAI } }
}

function typeSelectionPayload(): RolloverTypeCardPayload {
  return {
    options: [
      { id: 'old_401k', label: 'Old 401(k) or 403(b)', description: 'Roll over from a previous employer retirement plan', icon: 'building' },
      { id: 'traditional_ira', label: 'Traditional IRA', description: 'Move funds from an existing IRA into this plan', icon: 'bank' },
      { id: 'roth_ira', label: 'Roth IRA', description: 'Roll Roth IRA funds — tax treatment rules apply', icon: 'shield' },
    ],
  }
}

function reviewPayload(rolloverAI: RolloverAIState): RolloverReviewPayload {
  return {
    rolloverType: rolloverAI.data.rolloverType ?? 'old_401k',
    rolloverTypeLabel: rolloverAI.data.rolloverTypeLabel ?? 'Old 401(k)',
    estimatedAmount: rolloverAI.data.estimatedAmount,
  }
}

function buildSuccessPayload(): SuccessCardPayload {
  return {
    title: 'Rollover request initiated',
    description: "We'll contact your previous provider to start the transfer.",
    processingTime: '3–10 business days',
    reassuranceMessage: 'You can upload transfer documents in the rollover center. A confirmation will be sent to your email.',
    actionLabel: 'View rollover status',
  }
}

export function startRolloverGuidedFlow(): LocalAIResult {
  const rolloverAI: RolloverAIState = { step: 'type_selection', data: {} }
  return {
    messages: [
      assistantMessage(
        "Rolling over an old account is a great way to consolidate your retirement savings. What type of account are you rolling in?",
        {
          interactiveType: 'rollover_type_card',
          interactivePayload: typeSelectionPayload(),
          flowStep: { current: 1, total: 3, label: 'Account Type' },
        },
      ),
    ],
    nextState: rolloverNextState(rolloverAI),
  }
}

export function runRolloverGuidedFlow(
  state: LocalFlowState,
  _input: string,
  structured: CoreAIStructuredPayload | null,
): LocalAIResult {
  const ctx = state.context
  const rolloverAI = ctx[ROLLOVER_AI_STATE_KEY] as RolloverAIState

  if (structured) {
    // Step 1 → 2: Type selected, show review
    if (structured.action === 'rollover_type_selected') {
      const next: RolloverAIState = {
        ...rolloverAI,
        step: 'review',
        data: { rolloverType: structured.rolloverType, rolloverTypeLabel: structured.rolloverTypeLabel },
      }
      return {
        messages: [
          assistantMessage(
            `**${structured.rolloverTypeLabel}** — good choice. Here's a summary of what the rollover process looks like. You'll need to contact your previous plan to initiate the transfer. We'll handle things on our end.`,
            {
              interactiveType: 'rollover_review_card',
              interactivePayload: reviewPayload(next),
              flowStep: { current: 2, total: 3, label: 'Review & Confirm' },
            },
          ),
        ],
        nextState: rolloverNextState(next),
      }
    }

    // Step 2 → 3: Submit
    if (rolloverAI.step === 'review' && structured.action === 'rollover_review_submit') {
      const next: RolloverAIState = { ...rolloverAI, step: 'success' }
      return {
        messages: [
          assistantMessage("Your rollover is initiated. Here's what happens next.", {
            interactiveType: 'success_card',
            interactivePayload: buildSuccessPayload(),
            flowStep: { current: 3, total: 3, label: 'Complete' },
          }),
        ],
        nextState: rolloverNextState(next),
      }
    }

    if (rolloverAI.step === 'success' && structured.action === 'success_card_dismiss') {
      return { messages: [], nextState: null, navigate: '/transactions/rollover' }
    }
  }

  // Text fallback
  const fallbackMap: Record<string, { type: string; payload: unknown; step: { current: number; total: number; label: string } }> = {
    type_selection: { type: 'rollover_type_card', payload: typeSelectionPayload(), step: { current: 1, total: 3, label: 'Account Type' } },
    review: { type: 'rollover_review_card', payload: reviewPayload(rolloverAI), step: { current: 2, total: 3, label: 'Review & Confirm' } },
    success: { type: 'success_card', payload: buildSuccessPayload(), step: { current: 3, total: 3, label: 'Complete' } },
  }

  const current = fallbackMap[rolloverAI.step]
  if (current) {
    return {
      messages: [
        assistantMessage('Use the panel on the right to continue your rollover.', {
          interactiveType: current.type,
          interactivePayload: current.payload,
          flowStep: current.step,
        }),
      ],
      nextState: rolloverNextState(rolloverAI),
    }
  }

  return {
    messages: [
      assistantMessage("Let's get your rollover started. What type of account are you rolling in?", {
        interactiveType: 'rollover_type_card',
        interactivePayload: typeSelectionPayload(),
        flowStep: { current: 1, total: 3, label: 'Account Type' },
      }),
    ],
    nextState: rolloverNextState(rolloverAI),
  }
}

export function isRolloverGuidedContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[ROLLOVER_AI_STATE_KEY] != null
}
