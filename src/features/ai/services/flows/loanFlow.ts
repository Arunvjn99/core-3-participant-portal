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
      if (isNegative(trimmed)) return { messages: [assistantMessage('Understood. You can enter a **lower amount** anytime, or say **apply loan** to see your snapshot again.')], nextState: null }
      return { messages: [assistantMessage(`Reply **yes** to borrow **${money(suggested)}**, or **no** to stop.`)], nextState: { type: 'loan', step: 2, context: { ...ctx } } }
    }

    return { messages: [assistantMessage("Let me know how you'd like to proceed, or start with **apply loan**.")], nextState: null }
  }

  if (state.step === 0) {
    if (amount != null) {
      if (amount <= maxLoan) return startGuidedLoanFlow(amount, purpose, financials)
      return {
        messages: [assistantMessage([`You asked for **${money(amount)}**.`, '', `Based on your **vested balance** (**${money(financials.vestedBalance)}**), the most you can borrow is **${money(maxLoan)}** (mock **50%** rule).`, '', `Would you like to **proceed with ${money(maxLoan)}**? Reply **yes** or **no**.`, '', `Purpose noted: **${purposeDisplayLabel(purpose)}**.`].join('\n'))],
        nextState: { type: 'loan', step: 2, context: { awaitingMaxConfirm: true, suggestedAmount: maxLoan, maxLoan, purpose } },
      }
    }
    return {
      messages: [assistantMessage(["Here's a quick snapshot of your **retirement loan** capacity (mock data):", '', `**Total balance:** ${money(financials.totalBalance)}`, `**Vested balance:** ${money(financials.vestedBalance)}`, `**You can borrow up to:** ${money(maxLoan)}`, '', '**How much would you like to borrow?** You can add a purpose (e.g. "$4,500 for a house").'].join('\n'))],
      nextState: { type: 'loan', step: 1, context: { maxLoan } },
    }
  }

  if (state.step === 1) {
    const cap = (ctx.maxLoan as number) ?? maxLoan
    if (amount == null && /\b(max|maximum|as much as possible|highest|full eligible)\b/i.test(trimmed)) {
      amount = cap
      purpose = parseLoanInput(trimmed).purpose
    }
    if (amount == null) return { messages: [assistantMessage('I need a **valid dollar amount** (for example **3000** or **$4,500**). You can also say **max**.')], nextState: { type: 'loan', step: 1, context: { ...ctx } } }
    if (amount <= cap) return startGuidedLoanFlow(amount, purpose, financials)
    return {
      messages: [assistantMessage([`You requested **${money(amount)}**, but your **max eligible** loan is **${money(cap)}**.`, '', `Would you like to **proceed with ${money(cap)}** instead? Reply **yes** or **no**.`, '', `Purpose: **${purposeDisplayLabel(purpose)}**.`].join('\n'))],
      nextState: { type: 'loan', step: 2, context: { awaitingMaxConfirm: true, suggestedAmount: cap, maxLoan: cap, purpose } },
    }
  }

  return { messages: [], nextState: null }
}
