import { assistantMessage } from '../messageUtils'
import { getUserFinancials } from '../userFinancials'
import type { BalanceCardPayload, CoreAIStructuredPayload, InfoCardPayload } from '../../types'
import { getVestedInsight } from '../insights'
import { VESTED_AI_STATE_KEY, type VestedAIState } from '../../store/vestedAIState'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'

function vestedNextState(vestedAI: VestedAIState): LocalFlowState {
  return { type: 'vesting', step: 1, context: { guided: true, [VESTED_AI_STATE_KEY]: vestedAI } }
}

function balancePayload(): BalanceCardPayload {
  const f = getUserFinancials()
  return { total: f.totalBalance, vested: f.vestedBalance, unvested: f.totalBalance - f.vestedBalance }
}

function insightPayload(): InfoCardPayload {
  const f = getUserFinancials()
  const vestedPct = f.totalBalance > 0 ? Math.round((f.vestedBalance / f.totalBalance) * 100) : 0
  const unvested = f.totalBalance - f.vestedBalance
  return {
    message: `You are **${vestedPct}%** vested. Vested balance is the amount you fully own.`,
    vestedPercent: vestedPct,
    insight: getVestedInsight({ total: f.totalBalance, vested: f.vestedBalance, unvested, percent: vestedPct }),
    actionLabel: 'Done',
    action: { action: 'vested_dismiss' },
    suggestions: ['Apply for loan', 'Withdraw', 'Start enrollment'],
  }
}

export function startVestedGuidedFlow(): LocalAIResult {
  const vestedAI: VestedAIState = { step: 'overview', data: {} }
  return {
    messages: [assistantMessage('Your balance.', { interactiveType: 'balance_card', interactivePayload: balancePayload(), suggestions: ['Continue'] })],
    nextState: vestedNextState(vestedAI),
  }
}

export function runVestedGuidedFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null): LocalAIResult {
  const ctx = state.context
  const vestedAI = ctx[VESTED_AI_STATE_KEY] as VestedAIState

  if (structured && structured.action === 'vested_dismiss') {
    return { messages: [], nextState: null, navigate: '/dashboard' }
  }

  const trimmed = input.trim()

  if (vestedAI.step === 'overview') {
    if (/^(continue|next|show)\b/i.test(trimmed)) {
      const next: VestedAIState = { ...vestedAI, step: 'insight' }
      return { messages: [assistantMessage('Insight.', { interactiveType: 'info_card', interactivePayload: insightPayload() })], nextState: vestedNextState(next) }
    }
    return { messages: [assistantMessage('Say **continue** for insight.', { interactiveType: 'balance_card', interactivePayload: balancePayload(), suggestions: ['Continue'] })], nextState: vestedNextState(vestedAI) }
  }

  if (vestedAI.step === 'insight') {
    return { messages: [assistantMessage('Tap **Done** to return.', { interactiveType: 'info_card', interactivePayload: insightPayload() })], nextState: vestedNextState(vestedAI) }
  }

  return { messages: [assistantMessage('Use the controls above.')], nextState: vestedNextState(vestedAI) }
}

export function isVestedGuidedContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[VESTED_AI_STATE_KEY] != null
}
