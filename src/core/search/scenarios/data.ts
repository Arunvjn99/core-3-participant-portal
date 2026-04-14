import type { SearchScenario } from './types'

export const ROUTE_SCENARIOS: SearchScenario[] = [
  { id: 'start_enrollment', keywords: ['enroll', 'start enrollment', 'sign up', 'join plan', '401k enrollment'], queries: ['Start enrollment', 'How to enroll?'], subtitle: 'Enrollment', type: 'navigation', route: '/enrollment/plan' },
  { id: 'enrollment_status', keywords: ['enrollment status', 'am i enrolled', 'already enrolled'], queries: ['Check enrollment status'], subtitle: 'Enrollment', type: 'navigation', route: '/enrollment/plan' },
  { id: 'resume_enrollment', keywords: ['continue enrollment', 'resume enrollment', 'finish enrollment'], queries: ['Continue enrollment'], subtitle: 'Enrollment', type: 'navigation', route: '/enrollment/plan' },
  { id: 'auto_increase', keywords: ['auto increase', 'automatic escalation', 'annual increase'], queries: ['Turn on automatic contribution increases'], subtitle: 'Enrollment', type: 'navigation', route: '/enrollment/auto-increase' },
  { id: 'loan_status', keywords: ['loan status', 'outstanding loan', 'loan balance'], queries: ['Check my loan status'], subtitle: 'Loans', type: 'navigation', route: '/transactions/loan' },
  { id: 'withdrawal_status', keywords: ['withdrawal status', 'distribution pending'], queries: ['Check withdrawal status'], subtitle: 'Transactions', type: 'navigation', route: '/transactions' },
  { id: 'view_portfolio', keywords: ['portfolio', 'my investments', 'holdings'], queries: ['View my portfolio'], subtitle: 'Investments', type: 'navigation', route: '/investments' },
  { id: 'fund_performance', keywords: ['fund performance', 'returns', 'performance ytd'], queries: ['Fund performance'], subtitle: 'Investments', type: 'navigation', route: '/investments' },
  { id: 'investment_options', keywords: ['fund lineup', 'investment options', 'available funds'], queries: ['What funds can I choose?'], subtitle: 'Investments', type: 'navigation', route: '/investments' },
  { id: 'transaction_history', keywords: ['history', 'past transactions', 'activity'], queries: ['Transaction history'], subtitle: 'Transactions', type: 'navigation', route: '/transactions' },
  { id: 'view_balance', keywords: ['balance', 'account balance', 'how much saved'], queries: ['Check my balance'], subtitle: 'Dashboard', type: 'navigation', route: '/dashboard' },
  { id: 'transactions_hub', keywords: ['transactions', 'loans transfers'], queries: ['Transactions'], subtitle: 'Transactions', type: 'navigation', route: '/transactions' },
  { id: 'update_profile', keywords: ['profile', 'update address', 'personal info'], queries: ['Update my profile'], subtitle: 'Profile', type: 'navigation', route: '/profile' },
  { id: 'beneficiaries', keywords: ['beneficiary', 'beneficiaries'], queries: ['Update beneficiaries'], subtitle: 'Profile', type: 'navigation', route: '/profile' },
  { id: 'contact_support', keywords: ['help', 'support', 'contact'], queries: ['Contact support'], subtitle: 'Help', type: 'navigation', route: '/dashboard' },
]

export const FLOW_SCENARIOS: SearchScenario[] = [
  { id: 'increase_contribution', keywords: ['increase contribution', 'raise deferral', 'save more paycheck'], queries: ['Increase contribution'], subtitle: 'Contributions', type: 'action', action: 'OPEN_CONTRIBUTION_FLOW' },
  { id: 'apply_loan', keywords: ['loan', 'apply loan', 'borrow', '401k loan'], queries: ['Apply for a loan'], subtitle: 'Loans', type: 'action', action: 'OPEN_LOAN_FLOW' },
  { id: 'withdraw_money', keywords: ['withdraw', 'take money out', 'distribution'], queries: ['Withdraw money'], subtitle: 'Withdrawals', type: 'action', action: 'OPEN_WITHDRAWAL_FLOW' },
  { id: 'full_withdrawal', keywords: ['close account', 'cash out entire', 'lump sum'], queries: ['Withdraw my full balance'], subtitle: 'Withdrawals', type: 'action', action: 'OPEN_WITHDRAWAL_FLOW' },
  { id: 'rebalance', keywords: ['rebalance', 'rebalancing'], queries: ['Rebalance my portfolio'], subtitle: 'Rebalance', type: 'action', action: 'OPEN_REBALANCE_FLOW' },
  { id: 'transfer_money', keywords: ['transfer between accounts', 'move money plan'], queries: ['Transfer between accounts'], subtitle: 'Transfer', type: 'action', action: 'OPEN_TRANSFER_FLOW' },
  { id: 'rollover_in', keywords: ['rollover in', 'roll old 401k'], queries: ['Roll over an old 401k'], subtitle: 'Rollover', type: 'action', action: 'OPEN_ROLLOVER_FLOW' },
]

export const FAQ_SCENARIOS: SearchScenario[] = [
  { id: 'enrollment_time', keywords: ['how long enrollment', 'enrollment take'], queries: ['How long does enrollment take?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Enrollment usually takes about 5–15 minutes if you have your personal and beneficiary information ready.' },
  { id: 'mandatory_enrollment', keywords: ['mandatory enrollment', 'required to enroll'], queries: ['Is enrollment mandatory?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Rules vary by employer. Some plans auto-enroll or require participation; check your summary plan description or HR.' },
  { id: 'auto_enrollment', keywords: ['auto enroll', 'automatic enrollment'], queries: ['Am I automatically enrolled?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Many employers auto-enroll new hires at a default deferral unless you opt out. Confirm in your plan materials.' },
  { id: 'choose_plan_help', keywords: ['choose plan', 'which plan', 'roth or traditional'], queries: ['Help me choose a plan'], subtitle: 'Ask Core AI', type: 'ai' },
  { id: 'enrollment_deadline', keywords: ['deadline', 'enroll by'], queries: ['When is the enrollment deadline?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Deadlines depend on your employer and plan year. Ask HR or check your plan\'s enrollment materials.' },
  { id: 'contribution_limit', keywords: ['contribution limit', '401k limit', 'irs limit', 'max deferral'], queries: ['Contribution limit'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'IRS sets annual elective deferral limits and catch-up amounts for 50+. Your plan may also impose limits—check your plan summary.' },
  { id: 'employer_match', keywords: ['employer match', 'company match', 'free money'], queries: ['Does my employer match?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Many plans match a portion of your contributions (e.g. 50% up to 6% of pay). Match formulas vary—see your plan document.' },
  { id: 'pre_tax_vs_roth', keywords: ['roth 401k', 'pre-tax vs roth', 'traditional vs roth'], queries: ['Roth vs traditional'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Traditional deferrals reduce taxable income now; Roth is taxed now and qualified withdrawals may be tax-free later.' },
  { id: 'catch_up_contributions', keywords: ['catch-up', 'age 50', 'over 50 contribution'], queries: ['Catch-up contributions'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Participants 50+ may contribute extra above the normal deferral limit—see current IRS catch-up limits for the year.' },
  { id: 'loan_eligibility', keywords: ['loan eligibility', 'can i borrow'], queries: ['Am I eligible for a loan?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Eligibility usually depends on vested balance, outstanding loans, and plan rules—not all plans allow loans.' },
  { id: 'loan_limit', keywords: ['loan limit', 'maximum loan', 'how much borrow'], queries: ['How much can I borrow?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'IRS rules cap loans (often the lesser of 50% of your vested balance or $50,000, reduced by other loans).' },
  { id: 'loan_interest', keywords: ['loan interest rate', '401k loan rate'], queries: ['What is my loan interest rate?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Rates are set by the plan (often prime-based). You pay interest to your own account, not a bank.' },
  { id: 'loan_repayment', keywords: ['loan repayment', 'pay back loan', 'loan payroll'], queries: ['How do I repay my loan?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Repayment is typically through payroll deductions over a term allowed by your plan (often up to 5 years).' },
  { id: 'early_penalty', keywords: ['early withdrawal', 'penalty 59', '59 and a half'], queries: ['Early withdrawal penalty'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Taking taxable distributions before age 59½ often triggers a 10% federal additional tax, with exceptions.' },
  { id: 'withdrawal_tax', keywords: ['tax on withdrawal', 'withholding'], queries: ['Tax on withdrawal'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Traditional balances are generally taxable when distributed; Roth may be tax-free if qualified. Mandatory withholding often applies.' },
  { id: 'withdrawal_time', keywords: ['how long withdrawal', 'processing time withdrawal'], queries: ['How long does a withdrawal take?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Many plans process within several business days after approval; timing varies by payment method and custodian.' },
  { id: 'target_date_funds', keywords: ['target date', 'lifecycle fund'], queries: ['What are target date funds?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Target-date funds gradually shift from stocks to bonds as the target retirement year approaches—one-stop diversification.' },
  { id: 'direct_rollover', keywords: ['direct rollover', 'trustee to trustee'], queries: ['What is a direct rollover?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'A direct rollover sends funds straight to another retirement account, often avoiding mandatory withholding.' },
  { id: 'vested_balance', keywords: ['vested', 'vesting', 'vested balance'], queries: ['What is my vested balance?'], subtitle: 'Ask Core AI', type: 'ai' },
  { id: 'fiduciary_advice', keywords: ['advisor', 'financial advisor', 'personalized advice'], queries: ['Do I get financial advice?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Plans may offer education, tools, or optional advisory services. Personalized advice may cost extra—check your plan\'s service menu.' },
]

export const SEARCH_SCENARIOS: SearchScenario[] = [...ROUTE_SCENARIOS, ...FLOW_SCENARIOS, ...FAQ_SCENARIOS]

export function getScenarioById(id: string): SearchScenario | undefined {
  return SEARCH_SCENARIOS.find((s) => s.id === id)
}
