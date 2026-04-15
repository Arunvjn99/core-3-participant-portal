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
      if (isNegative(trimmed)) return { messages: [assistantMessage('Cool — try a smaller number whenever, or say **apply loan** to see the snapshot again.')], nextState: null }
      return { messages: [assistantMessage(`So the max I can do here is ${money(suggested)} — want me to roll with that? Just yes or no.`)], nextState: { type: 'loan', step: 2, context: { ...ctx } } }
    }

    return { messages: [assistantMessage('What do you want to do — or say **apply loan** if you want to reset.')], nextState: null }
  }

  if (state.step === 0) {
    if (amount != null) {
      if (amount <= maxLoan) return startGuidedLoanFlow(amount, purpose, financials)
      return {
        messages: [assistantMessage([`So you wanted ${money(amount)} — got it.`, '', `Your vested piece is about ${money(financials.vestedBalance)}, so in this walkthrough the ceiling is ${money(maxLoan)} (we're faking a simple half-of-vested kind of rule).`, '', `Still want to borrow ${money(maxLoan)}? Just say yes or no.`, '', `(I'm keeping your reason as ${purposeDisplayLabel(purpose)}.)`].join('\n'))],
        nextState: { type: 'loan', step: 2, context: { awaitingMaxConfirm: true, suggestedAmount: maxLoan, maxLoan, purpose } },
      }
    }
    return {
      messages: [assistantMessage([`Okay, rough numbers — not gospel, just so we're on the same page:`, '', `Total in the account: about ${money(financials.totalBalance)}`, `Vested (actually yours): about ${money(financials.vestedBalance)}`, `Ballpark max loan in this demo: ${money(maxLoan)}`, '', `What amount were you picturing? You can say something like "4500 for the house" — casual is fine.`].join('\n'))],
      nextState: { type: 'loan', step: 1, context: { maxLoan } },
    }
  }

  if (state.step === 1) {
    const cap = (ctx.maxLoan as number) ?? maxLoan
    if (amount == null && /\b(max|maximum|as much as possible|highest|full eligible)\b/i.test(trimmed)) {
      amount = cap
      purpose = parseLoanInput(trimmed).purpose
    }
    if (amount == null) return { messages: [assistantMessage('I need an actual number — 3000, $4,500, whatever — or say **max** if you want the ceiling.')], nextState: { type: 'loan', step: 1, context: { ...ctx } } }
    if (amount <= cap) return startGuidedLoanFlow(amount, purpose, financials)
    return {
      messages: [assistantMessage([`${money(amount)} is over the line for what this demo allows — the cap here is ${money(cap)}.`, '', `Want to just do ${money(cap)} instead? Yes or no works.`, '', `(Still tagging this as ${purposeDisplayLabel(purpose)}.)`].join('\n'))],
      nextState: { type: 'loan', step: 2, context: { awaitingMaxConfirm: true, suggestedAmount: cap, maxLoan: cap, purpose } },
    }
  }

  return { messages: [], nextState: null }
}
