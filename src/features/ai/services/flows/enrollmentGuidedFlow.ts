import { assistantMessage } from '../messageUtils'
import { ENROLLMENT_PLANS } from '../userFinancials'
import type {
  CoreAIStructuredPayload,
  EnrollmentContributionPayload,
  EnrollmentInvestmentPayload,
  EnrollmentReviewPayload,
  PlanSelectionCardPayload,
  SuccessCardPayload,
} from '../../types'
import { ENROLLMENT_AI_STATE_KEY, type EnrollmentAIState } from '../../store/enrollmentAIState'
import type { LocalAIResult, LocalFlowState } from '../../store/flowTypes'

const INVESTMENT_OPTIONS = [
  { label: 'Target Date Fund', value: 'target_date', description: 'Auto-adjusts risk as you near retirement' },
  { label: 'US Large Cap Growth', value: 'large_cap', description: 'Higher growth, higher volatility' },
  { label: 'Balanced (60/40)', value: 'balanced', description: 'Mix of stocks and bonds' },
  { label: 'Advisor Recommended', value: 'advisor', description: 'Professionally managed portfolio' },
]

function enrollmentNextState(enrollmentAI: EnrollmentAIState): LocalFlowState {
  return { type: 'enrollment', step: 1, context: { guided: true, [ENROLLMENT_AI_STATE_KEY]: enrollmentAI } }
}

function planSelectionPayload(selectedPlanId?: string): PlanSelectionCardPayload {
  return { plans: ENROLLMENT_PLANS, selectedPlanId }
}

function contributionPayload(planId: string, planLabel: string): EnrollmentContributionPayload {
  const plan = ENROLLMENT_PLANS.find((p) => p.id === planId)
  return {
    planId,
    planLabel,
    contributionMin: 1,
    contributionMax: 25,
    contributionValue: 6,
    employerMatchPercent: planId === 'safe_harbor' ? 4 : planId === 'core_401k' ? 4 : 3,
    estimatedAnnualSavings: plan?.estimatedAnnualSavings ?? 6_000,
  }
}

function investmentPayload(planId: string, planLabel: string, contribution: number): EnrollmentInvestmentPayload {
  return { planId, planLabel, contribution, investmentOptions: INVESTMENT_OPTIONS }
}

function reviewPayload(enrollmentAI: EnrollmentAIState): EnrollmentReviewPayload {
  const plan = ENROLLMENT_PLANS.find((p) => p.id === enrollmentAI.data.planId) ?? ENROLLMENT_PLANS[0]!
  return {
    planLabel: enrollmentAI.data.planLabel ?? plan.label,
    contribution: enrollmentAI.data.contribution ?? 6,
    investment: enrollmentAI.data.investmentLabel ?? 'Target Date Fund',
    estimatedAnnualSavings: plan.estimatedAnnualSavings,
  }
}

function buildSuccessPayload(): SuccessCardPayload {
  return {
    title: "You're enrolled — welcome to the plan",
    description: 'Your retirement savings start with your next paycheck.',
    processingTime: 'Effective next pay cycle',
    reassuranceMessage: "You'll get a confirmation email shortly. You can update your selections anytime from the enrollment center.",
    actionLabel: 'View my plan',
  }
}

export function startEnrollmentGuidedFlow(): LocalAIResult {
  const enrollmentAI: EnrollmentAIState = { step: 'setup', data: {} }
  return {
    messages: [
      assistantMessage(
        "Let's get you enrolled — it takes about 2 minutes. First, pick the plan type that works best for you. Here are the options available:",
        {
          interactiveType: 'plan_selection_card',
          interactivePayload: planSelectionPayload(),
          flowStep: { current: 1, total: 4, label: 'Choose Plan' },
          suggestions: ['Compare plans', 'Which plan is best for me?', "What's the difference?"],
        },
      ),
    ],
    nextState: enrollmentNextState(enrollmentAI),
  }
}

export function runEnrollmentGuidedFlow(
  state: LocalFlowState,
  input: string,
  structured: CoreAIStructuredPayload | null,
): LocalAIResult {
  const ctx = state.context
  const enrollmentAI = ctx[ENROLLMENT_AI_STATE_KEY] as EnrollmentAIState

  if (structured) {
    // Step 1 → 2: Plan selected, move to contribution
    if (enrollmentAI.step === 'setup' && structured.action === 'plan_selected') {
      const next: EnrollmentAIState = {
        ...enrollmentAI,
        step: 'contribution',
        data: { planId: structured.planId, planLabel: structured.planLabel },
      }
      return {
        messages: [
          assistantMessage(
            `Great choice — the **${structured.planLabel}** is a solid pick. Now, how much of each paycheck do you want to put in? Most people start around 6% to capture the full employer match.`,
            {
              interactiveType: 'enrollment_contribution_card',
              interactivePayload: contributionPayload(structured.planId, structured.planLabel),
              flowStep: { current: 2, total: 4, label: 'Set Contribution' },
            },
          ),
        ],
        nextState: enrollmentNextState(next),
      }
    }

    // Step 2 → 3: Contribution set, move to investment
    if (
      (enrollmentAI.step === 'contribution' || enrollmentAI.step === 'setup') &&
      structured.action === 'enrollment_contribution_set'
    ) {
      const next: EnrollmentAIState = {
        ...enrollmentAI,
        step: 'investment',
        data: { ...enrollmentAI.data, planId: structured.planId, planLabel: structured.planLabel, contribution: structured.contribution },
      }
      return {
        messages: [
          assistantMessage(
            `${structured.contribution}% — nice. Last piece: how do you want your money invested? Pick what matches how hands-on you want to be.`,
            {
              interactiveType: 'enrollment_investment_card',
              interactivePayload: investmentPayload(structured.planId, structured.planLabel, structured.contribution),
              flowStep: { current: 3, total: 4, label: 'Investment Strategy' },
            },
          ),
        ],
        nextState: enrollmentNextState(next),
      }
    }

    // Step 3 → 4: Investment set, move to review
    if (enrollmentAI.step === 'investment' && structured.action === 'enrollment_investment_set') {
      const next: EnrollmentAIState = {
        ...enrollmentAI,
        step: 'review',
        data: {
          ...enrollmentAI.data,
          investment: structured.investment,
          investmentLabel: structured.investment,
        },
      }
      return {
        messages: [
          assistantMessage("Here's your enrollment summary. Everything look right? Once you confirm, you're in.", {
            interactiveType: 'enrollment_review_card',
            interactivePayload: reviewPayload(next),
            flowStep: { current: 4, total: 4, label: 'Review & Confirm' },
          }),
        ],
        nextState: enrollmentNextState(next),
      }
    }

    // Step 4: Submit enrollment
    if (enrollmentAI.step === 'review' && structured.action === 'enrollment_review_submit') {
      const next: EnrollmentAIState = { ...enrollmentAI, step: 'success' }
      return {
        messages: [
          assistantMessage("You're officially in. Here's what happens next.", {
            interactiveType: 'success_card',
            interactivePayload: buildSuccessPayload(),
          }),
        ],
        nextState: enrollmentNextState(next),
      }
    }

    if (enrollmentAI.step === 'success' && structured.action === 'success_card_dismiss') {
      return { messages: [], nextState: null, navigate: '/enrollment/plan' }
    }
  }

  // Handle text input in enrollment flow
  const trimmed = input.trim()

  if (enrollmentAI.step === 'setup' || !enrollmentAI.step) {
    if (/compare|difference|which|best/i.test(trimmed)) {
      return {
        messages: [
          assistantMessage(
            'Here is a quick breakdown: **CORE 401(k)** gives you the most flexibility — Roth, traditional, and after-tax options with a 4% employer match. **Safe Harbor** guarantees the match and vests immediately. **Basic** is the simplest with the lowest fees. Most people go with CORE 401(k) for the flexibility.',
            {
              interactiveType: 'plan_selection_card',
              interactivePayload: planSelectionPayload(enrollmentAI.data.planId),
              flowStep: { current: 1, total: 4, label: 'Choose Plan' },
            },
          ),
        ],
        nextState: enrollmentNextState(enrollmentAI),
      }
    }
    return {
      messages: [
        assistantMessage('Select a plan from the card to continue — you can always change it later.', {
          interactiveType: 'plan_selection_card',
          interactivePayload: planSelectionPayload(enrollmentAI.data.planId),
          flowStep: { current: 1, total: 4, label: 'Choose Plan' },
        }),
      ],
      nextState: enrollmentNextState(enrollmentAI),
    }
  }

  if (enrollmentAI.step === 'success') {
    return {
      messages: [
        assistantMessage("You're all set. Hit the button to view your plan details.", {
          interactiveType: 'success_card',
          interactivePayload: buildSuccessPayload(),
        }),
      ],
      nextState: enrollmentNextState(enrollmentAI),
    }
  }

  // Fallback — re-show current step's card
  const stepCards: Record<string, { type: string; payload: unknown; step: { current: number; total: number; label: string } }> = {
    contribution: {
      type: 'enrollment_contribution_card',
      payload: contributionPayload(enrollmentAI.data.planId ?? 'core_401k', enrollmentAI.data.planLabel ?? 'CORE 401(k) Plan'),
      step: { current: 2, total: 4, label: 'Set Contribution' },
    },
    investment: {
      type: 'enrollment_investment_card',
      payload: investmentPayload(enrollmentAI.data.planId ?? 'core_401k', enrollmentAI.data.planLabel ?? 'CORE 401(k) Plan', enrollmentAI.data.contribution ?? 6),
      step: { current: 3, total: 4, label: 'Investment Strategy' },
    },
    review: {
      type: 'enrollment_review_card',
      payload: reviewPayload(enrollmentAI),
      step: { current: 4, total: 4, label: 'Review & Confirm' },
    },
  }

  const current = stepCards[enrollmentAI.step]
  if (current) {
    return {
      messages: [
        assistantMessage('Use the panel on the right to continue.', {
          interactiveType: current.type,
          interactivePayload: current.payload,
          flowStep: current.step,
        }),
      ],
      nextState: enrollmentNextState(enrollmentAI),
    }
  }

  return { messages: [assistantMessage("Let's start enrollment. Pick a plan to get going.", {
    interactiveType: 'plan_selection_card',
    interactivePayload: planSelectionPayload(),
    flowStep: { current: 1, total: 4, label: 'Choose Plan' },
  })], nextState: enrollmentNextState(enrollmentAI) }
}

export function isEnrollmentGuidedContext(ctx: Record<string, unknown>): boolean {
  return ctx.guided === true && ctx[ENROLLMENT_AI_STATE_KEY] != null
}
