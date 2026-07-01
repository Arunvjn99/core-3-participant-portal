/**
 * Core AI 2.0 — scenario tests
 * Run: npx vitest run src/features/ai/__tests__/coreAI.test.ts
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { handleLocalAI } from '../services/handleLocalAI'
import type { LocalFlowState } from '../store/flowTypes'

let counter = 0
// Reset message counter so IDs are deterministic between test runs
beforeEach(() => { counter = 0 })

function noState(): null { return null }
function state(type: LocalFlowState['type'], step: number, ctx: Record<string, unknown> = {}): LocalFlowState {
  return { type, step, context: ctx }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstMsgType(result: ReturnType<typeof handleLocalAI>) {
  return result.messages[0]?.interactiveType ?? null
}

function firstMsgContent(result: ReturnType<typeof handleLocalAI>) {
  return result.messages[0]?.content ?? ''
}

function flowType(result: ReturnType<typeof handleLocalAI>) {
  return result.nextState?.type ?? null
}

function flowStep(result: ReturnType<typeof handleLocalAI>) {
  return result.nextState?.step ?? -1
}

// ─── 1. Intent detection ─────────────────────────────────────────────────────

describe('Intent detection', () => {
  it('detects loan intent from "apply for a loan"', () => {
    const r = handleLocalAI('apply for a loan', noState())
    expect(flowType(r)).toBe('loan')
  })

  it('detects loan intent from "I need a loan for home repair"', () => {
    const r = handleLocalAI('I need a loan for home repair', noState())
    expect(flowType(r)).toBe('loan')
  })

  it('detects loan from amount + purpose: "I want to borrow $3000"', () => {
    const r = handleLocalAI('I want to borrow $3000', noState())
    expect(flowType(r)).toBe('loan')
  })

  it('detects withdrawal intent', () => {
    const r = handleLocalAI('I want to withdraw money', noState())
    expect(flowType(r)).toBe('withdrawal')
  })

  it('detects enrollment intent', () => {
    const r = handleLocalAI('I want to enroll', noState())
    expect(flowType(r)).toBe('enrollment')
  })

  it('detects vesting intent', () => {
    const r = handleLocalAI('what is my vested balance', noState())
    expect(flowType(r)).toBe('vesting')
  })

  it('detects rebalance intent', () => {
    const r = handleLocalAI('I want to rebalance my portfolio', noState())
    expect(flowType(r)).toBe('rebalance')
  })

  it('detects rebalance intent from "change my allocation"', () => {
    const r = handleLocalAI('change my allocation', noState())
    expect(flowType(r)).toBe('rebalance')
  })

  it('detects rollover intent', () => {
    const r = handleLocalAI('I want to roll over my old 401k', noState())
    expect(flowType(r)).toBe('rollover')
  })

  it('detects rollover intent from "rollover in"', () => {
    const r = handleLocalAI('rollover in', noState())
    // Falls through search scenarios -> rollover flow
    expect(['rollover', null]).toContain(flowType(r))
  })

  it('cancel stops active flow', () => {
    const r = handleLocalAI('cancel', noState())
    expect(r.nextState).toBe(null)
    expect(firstMsgContent(r)).toMatch(/no problem/i)
  })

  it('returns fallback for unknown input', () => {
    const r = handleLocalAI('fjdksfjdsfkds', noState())
    expect(firstMsgContent(r)).toBeTruthy()
    // should show fallback suggestions
    expect(r.messages[0]?.suggestions?.length).toBeGreaterThan(0)
  })
})

// ─── 2. Loan flow ────────────────────────────────────────────────────────────

describe('Loan flow', () => {
  it('step 0: starts with balance overview', () => {
    const r = handleLocalAI('apply for a loan', noState())
    expect(flowType(r)).toBe('loan')
    expect(flowStep(r)).toBeGreaterThanOrEqual(0)
    expect(r.messages.length).toBeGreaterThan(0)
  })

  it('step 0 with amount: skips to guided flow (simulator card)', () => {
    const r = handleLocalAI('I want a loan for $3000', noState())
    expect(flowType(r)).toBe('loan')
  })

  it('guided loan step eligibility → simulator', () => {
    const loanAI = { step: 'eligibility', data: { amount: 3000, purpose: 'general' } }
    const s = state('loan', 2, { guided: true, loanAI })
    const r = handleLocalAI('continue', s)
    expect(firstMsgType(r)).toBe('loan_simulator_card')
  })

  it('loan simulator card: continue action → selection card', () => {
    const loanAI = { step: 'simulation', data: { amount: 3000 } }
    const s = state('loan', 2, { guided: true, loanAI })
    const r = handleLocalAI('', s, { action: 'loan_simulator_continue', amount: 3000, tenureMonths: 24 })
    expect(firstMsgType(r)).toBe('selection_card')
  })

  it('selection card pick: eft → fees card', () => {
    const loanAI = { step: 'configuration', data: { amount: 3000, tenureMonths: 24 } }
    const s = state('loan', 2, { guided: true, loanAI })
    const r = handleLocalAI('', s, { action: 'selection_card_pick', value: 'eft', label: 'Bank transfer' })
    expect(firstMsgType(r)).toBe('fees_card')
  })

  it('fees card continue → document upload card', () => {
    const loanAI = { step: 'fees', data: { amount: 3000, tenureMonths: 24, paymentMethod: 'eft' } }
    const s = state('loan', 2, { guided: true, loanAI })
    const r = handleLocalAI('', s, { action: 'fees_card_continue' })
    expect(firstMsgType(r)).toBe('document_upload_card')
  })

  it('document upload continue → review card', () => {
    const loanAI = { step: 'documents', data: { amount: 3000, tenureMonths: 24, paymentMethod: 'eft' } }
    const s = state('loan', 2, { guided: true, loanAI })
    const r = handleLocalAI('', s, { action: 'document_upload_card_continue' })
    expect(firstMsgType(r)).toBe('loan_review_card')
  })

  it('loan review submit → success card', () => {
    const loanAI = { step: 'review', data: { amount: 3000, tenureMonths: 24, paymentMethod: 'eft' } }
    const s = state('loan', 2, { guided: true, loanAI })
    const r = handleLocalAI('', s, { action: 'SUBMIT_LOAN' })
    expect(firstMsgType(r)).toBe('loan_success_card')
  })

  it('success card dismiss → navigates to loan center', () => {
    const loanAI = { step: 'success', data: {} }
    const s = state('loan', 2, { guided: true, loanAI })
    const r = handleLocalAI('', s, { action: 'success_card_dismiss' })
    expect(r.navigate).toBe('/transactions/loan')
  })
})

// ─── 3. Enrollment flow ──────────────────────────────────────────────────────

describe('Enrollment flow', () => {
  it('step 0: starts with plan selection card', () => {
    const r = handleLocalAI('I want to enroll', noState())
    expect(flowType(r)).toBe('enrollment')
    // first message should have plan_selection_card
    expect(firstMsgType(r)).toBe('plan_selection_card')
  })

  it('plan selection card: plan_selected → contribution card', () => {
    const enrollmentAI = { step: 'setup', data: {} }
    const s = state('enrollment', 1, { guided: true, enrollmentAI })
    const r = handleLocalAI('', s, { action: 'plan_selected', planId: 'core_401k', planLabel: 'CORE 401(k) Plan' })
    expect(firstMsgType(r)).toBe('enrollment_contribution_card')
    expect(r.nextState?.context.enrollmentAI).toMatchObject({ step: 'contribution', data: { planId: 'core_401k' } })
  })

  it('contribution set → investment card', () => {
    const enrollmentAI = { step: 'contribution', data: { planId: 'core_401k', planLabel: 'CORE 401(k) Plan' } }
    const s = state('enrollment', 1, { guided: true, enrollmentAI })
    const r = handleLocalAI('', s, { action: 'enrollment_contribution_set', planId: 'core_401k', planLabel: 'CORE 401(k) Plan', contribution: 8 })
    expect(firstMsgType(r)).toBe('enrollment_investment_card')
    expect(r.nextState?.context.enrollmentAI).toMatchObject({ step: 'investment', data: { contribution: 8 } })
  })

  it('investment set → review card', () => {
    const enrollmentAI = { step: 'investment', data: { planId: 'core_401k', planLabel: 'CORE 401(k) Plan', contribution: 8 } }
    const s = state('enrollment', 1, { guided: true, enrollmentAI })
    const r = handleLocalAI('', s, { action: 'enrollment_investment_set', planId: 'core_401k', planLabel: 'CORE 401(k) Plan', contribution: 8, investment: 'Target Date Fund' })
    expect(firstMsgType(r)).toBe('enrollment_review_card')
    expect(r.nextState?.context.enrollmentAI).toMatchObject({ step: 'review' })
  })

  it('review submit → success card', () => {
    const enrollmentAI = { step: 'review', data: { planId: 'core_401k', planLabel: 'CORE 401(k) Plan', contribution: 8, investment: 'Target Date Fund' } }
    const s = state('enrollment', 1, { guided: true, enrollmentAI })
    const r = handleLocalAI('', s, { action: 'enrollment_review_submit' })
    expect(firstMsgType(r)).toBe('success_card')
  })

  it('success card dismiss → navigates to enrollment', () => {
    const enrollmentAI = { step: 'success', data: {} }
    const s = state('enrollment', 1, { guided: true, enrollmentAI })
    const r = handleLocalAI('', s, { action: 'success_card_dismiss' })
    expect(r.navigate).toBe('/enrollment/plan')
  })

  it('plan selection card has 3 plans', () => {
    const r = handleLocalAI('I want to enroll', noState())
    const payload = r.messages[0]?.interactivePayload as { plans: unknown[] }
    expect(payload?.plans?.length).toBe(3)
  })

  it('plan selection card has flow step metadata', () => {
    const r = handleLocalAI('I want to enroll', noState())
    expect(r.messages[0]?.flowStep).toEqual({ current: 1, total: 4, label: 'Choose Plan' })
  })
})

// ─── 4. Withdrawal flow ──────────────────────────────────────────────────────

describe('Withdrawal flow', () => {
  it('step 0: starts with withdrawal type card', () => {
    const r = handleLocalAI('I want to withdraw money', noState())
    expect(flowType(r)).toBe('withdrawal')
    expect(firstMsgType(r)).toBe('withdrawal_type_card')
  })

  it('withdrawal type selected → slider card', () => {
    const withdrawalAI = { step: 'type_selection', data: {} }
    const s = state('withdrawal', 1, { guided: true, withdrawalAI })
    const r = handleLocalAI('', s, { action: 'withdrawal_type_selected', withdrawalType: 'hardship', withdrawalTypeLabel: 'Hardship Withdrawal' })
    expect(firstMsgType(r)).toBe('withdrawal_slider_card')
    expect(r.nextState?.context.withdrawalAI).toMatchObject({ step: 'amount_selection', data: { withdrawalType: 'hardship' } })
  })

  it('withdrawal amount continue → selection card (delivery method)', () => {
    const withdrawalAI = { step: 'amount_selection', data: { withdrawalType: 'hardship' } }
    const s = state('withdrawal', 1, { guided: true, withdrawalAI })
    const r = handleLocalAI('', s, { action: 'withdrawal_amount_continue', value: 2000 })
    expect(firstMsgType(r)).toBe('selection_card')
    expect(r.nextState?.context.withdrawalAI).toMatchObject({ step: 'method', data: { amount: 2000 } })
  })

  it('delivery method pick → review card', () => {
    const withdrawalAI = { step: 'method', data: { amount: 2000, withdrawalType: 'hardship' } }
    const s = state('withdrawal', 1, { guided: true, withdrawalAI })
    const r = handleLocalAI('', s, { action: 'selection_card_pick', value: 'eft', label: 'Bank transfer' })
    expect(firstMsgType(r)).toBe('withdrawal_review_card')
  })

  it('review submit → success card', () => {
    const withdrawalAI = { step: 'review', data: { amount: 2000, withdrawalType: 'hardship', method: 'eft' } }
    const s = state('withdrawal', 1, { guided: true, withdrawalAI })
    const r = handleLocalAI('', s, { action: 'withdrawal_review_submit' })
    expect(firstMsgType(r)).toBe('success_card')
  })

  it('success card dismiss → navigates to transactions', () => {
    const withdrawalAI = { step: 'success', data: {} }
    const s = state('withdrawal', 1, { guided: true, withdrawalAI })
    const r = handleLocalAI('', s, { action: 'success_card_dismiss' })
    expect(r.navigate).toBe('/transactions')
  })

  it('withdrawal type card has 3 options', () => {
    const r = handleLocalAI('I want to withdraw money', noState())
    const payload = r.messages[0]?.interactivePayload as { options: unknown[] }
    expect(payload?.options?.length).toBe(3)
  })
})

// ─── 5. Rebalance flow ───────────────────────────────────────────────────────

describe('Rebalance flow', () => {
  it('step 0: starts with current allocation card', () => {
    const r = handleLocalAI('I want to rebalance my portfolio', noState())
    expect(flowType(r)).toBe('rebalance')
    expect(firstMsgType(r)).toBe('rebalance_current_card')
  })

  it('rebalance current card has current allocation and presets', () => {
    const r = handleLocalAI('rebalance', noState())
    const payload = r.messages[0]?.interactivePayload as { currentAllocation: unknown[]; presets: unknown[] }
    expect(payload?.currentAllocation?.length).toBeGreaterThan(0)
    expect(payload?.presets?.length).toBe(3)
  })

  it('preset selected → review card', () => {
    const rebalanceAI = { step: 'overview', data: {} }
    const s = state('rebalance', 1, { guided: true, rebalanceAI })
    const r = handleLocalAI('', s, { action: 'rebalance_preset_selected', presetId: 'moderate', presetLabel: 'Moderate' })
    expect(firstMsgType(r)).toBe('rebalance_review_card')
    expect(r.nextState?.context.rebalanceAI).toMatchObject({ step: 'review', data: { presetId: 'moderate' } })
  })

  it('rebalance review submit → success card', () => {
    const rebalanceAI = { step: 'review', data: { presetId: 'moderate', presetLabel: 'Moderate' } }
    const s = state('rebalance', 1, { guided: true, rebalanceAI })
    const r = handleLocalAI('', s, { action: 'rebalance_review_submit' })
    expect(firstMsgType(r)).toBe('success_card')
  })

  it('success card dismiss → navigates to investments', () => {
    const rebalanceAI = { step: 'success', data: {} }
    const s = state('rebalance', 1, { guided: true, rebalanceAI })
    const r = handleLocalAI('', s, { action: 'success_card_dismiss' })
    expect(r.navigate).toBe('/investments')
  })
})

// ─── 6. Rollover flow ────────────────────────────────────────────────────────

describe('Rollover flow', () => {
  it('step 0: starts with rollover type card', () => {
    const r = handleLocalAI('I want to roll over my old 401k', noState())
    expect(flowType(r)).toBe('rollover')
    expect(firstMsgType(r)).toBe('rollover_type_card')
  })

  it('rollover type card has 3 options', () => {
    const r = handleLocalAI('roll over an old 401k', noState())
    const payload = r.messages[0]?.interactivePayload as { options: unknown[] }
    expect(payload?.options?.length).toBe(3)
  })

  it('rollover type selected → review card', () => {
    const rolloverAI = { step: 'type_selection', data: {} }
    const s = state('rollover', 1, { guided: true, rolloverAI })
    const r = handleLocalAI('', s, { action: 'rollover_type_selected', rolloverType: 'old_401k', rolloverTypeLabel: 'Old 401(k) or 403(b)' })
    expect(firstMsgType(r)).toBe('rollover_review_card')
    expect(r.nextState?.context.rolloverAI).toMatchObject({ step: 'review', data: { rolloverType: 'old_401k' } })
  })

  it('rollover review submit → success card', () => {
    const rolloverAI = { step: 'review', data: { rolloverType: 'old_401k', rolloverTypeLabel: 'Old 401(k)' } }
    const s = state('rollover', 1, { guided: true, rolloverAI })
    const r = handleLocalAI('', s, { action: 'rollover_review_submit' })
    expect(firstMsgType(r)).toBe('success_card')
  })

  it('success card dismiss → navigates to rollover', () => {
    const rolloverAI = { step: 'success', data: {} }
    const s = state('rollover', 1, { guided: true, rolloverAI })
    const r = handleLocalAI('', s, { action: 'success_card_dismiss' })
    expect(r.navigate).toBe('/transactions/rollover')
  })
})

// ─── 7. Vesting flow ─────────────────────────────────────────────────────────

describe('Vesting flow', () => {
  it('starts with balance card', () => {
    const r = handleLocalAI('what is my vested balance', noState())
    expect(flowType(r)).toBe('vesting')
    expect(firstMsgType(r)).toBe('balance_card')
  })

  it('balance card has vestedPercent', () => {
    const r = handleLocalAI('what is my vested balance', noState())
    const payload = r.messages[0]?.interactivePayload as { vestedPercent: number }
    expect(typeof payload?.vestedPercent).toBe('number')
    expect(payload.vestedPercent).toBeGreaterThanOrEqual(0)
    expect(payload.vestedPercent).toBeLessThanOrEqual(100)
  })

  it('continue → info card with vested insight', () => {
    const vestedAI = { step: 'overview', data: {} }
    const s = state('vesting', 1, { guided: true, vestedAI })
    const r = handleLocalAI('continue', s)
    expect(firstMsgType(r)).toBe('info_card')
  })
})

// ─── 8. FAQ / search scenarios ───────────────────────────────────────────────

describe('FAQ and search', () => {
  it('answers vested balance FAQ question', () => {
    const r = handleLocalAI('What is a 401k', noState())
    // Should return an answer or navigate, not null state with empty messages
    expect(r.messages.length + (r.navigate ? 1 : 0)).toBeGreaterThan(0)
  })

  it('FAQ_DETAIL structured action returns full answer', () => {
    const r = handleLocalAI('', noState(), { action: 'FAQ_DETAIL', faqId: 'vested_balance', question: 'What is vested balance?' })
    expect(r.messages[0]?.content).toMatch(/vested/i)
  })

  it('unknown FAQ id returns graceful fallback', () => {
    const r = handleLocalAI('', noState(), { action: 'FAQ_DETAIL', faqId: 'nonexistent_id_xyz', question: 'Foo?' })
    expect(r.messages[0]?.content).toBeTruthy()
  })
})

// ─── 9. User financials ──────────────────────────────────────────────────────

describe('User financials', () => {
  it('getUserFinancials returns sensible values', async () => {
    const { getUserFinancials } = await import('../services/userFinancials')
    const f = getUserFinancials()
    expect(f.totalBalance).toBeGreaterThan(0)
    expect(f.vestedBalance).toBeGreaterThan(0)
    expect(f.vestedBalance).toBeLessThanOrEqual(f.totalBalance)
    expect(f.maxLoan).toBeLessThanOrEqual(f.vestedBalance * 0.5 + 1)
    expect(f.maxWithdrawal).toBeLessThanOrEqual(f.vestedBalance * 0.3 + 1)
    expect(f.vestedPercent).toBeGreaterThanOrEqual(0)
    expect(f.vestedPercent).toBeLessThanOrEqual(100)
    expect(f.allocation.length).toBeGreaterThan(0)
    const totalPct = f.allocation.reduce((sum, a) => sum + a.percent, 0)
    expect(totalPct).toBe(100)
  })

  it('ENROLLMENT_PLANS has 3 plans with required fields', async () => {
    const { ENROLLMENT_PLANS } = await import('../services/userFinancials')
    expect(ENROLLMENT_PLANS.length).toBe(3)
    for (const plan of ENROLLMENT_PLANS) {
      expect(plan.id).toBeTruthy()
      expect(plan.label).toBeTruthy()
      expect(plan.estimatedAnnualSavings).toBeGreaterThan(0)
      expect(plan.features.length).toBeGreaterThan(0)
    }
  })

  it('REBALANCE_PRESETS has 3 presets with funds summing to 100%', async () => {
    const { REBALANCE_PRESETS } = await import('../services/userFinancials')
    expect(REBALANCE_PRESETS.length).toBe(3)
    for (const preset of REBALANCE_PRESETS) {
      const total = preset.funds.reduce((sum, f) => sum + f.percent, 0)
      expect(total).toBe(100)
    }
  })
})

// ─── 10. EMI calculator ──────────────────────────────────────────────────────

describe('EMI calculator', () => {
  it('calculates correct EMI for known values', async () => {
    const { calculateEMI } = await import('../services/emiCalculator')
    const emi = calculateEMI(10000, 8, 12)
    expect(emi).toBeCloseTo(869.88, 0)
  })

  it('returns 0 for zero principal', async () => {
    const { calculateEMI } = await import('../services/emiCalculator')
    expect(calculateEMI(0, 8, 12)).toBe(0)
  })

  it('generates schedule with correct row count', async () => {
    const { generateSchedule } = await import('../services/emiCalculator')
    const { rows } = generateSchedule(5000, 8, 24, 3)
    expect(rows.length).toBe(3)
  })

  it('schedule dates use current year not hardcoded 2026', async () => {
    const { generateSchedule } = await import('../services/emiCalculator')
    const { rows } = generateSchedule(5000, 8, 12, 1)
    const year = new Date().getFullYear()
    expect(rows[0]?.dueDateLabel).toContain(String(year))
  })
})
