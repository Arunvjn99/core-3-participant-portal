import { assistantMessage } from '../messageUtils'
import { getUserFinancials } from '../userFinancials'
import type { CoreAIStructuredPayload, LoanSimulatorCardPayload, SelectionCardPayload, FeesCardPayload, DocumentUploadCardPayload, ReviewCardPayload, SuccessCardPayload } from '../../types'
import { LOAN_AI_STATE_KEY, LOAN_PROCESSING_FEE, LOAN_OTHER_CHARGES, netLoanAmount, type LoanAIState } from '../../store/loanAIState'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'
import { LOAN_AI_ANNUAL_RATE_PERCENT, LOAN_AI_TENURE_MONTHS, generateSchedule } from '../emiCalculator'
import { purposeToLoanTypeId, type LoanFlowPurpose } from '../parseLoanInput'

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function disbursementLabel(method: 'eft' | 'check'): string {
  return method === 'eft' ? 'Bank transfer (ACH)' : 'Check (mailed)'
}

function clampTenure(months: number, min = 12, max = 60, step = 12): number {
  const s = Math.round(months / step) * step
  return Math.min(max, Math.max(min, s))
}

function guidedNextState(loanAI: LoanAIState, extra: Record<string, unknown> = {}): LocalFlowState {
  return { type: 'loan', step: 2, context: { guided: true, [LOAN_AI_STATE_KEY]: loanAI, ...extra } }
}

function buildSimulatorPayload(loanAI: LoanAIState, maxLoan: number): LoanSimulatorCardPayload {
  const maxAmount = maxLoan
  const minAmount = maxAmount < 500 ? maxAmount : 500
  const step = 100
  const rawAmt = loanAI.data.amount ?? maxAmount
  const snapped = Math.round(rawAmt / step) * step
  const amount = Math.min(maxAmount, Math.max(minAmount, snapped))
  const tenureMonths = clampTenure(loanAI.data.tenureMonths ?? LOAN_AI_TENURE_MONTHS)
  return { amount, minAmount, maxAmount, annualRatePercent: LOAN_AI_ANNUAL_RATE_PERCENT, tenureMonths, minTenureMonths: 12, maxTenureMonths: 60, tenureStep: 12, amountStep: step }
}

function buildReviewPayload(loanAI: LoanAIState): ReviewCardPayload {
  const amt = loanAI.data.amount ?? 0
  const tenureMonths = loanAI.data.tenureMonths ?? LOAN_AI_TENURE_MONTHS
  const method = (loanAI.data.paymentMethod === 'check' ? 'check' : 'eft') as 'eft' | 'check'
  const { emi: monthlyPayment, rows } = generateSchedule(amt, LOAN_AI_ANNUAL_RATE_PERCENT, tenureMonths, 3)
  return { title: 'Review & submit', amount: amt, netAmount: netLoanAmount(amt), tenureMonths, monthlyPayment, annualRatePercent: LOAN_AI_ANNUAL_RATE_PERCENT, disbursementLabel: disbursementLabel(method), schedulePreview: rows }
}

function loanPayloadFromState(loan: LoanAIState) {
  const amount = loan.data.amount ?? 0
  const purposeStr = loan.data.purpose ?? 'general'
  return { amount, purpose: purposeStr, loanType: purposeToLoanTypeId(purposeStr as LoanFlowPurpose) }
}

function isAffirmative(input: string): boolean {
  return /^(yes|yeah|yep|sure|ok|okay|proceed|go|continue|start|next)\b/i.test(input.trim())
}

function isNegative(input: string): boolean {
  return /^(no|nope|cancel|stop|never|not now)\b/i.test(input.trim())
}

export function startGuidedLoanFlow(amount: number, purpose: string, financials: ReturnType<typeof getUserFinancials>): LocalAIResult {
  const loanAI: LoanAIState = { step: 'eligibility', data: { amount, purpose } }
  return {
    messages: [
      assistantMessage(
        [`Here's what we see on your account:`, '', `**Vested balance:** ${money(financials.vestedBalance)}`, `**Max loan (mock rule):** ${money(financials.maxLoan)}`, '', 'You\'re **eligible** to request a loan at this amount. Reply **continue** when you\'re ready for a **live payment preview**.'].join('\n'),
        { suggestions: ['Continue', 'Tell me more'] },
      ),
    ],
    nextState: guidedNextState(loanAI, { maxLoan: financials.maxLoan }),
  }
}

export function runGuidedLoanFlow(state: LocalFlowState, input: string, structured: CoreAIStructuredPayload | null = null): LocalAIResult {
  const trimmed = input.trim()
  const ctx = state.context
  const loanAI = ctx[LOAN_AI_STATE_KEY] as LoanAIState
  const financials = getUserFinancials()
  const maxLoan = financials.maxLoan

  if (structured) {
    if (loanAI.step === 'simulation' && structured.action === 'loan_simulator_continue') {
      const p = buildSimulatorPayload(loanAI, maxLoan)
      const step = p.amountStep ?? 100
      let amount = Math.round(structured.amount / step) * step
      amount = Math.min(p.maxAmount, Math.max(p.minAmount, amount))
      const tenureMonths = clampTenure(structured.tenureMonths)
      const nextLoan: LoanAIState = { ...loanAI, step: 'configuration', data: { ...loanAI.data, amount, tenureMonths } }
      const payload: SelectionCardPayload = { title: 'How would you like to receive the loan?', options: [{ label: 'Bank transfer (ACH)', value: 'eft' }, { label: 'Check (mailed)', value: 'check' }], insight: 'Bank transfer is fastest. Check takes 5–7 business days.' }
      return { messages: [assistantMessage('Choose how you\'d like to receive the funds.', { interactiveType: 'selection_card', interactivePayload: payload })], nextState: guidedNextState(nextLoan, { maxLoan }) }
    }

    if (loanAI.step === 'configuration' && structured.action === 'selection_card_pick') {
      const method = structured.value
      const amount = loanAI.data.amount ?? 0
      const nextLoan: LoanAIState = { ...loanAI, step: 'fees', data: { ...loanAI.data, paymentMethod: method } }
      const feesPayload: FeesCardPayload = { title: 'Fees breakdown', processingFee: LOAN_PROCESSING_FEE, otherCharges: LOAN_OTHER_CHARGES, principal: amount, netAmount: netLoanAmount(amount), disbursementLabel: disbursementLabel(method) }
      return { messages: [assistantMessage('Here\'s how fees affect what hits your account.', { interactiveType: 'fees_card', interactivePayload: feesPayload })], nextState: guidedNextState(nextLoan, { maxLoan }) }
    }

    if (loanAI.step === 'fees' && structured.action === 'fees_card_continue') {
      const nextLoan: LoanAIState = { ...loanAI, step: 'documents' }
      const docPayload: DocumentUploadCardPayload = { title: 'Required documents', items: ['Bank proof', 'Promissory note', 'Spousal consent (if applicable)'], helper: 'Upload now or finish later in the loan center.' }
      return { messages: [assistantMessage('Documents checklist — upload now or finish in the loan center.', { interactiveType: 'document_upload_card', interactivePayload: docPayload })], nextState: guidedNextState(nextLoan, { maxLoan }) }
    }

    if (loanAI.step === 'documents' && structured.action === 'document_upload_card_continue') {
      const nextLoan: LoanAIState = { ...loanAI, step: 'review' }
      return { messages: [assistantMessage('One last look — submit when you\'re ready.', { interactiveType: 'loan_review_card', interactivePayload: buildReviewPayload(nextLoan) })], nextState: guidedNextState(nextLoan, { maxLoan }) }
    }

    if (loanAI.step === 'review' && (structured.action === 'review_card_submit' || structured.action === 'SUBMIT_LOAN')) {
      const nextLoan: LoanAIState = { ...loanAI, step: 'success' }
      const successPayload: SuccessCardPayload = { title: 'Loan request submitted', description: 'Your application has been received.', processingTime: '1–2 business days', reassuranceMessage: 'We\'ll send a confirmation email shortly.', actionLabel: 'Go to loan center' }
      return { messages: [assistantMessage('Your loan request is in. Here\'s what to expect.', { interactiveType: 'loan_success_card', interactivePayload: successPayload })], nextState: guidedNextState(nextLoan, { maxLoan }) }
    }

    if (loanAI.step === 'success' && structured.action === 'success_card_dismiss') {
      return { messages: [], nextState: null, navigate: '/transactions/loan' }
    }

    return { messages: [assistantMessage('Continue from the conversation above, or say **apply loan** to restart.')], nextState: guidedNextState(loanAI, { maxLoan }) }
  }

  if (loanAI.step === 'eligibility') {
    if (isNegative(trimmed)) return { messages: [assistantMessage('No problem — ask about a **loan** anytime.')], nextState: null }
    return { messages: [assistantMessage('Slide to explore **amount** and **length** — your estimated payment updates instantly.', { interactiveType: 'loan_simulator_card', interactivePayload: buildSimulatorPayload({ ...loanAI, step: 'simulation' }, maxLoan) })], nextState: guidedNextState({ ...loanAI, step: 'simulation' }, { maxLoan }) }
  }

  if (loanAI.step === 'simulation') {
    if (isNegative(trimmed)) return { messages: [assistantMessage('Understood. Say **apply loan** when you\'re ready.')], nextState: null }
    if (isAffirmative(trimmed)) {
      const tenureMonths = clampTenure(loanAI.data.tenureMonths ?? LOAN_AI_TENURE_MONTHS)
      const p = buildSimulatorPayload(loanAI, maxLoan)
      const nextLoan: LoanAIState = { ...loanAI, step: 'configuration', data: { ...loanAI.data, amount: p.amount, tenureMonths } }
      const payload: SelectionCardPayload = { title: 'How would you like to receive the loan?', options: [{ label: 'Bank transfer (ACH)', value: 'eft' }, { label: 'Check (mailed)', value: 'check' }], insight: 'Bank transfer is fastest. Check takes 5–7 business days.' }
      return { messages: [assistantMessage('Choose how you\'d like to receive the funds.', { interactiveType: 'selection_card', interactivePayload: payload })], nextState: guidedNextState(nextLoan, { maxLoan }) }
    }
    return { messages: [assistantMessage('Adjust the **simulator** below, or reply **continue**.', { interactiveType: 'loan_simulator_card', interactivePayload: buildSimulatorPayload(loanAI, maxLoan) })], nextState: guidedNextState(loanAI, { maxLoan }) }
  }

  if (loanAI.step === 'review') {
    if (isAffirmative(trimmed)) {
      const nextLoan: LoanAIState = { ...loanAI, step: 'success' }
      const successPayload: SuccessCardPayload = { title: 'Loan request submitted', description: 'Your application has been received.', processingTime: '1–2 business days', reassuranceMessage: 'We\'ll send a confirmation email shortly.', actionLabel: 'Go to loan center' }
      return { messages: [assistantMessage('Your loan request is in.', { interactiveType: 'loan_success_card', interactivePayload: successPayload })], nextState: guidedNextState(nextLoan, { maxLoan }) }
    }
    return { messages: [assistantMessage('Tap **Submit loan** on the review card or reply **yes**.', { interactiveType: 'loan_review_card', interactivePayload: buildReviewPayload(loanAI) })], nextState: guidedNextState(loanAI, { maxLoan }) }
  }

  return { messages: [assistantMessage('Use the controls above, or say **apply loan** to restart.')], nextState: guidedNextState(loanAI, { maxLoan }) }
}

export function isGuidedLoanContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[LOAN_AI_STATE_KEY] != null
}

void loanPayloadFromState
