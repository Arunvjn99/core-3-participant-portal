import type { AllocationFund, EnrollmentPlan, TargetPreset } from './services/userFinancials'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  interactiveType?: string
  interactivePayload?: unknown
  // flow step metadata for the step indicator
  flowStep?: { current: number; total: number; label: string }
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
  | 'plan_selection_card'
  | 'enrollment_review_card'
  | 'withdrawal_type_card'
  | 'withdrawal_slider_card'
  | 'withdrawal_review_card'
  | 'rebalance_current_card'
  | 'rebalance_target_card'
  | 'rebalance_review_card'
  | 'rollover_type_card'
  | 'rollover_review_card'
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
  | { action: 'plan_selected'; planId: string; planLabel: string }
  | { action: 'enrollment_contribution_set'; planId: string; planLabel: string; contribution: number }
  | { action: 'enrollment_investment_set'; planId: string; planLabel: string; contribution: number; investment: string }
  | { action: 'enrollment_review_submit' }
  | { action: 'withdrawal_type_selected'; withdrawalType: string; withdrawalTypeLabel: string }
  | { action: 'withdrawal_amount_continue'; value: number }
  | { action: 'withdrawal_review_submit' }
  | { action: 'rebalance_preset_selected'; presetId: string; presetLabel: string }
  | { action: 'rebalance_review_submit' }
  | { action: 'rollover_type_selected'; rolloverType: string; rolloverTypeLabel: string }
  | { action: 'rollover_review_submit' }
  | { action: 'vested_dismiss' }
  | { action: 'info_card_suggestion'; suggestion: string }
  | { action: 'FAQ_DETAIL'; faqId: string; question: string }

// ─── Card Payloads ──────────────────────────────────────────────────────────

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
  options: { label: string; value: 'eft' | 'check'; description?: string }[]
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

// Enrollment — new 3-plan picker
export type PlanSelectionCardPayload = {
  plans: EnrollmentPlan[]
  selectedPlanId?: string
}

export type EnrollmentContributionPayload = {
  planId: string
  planLabel: string
  contributionMin: number
  contributionMax: number
  contributionValue: number
  employerMatchPercent: number
  estimatedAnnualSavings: number
}

export type EnrollmentInvestmentPayload = {
  planId: string
  planLabel: string
  contribution: number
  investmentOptions: { label: string; value: string; description: string }[]
}

export type EnrollmentReviewPayload = {
  planLabel: string
  contribution: number
  investment: string
  estimatedAnnualSavings: number
}

// Withdrawal — new type picker
export type WithdrawalTypeCardPayload = {
  options: { id: string; label: string; description: string; eligible: boolean; note?: string }[]
}

export type WithdrawalSliderPayload = {
  min: number
  max: number
  value: number
  tax: number
  net: number
  withdrawalType?: string
}

export type WithdrawalReviewPayload = {
  amount: number
  tax: number
  net: number
  withdrawalType?: string
  method?: string
}

// Rebalance
export type RebalanceCurrentCardPayload = {
  currentAllocation: AllocationFund[]
  totalBalance: number
  presets: TargetPreset[]
}

export type RebalanceTargetCardPayload = {
  currentAllocation: AllocationFund[]
  targetPreset: TargetPreset
  totalBalance: number
}

export type RebalanceReviewPayload = {
  currentAllocation: AllocationFund[]
  targetPreset: TargetPreset
  totalBalance: number
}

// Rollover
export type RolloverTypeCardPayload = {
  options: { id: string; label: string; description: string; icon: string }[]
}

export type RolloverReviewPayload = {
  rolloverType: string
  rolloverTypeLabel: string
  estimatedAmount?: number
}

// Info / Balance
export type InfoCardPayload = {
  message: string
  actionLabel?: string
  action?: CoreAIStructuredPayload
  vestedPercent?: number
  suggestions?: string[]
  insight?: string
}

export type BalanceCardPayload = {
  total: number
  vested: number
  unvested: number
  vestedPercent: number
  allocation?: AllocationFund[]
}
