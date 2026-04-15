import { assistantMessage } from '../messageUtils'
import { getUserFinancials } from '../userFinancials'
import type { CoreAIStructuredPayload } from '../../types'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'
import { parseLoanInput, purposeDisplayLabel, type LoanFlowPurpose } from '../parseLoanInput'
import { isGuidedLoanContext, runGuidedLoanFlow, startGuidedLoanFlow } from './loanGuidedFlow'

function isAffirmative(input: string): boolean {
  return /^(yes|yeah|yep|sure|ok|okay|proceed|go|apply|continue|start)\b/i.test(input.trim())
}

function isNegative(input: string): boolean {
  return /^(no|nope|cancel|stop|never|not now)\b/i.test(input.trim())
}

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function loanFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null = null): LocalAIResult {
  const trimmed = input.trim()
  let { amount, purpose } = parseLoanInput(trimmed)
  const financials = getUserFinancials()
  const maxLoan = financials.maxLoan
  const ctx = state.context

  if (state.step === 2) {
    if (isGuidedLoanContext(ctx)) return runGuidedLoanFlow(state, trimmed, structured)

    if (ctx.awaitingMaxConfirm === true) {
      const suggested = ctx.suggestedAmount as number
      const storedPurpose = (ctx.purpose as LoanFlowPurpose) ?? 'general'
      if (isAffirmative(trimmed)) return startGuidedLoanFlow(suggested, storedPurpose, financials)
      if (isNegative(trimmed)) return { messages: [assistantMessage('No worries — you can try a **smaller amount** anytime, or say **apply loan** if you want that snapshot again.')], nextState: null }
      return { messages: [assistantMessage(`Want to move forward with **${money(suggested)}**? Just reply **yes** or **no**.`)], nextState: { type: 'loan', step: 2, context: { ...ctx } } }
    }

    return { messages: [assistantMessage('Tell me what you’d like to do next, or say **apply loan** to start over.')], nextState: null }
  }

  if (state.step === 0) {
    if (amount != null) {
      if (amount <= maxLoan) return startGuidedLoanFlow(amount, purpose, financials)
      return {
        messages: [assistantMessage([`You mentioned **${money(amount)}** — thanks for that.`, '', `With your **vested balance** at **${money(financials.vestedBalance)}**, the cap for this demo is **${money(maxLoan)}** (we're using a simple **50%** rule).`, '', `Want to go ahead with **${money(maxLoan)}**? Reply **yes** or **no**.`, '', `I'll keep your purpose as **${purposeDisplayLabel(purpose)}**.`].join('\n'))],
        nextState: { type: 'loan', step: 2, context: { awaitingMaxConfirm: true, suggestedAmount: maxLoan, maxLoan, purpose } },
      }
    }
    return {
      messages: [assistantMessage(["Here's a quick look at your **retirement loan** headroom (sample numbers):", '', `**Total balance:** ${money(financials.totalBalance)}`, `**Vested balance:** ${money(financials.vestedBalance)}`, `**Rough max you could borrow:** ${money(maxLoan)}`, '', '**How much are you thinking?** You can toss in a purpose too — something like "$4,500 for a house" works great.'].join('\n'))],
      nextState: { type: 'loan', step: 1, context: { maxLoan } },
    }
  }

  if (state.step === 1) {
    const cap = (ctx.maxLoan as number) ?? maxLoan
    if (amount == null && /\b(max|maximum|as much as possible|highest|full eligible)\b/i.test(trimmed)) {
      amount = cap
      purpose = parseLoanInput(trimmed).purpose
    }
    if (amount == null) return { messages: [assistantMessage('Could you share a **dollar amount**? Something like **3000** or **$4,500** is perfect — or just say **max** if you want the top of your range.')], nextState: { type: 'loan', step: 1, context: { ...ctx } } }
    if (amount <= cap) return startGuidedLoanFlow(amount, purpose, financials)
    return {
      messages: [assistantMessage([`**${money(amount)}** is above what you're eligible for here — your **max** for this demo is **${money(cap)}**.`, '', `Want to continue with **${money(cap)}** instead? **Yes** or **no** is fine.`, '', `I'm still noting your purpose as **${purposeDisplayLabel(purpose)}**.`].join('\n'))],
      nextState: { type: 'loan', step: 2, context: { awaitingMaxConfirm: true, suggestedAmount: cap, maxLoan: cap, purpose } },
    }
  }

  return { messages: [], nextState: null }
}
