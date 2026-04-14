export type FAQEntry = {
  id: string
  keywords: string[]
  question: string
  shortAnswer: string
  fullAnswer: string
}

export const FAQ_ANSWERS: FAQEntry[] = [
  {
    id: 'vested_balance',
    keywords: ['vested balance', 'what is my vested', 'how much is vested', 'vesting', 'vested amount', 'unvested', '% vested', 'percent vested', 'when do i vest'],
    question: 'What is my vested balance?',
    shortAnswer: 'Vested dollars are yours even if you leave the employer. The rest "vests" on a schedule your plan defines.',
    fullAnswer: '**Vested balance** is the portion of your account you own outright based on your plan\'s vesting schedule (e.g. graded or cliff vesting). Employer contributions often vest over time; your own deferrals are typically fully vested. Check your statement or plan site for **vested vs total**—only vested amounts are available for loans or withdrawals without forfeiting employer money. Exact rules are in your **Summary Plan Description**.',
  },
  {
    id: '401k_basics',
    keywords: ['what is a 401', '401(k)', '401k', '401 k', 'employer retirement plan', 'defined contribution'],
    question: 'What is a 401(k)?',
    shortAnswer: 'A 401(k) lets you save from each paycheck, often with an employer match, with tax advantages until retirement.',
    fullAnswer: 'A **401(k)** is an employer-sponsored retirement plan. You contribute from pay (pre-tax and/or Roth if offered); investments grow tax-deferred or tax-free for qualified Roth withdrawals. Many employers **match** a portion—capturing the full match is a common first goal. Withdrawals are generally taxed as ordinary income (traditional) and may have penalties if taken before age 59½ unless an exception applies.',
  },
  {
    id: 'roth_vs_traditional',
    keywords: ['roth vs', 'traditional vs roth', 'roth or traditional', 'pre-tax or roth', 'after-tax 401'],
    question: 'Roth vs traditional contributions',
    shortAnswer: 'Traditional lowers taxable income now; Roth uses after-tax dollars so qualified withdrawals can be tax-free later.',
    fullAnswer: '**Traditional 401(k)** contributions reduce your taxable income today; withdrawals in retirement are generally taxed as ordinary income. **Roth 401(k)** contributions are after-tax; qualified withdrawals of earnings can be tax-free. The better choice depends on your current vs expected retirement tax bracket, time horizon, and whether you value certainty (Roth) vs upfront tax relief (traditional). Many people split between both.',
  },
  {
    id: 'plan_loans',
    keywords: ['401k loan', 'plan loan', 'borrow from 401', 'loan from my account', 'loan rules', 'loan limit', 'maximum loan', 'loan interest', 'repay loan'],
    question: 'How do 401(k) loans work?',
    shortAnswer: 'You borrow from your vested balance, pay yourself interest, and must repay on schedule—usually via payroll.',
    fullAnswer: '**401(k) loans** (if your plan allows) let you borrow from your **vested** balance up to IRS/plan limits, often up to 50% of the vested balance or $50,000, whichever is less. You repay principal and interest to your account, typically through payroll deduction. If you default or leave employment without repaying on time, the outstanding balance may be treated as a **taxable distribution** with possible penalties.',
  },
  {
    id: 'withdrawal_rules',
    keywords: ['withdrawal rules', 'early withdrawal', 'penalty', 'hardship withdrawal', 'take money out before retirement', 'cash out 401', 'distribution rules'],
    question: 'What are the withdrawal rules?',
    shortAnswer: 'Withdrawals may be taxed and penalized before 59½ unless you qualify for an exception (e.g. hardship, SECURE 2.0 provisions).',
    fullAnswer: '**Withdrawals** from a 401(k) are generally taxable as income (traditional) and may incur a **10% early withdrawal penalty** if you\'re under 59½, unless an exception applies—such as certain hardships, disability, separation after age 55, or other IRS/plan-specific rules. **Roth** accounts have different rules for contributions vs earnings. Your plan\'s **SPD** and administrator define which options you have.',
  },
  {
    id: 'contribution_limits',
    keywords: ['contribution limit', 'irs limit', 'max contribution', 'max deferral', 'annual limit', 'how much can i contribute', '402(g)'],
    question: 'What are the contribution limits?',
    shortAnswer: 'IRS sets annual deferral limits for 401(k)s; catch-up contributions are allowed after age 50 if your plan supports them.',
    fullAnswer: 'The IRS sets **annual elective deferral limits** for 401(k) plans (often adjusted yearly). If you\'re **50 or older**, **catch-up** contributions may be allowed if your plan permits them. Employer matching/profit-sharing doesn\'t count toward your personal deferral cap the same way. Your payroll or plan site usually blocks excess deferrals; ask your plan administrator if you\'re near the limit.',
  },
]

const byId = new Map(FAQ_ANSWERS.map((e) => [e.id, e]))

export function getFAQById(id: string): FAQEntry | undefined {
  return byId.get(id)
}

export function getFAQMatch(query: string): FAQEntry | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  const scored = FAQ_ANSWERS.map((entry) => {
    let best = 0
    for (const k of entry.keywords) {
      const needle = k.toLowerCase()
      if (!needle) continue
      if (q === needle) best = Math.max(best, 100 + needle.length)
      else if (q.includes(needle)) best = Math.max(best, needle.length)
    }
    return { entry, score: best }
  }).filter((x) => x.score > 0)

  if (scored.length === 0) return null
  scored.sort((a, b) => b.score - a.score)
  return scored[0]!.entry
}
