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
  { id: 'enrollment_time', keywords: ['how long enrollment', 'enrollment take'], queries: ['How long does enrollment take?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Usually about 5–15 minutes if you already know things like your beneficiaries — a bit longer if you\'re deciding investments as you go.' },
  { id: 'mandatory_enrollment', keywords: ['mandatory enrollment', 'required to enroll'], queries: ['Is enrollment mandatory?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'It really depends on your employer. Some plans auto-enroll you or expect participation; your SPD or HR can tell you what applies to you.' },
  { id: 'auto_enrollment', keywords: ['auto enroll', 'automatic enrollment'], queries: ['Am I automatically enrolled?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'A lot of companies start new hires at a default savings rate unless you opt out — worth confirming in your welcome packet or plan site.' },
  { id: 'choose_plan_help', keywords: ['choose plan', 'which plan', 'roth or traditional'], queries: ['Help me choose a plan'], subtitle: 'Ask Core AI', type: 'ai' },
  { id: 'enrollment_deadline', keywords: ['deadline', 'enroll by'], queries: ['When is the enrollment deadline?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Every employer sets this differently — HR or your enrollment kit is the quickest way to get the real date.' },
  { id: 'contribution_limit', keywords: ['contribution limit', '401k limit', 'irs limit', 'max deferral'], queries: ['Contribution limit'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'The IRS sets yearly caps (plus extra "catch-up" for 50+). Your plan might add its own guardrails — your summary is the place to double-check.' },
  { id: 'employer_match', keywords: ['employer match', 'company match', 'free money'], queries: ['Does my employer match?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Lots of plans do — often something like 50¢ on the dollar up to 6% of pay — but the formula is different everywhere, so peek at your plan doc.' },
  { id: 'pre_tax_vs_roth', keywords: ['roth 401k', 'pre-tax vs roth', 'traditional vs roth'], queries: ['Roth vs traditional'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Traditional saves you taxes today; Roth is taxed up front, and later withdrawals can be tax-free if you follow the rules.' },
  { id: 'catch_up_contributions', keywords: ['catch-up', 'age 50', 'over 50 contribution'], queries: ['Catch-up contributions'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Once you hit 50, the IRS often lets you stash a bit extra beyond the normal limit — the exact dollar amount changes year to year.' },
  { id: 'loan_eligibility', keywords: ['loan eligibility', 'can i borrow'], queries: ['Am I eligible for a loan?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Usually it comes down to your vested balance, any loans you already have, and whether your plan even offers them — not every plan does.' },
  { id: 'loan_limit', keywords: ['loan limit', 'maximum loan', 'how much borrow'], queries: ['How much can I borrow?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Federal rules typically cap you around the lesser of half your vested balance or $50k, minus other outstanding loans — your statement spells it out.' },
  { id: 'loan_interest', keywords: ['loan interest rate', '401k loan rate'], queries: ['What is my loan interest rate?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Your plan sets the rate (often tied to prime). The nice part: you\'re paying interest back into your own account.' },
  { id: 'loan_repayment', keywords: ['loan repayment', 'pay back loan', 'loan payroll'], queries: ['How do I repay my loan?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Most of the time it comes straight out of your paycheck on a schedule your plan allows — often up to five years for general loans.' },
  { id: 'early_penalty', keywords: ['early withdrawal', 'penalty 59', '59 and a half'], queries: ['Early withdrawal penalty'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Pulling money before 59½ usually means income tax plus an extra 10% on top — unless you qualify for one of the IRS exceptions.' },
  { id: 'withdrawal_tax', keywords: ['tax on withdrawal', 'withholding'], queries: ['Tax on withdrawal'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Traditional money is generally taxed when it leaves the plan; Roth can be different. Expect withholding in many cases.' },
  { id: 'withdrawal_time', keywords: ['how long withdrawal', 'processing time withdrawal'], queries: ['How long does a withdrawal take?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Most folks see it within a few business days after approval, but ACH vs. check and your custodian can change that.' },
  { id: 'target_date_funds', keywords: ['target date', 'lifecycle fund'], queries: ['What are target date funds?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'They gradually dial down risk as you near the year on the label — handy if you want a hands-off mix.' },
  { id: 'direct_rollover', keywords: ['direct rollover', 'trustee to trustee'], queries: ['What is a direct rollover?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Money moves straight from one retirement account to another without you touching it — that usually helps you skip mandatory withholding.' },
  { id: 'vested_balance', keywords: ['vested', 'vesting', 'vested balance'], queries: ['What is my vested balance?'], subtitle: 'Ask Core AI', type: 'ai' },
  { id: 'fiduciary_advice', keywords: ['advisor', 'financial advisor', 'personalized advice'], queries: ['Do I get financial advice?'], subtitle: 'Quick answer', type: 'ai', quickAnswer: 'Many plans include calculators, webinars, or even one-on-one help — sometimes free, sometimes paid. Your plan menu breaks it down.' },
]

export const SEARCH_SCENARIOS: SearchScenario[] = [...ROUTE_SCENARIOS, ...FLOW_SCENARIOS, ...FAQ_SCENARIOS]

export function getScenarioById(id: string): SearchScenario | undefined {
  return SEARCH_SCENARIOS.find((s) => s.id === id)
}
