export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  interactiveType?: string
  interactivePayload?: unknown
}

export type CoreAIInteractiveMessageType =
  | 'loan_simulator_card'
  | 'selection_card'
  | 'fees_card'
  | 'document_upload_card'
  | 'review_card'
  | 'loan_review_card'
  | 'success_card'
  | 'loan_success_card'
  | 'enrollment_setup_card'
  | 'enrollment_review_card'
  | 'withdrawal_slider_card'
  | 'withdrawal_review_card'
  | 'info_card'
  | 'balance_card'

export type CoreAIStructuredPayload =
  | { action: 'START_LOAN_REVIEW'; amount: number; tenureMonths: number }
  | { action: 'loan_simulator_continue'; amount: number; tenureMonths: number }
  | { action: 'selection_card_pick'; value: 'eft' | 'check'; label: string }
  | { action: 'fees_card_continue' }
  | { action: 'document_upload_card_continue'; deferred?: boolean }
  | { action: 'review_card_submit' }
  | { action: 'SUBMIT_LOAN' }
  | { action: 'success_card_dismiss' }
  | { action: 'enrollment_setup_continue'; plan: string; contribution: number; investment: string }
  | { action: 'enrollment_review_submit' }
  | { action: 'withdrawal_amount_continue'; value: number }
  | { action: 'withdrawal_review_submit' }
  | { action: 'vested_dismiss' }
  | { action: 'info_card_suggestion'; suggestion: string }
  | { action: 'FAQ_DETAIL'; faqId: string; question: string }

export type LoanSimulatorCardPayload = {
  amount: number
  minAmount: number
  maxAmount: number
  annualRatePercent: number
  tenureMonths: number
  minTenureMonths: number
  maxTenureMonths: number
  tenureStep: number
  amountStep?: number
}

export type SelectionCardPayload = {
  title: string
  subtitle?: string
  options: { label: string; value: 'eft' | 'check' }[]
  insight?: string
}

export type FeesCardPayload = {
  title: string
  processingFee: number
  otherCharges: number
  principal: number
  netAmount: number
  disbursementLabel: string
}

export type DocumentUploadCardPayload = {
  title: string
  items: string[]
  helper?: string
}

export type SchedulePreviewRow = {
  month: number
  dueDateLabel: string
  payment: number
  principal: number
  interest: number
  balanceAfter: number
}

export type ReviewCardPayload = {
  title: string
  amount: number
  netAmount: number
  tenureMonths: number
  monthlyPayment: number
  annualRatePercent: number
  disbursementLabel: string
  schedulePreview?: SchedulePreviewRow[]
}

export type SuccessCardPayload = {
  title: string
  description?: string
  processingTime: string
  reassuranceMessage: string
  actionLabel?: string
}

export type EnrollmentSetupPayload = {
  planOptions: { label: string; value: string }[]
  contributionMin: number
  contributionMax: number
  contributionValue: number
  investmentOptions: string[]
}

export type EnrollmentReviewPayload = {
  plan: string
  contribution: number
  investment: string
}

export type WithdrawalSliderPayload = {
  min: number
  max: number
  value: number
  tax: number
  net: number
}

export type InfoCardPayload = {
  message: string
  actionLabel?: string
  action?: CoreAIStructuredPayload
  vestedPercent?: number
  suggestions?: string[]
  insight?: string
}

export type WithdrawalReviewPayload = { amount: number; tax: number; net: number }

export type BalanceCardPayload = {
  total: number
  vested: number
  unvested: number
}
