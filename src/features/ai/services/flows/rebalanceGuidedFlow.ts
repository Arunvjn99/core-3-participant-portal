import { assistantMessage } from '../messageUtils'
import { getUserFinancials, REBALANCE_PRESETS } from '../userFinancials'
import type {
  CoreAIStructuredPayload,
  RebalanceCurrentCardPayload,
  RebalanceReviewPayload,
  SuccessCardPayload,
} from '../../types'
import { REBALANCE_AI_STATE_KEY, type RebalanceAIState } from '../../store/rebalanceAIState'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'

function rebalanceNextState(rebalanceAI: RebalanceAIState): LocalFlowState {
  return { type: 'rebalance', step: 1, context: { guided: true, [REBALANCE_AI_STATE_KEY]: rebalanceAI } }
}

function currentCardPayload(): RebalanceCurrentCardPayload {
  const financials = getUserFinancials()
  return {
    currentAllocation: financials.allocation,
    totalBalance: financials.totalBalance,
    presets: REBALANCE_PRESETS,
  }
}

function reviewPayload(rebalanceAI: RebalanceAIState): RebalanceReviewPayload {
  const financials = getUserFinancials()
  const preset = REBALANCE_PRESETS.find((p) => p.id === rebalanceAI.data.presetId) ?? REBALANCE_PRESETS[1]!
  return {
    currentAllocation: financials.allocation,
    targetPreset: preset,
    totalBalance: financials.totalBalance,
  }
}

function buildSuccessPayload(): SuccessCardPayload {
  return {
    title: 'Rebalance submitted',
    description: 'Your portfolio will be realigned to your selected target allocation.',
    processingTime: '1–2 business days',
    reassuranceMessage: 'Trades execute at end of business day. Check your investments page for confirmation.',
    actionLabel: 'View investments',
  }
}

export function startRebalanceGuidedFlow(): LocalAIResult {
  const rebalanceAI: RebalanceAIState = { step: 'overview', data: {} }
  return {
    messages: [
      assistantMessage(
        "Here's your current portfolio allocation. To rebalance, pick a target strategy that matches your risk level and retirement timeline. I'll show you exactly what trades will happen.",
        {
          interactiveType: 'rebalance_current_card',
          interactivePayload: currentCardPayload(),
          flowStep: { current: 1, total: 3, label: 'Current Portfolio' },
        },
      ),
    ],
    nextState: rebalanceNextState(rebalanceAI),
  }
}

export function runRebalanceGuidedFlow(
  state: LocalFlowState,
  _input: string,
  structured: CoreAIStructuredPayload | null,
): LocalAIResult {
  const ctx = state.context
  const rebalanceAI = ctx[REBALANCE_AI_STATE_KEY] as RebalanceAIState

  if (structured) {
    // Step 1 → 2: Preset selected, show review
    if (structured.action === 'rebalance_preset_selected') {
      const preset = REBALANCE_PRESETS.find((p) => p.id === structured.presetId) ?? REBALANCE_PRESETS[1]!
      const next: RebalanceAIState = {
        ...rebalanceAI,
        step: 'review',
        data: { presetId: structured.presetId, presetLabel: structured.presetLabel },
      }
      return {
        messages: [
          assistantMessage(
            `**${preset.label}** strategy selected — ${preset.description}. Here's exactly what will change in your portfolio. Review the trades before confirming.`,
            {
              interactiveType: 'rebalance_review_card',
              interactivePayload: reviewPayload(next),
              flowStep: { current: 2, total: 3, label: 'Review Trades' },
            },
          ),
        ],
        nextState: rebalanceNextState(next),
      }
    }

    // Step 2 → 3: Submit rebalance
    if (rebalanceAI.step === 'review' && structured.action === 'rebalance_review_submit') {
      const next: RebalanceAIState = { ...rebalanceAI, step: 'success' }
      return {
        messages: [
          assistantMessage('Your rebalance request is in.', {
            interactiveType: 'success_card',
            interactivePayload: buildSuccessPayload(),
            flowStep: { current: 3, total: 3, label: 'Complete' },
          }),
        ],
        nextState: rebalanceNextState(next),
      }
    }

    if (rebalanceAI.step === 'success' && structured.action === 'success_card_dismiss') {
      return { messages: [], nextState: null, navigate: '/investments' }
    }
  }

  // Text fallback
  const fallbackMap: Record<string, { type: string; payload: unknown; step: { current: number; total: number; label: string } }> = {
    overview: { type: 'rebalance_current_card', payload: currentCardPayload(), step: { current: 1, total: 3, label: 'Current Portfolio' } },
    target_selection: { type: 'rebalance_current_card', payload: currentCardPayload(), step: { current: 1, total: 3, label: 'Choose Target' } },
    review: { type: 'rebalance_review_card', payload: reviewPayload(rebalanceAI), step: { current: 2, total: 3, label: 'Review Trades' } },
    success: { type: 'success_card', payload: buildSuccessPayload(), step: { current: 3, total: 3, label: 'Complete' } },
  }

  const current = fallbackMap[rebalanceAI.step]
  if (current) {
    return {
      messages: [
        assistantMessage('Select a target strategy from the panel to continue.', {
          interactiveType: current.type,
          interactivePayload: current.payload,
          flowStep: current.step,
        }),
      ],
      nextState: rebalanceNextState(rebalanceAI),
    }
  }

  return {
    messages: [
      assistantMessage("Let's get your portfolio rebalanced. Here's where you stand now.", {
        interactiveType: 'rebalance_current_card',
        interactivePayload: currentCardPayload(),
        flowStep: { current: 1, total: 3, label: 'Current Portfolio' },
      }),
    ],
    nextState: rebalanceNextState(rebalanceAI),
  }
}

export function isRebalanceGuidedContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[REBALANCE_AI_STATE_KEY] != null
}
