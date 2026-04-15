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
    shortAnswer: 'Vested money stays yours even if you change jobs. The rest vests over time according to your plan\'s schedule.',
    fullAnswer: 'Your **vested balance** is what you truly own today — it follows your plan\'s vesting schedule (graded, cliff, etc.). Employer money often vests gradually; your own contributions are usually fully vested from day one. Your statement shows **vested vs. total**; loans and withdrawals typically pull from vested dollars so you don\'t forfeit employer funds. For the fine print, peek at your **Summary Plan Description**.',
  },
  {
    id: '401k_basics',
    keywords: ['what is a 401', '401(k)', '401k', '401 k', 'employer retirement plan', 'defined contribution'],
    question: 'What is a 401(k)?',
    shortAnswer: 'It\'s a workplace retirement account: you save from each paycheck (often with a match) and get tax perks along the way.',
    fullAnswer: 'A **401(k)** is your employer\'s retirement plan. You chip in from each paycheck — traditional, Roth, or both if your plan offers them — and investments grow with tax advantages until you take money out. Lots of employers **match** part of what you save; grabbing the full match is a smart first step. Traditional withdrawals are usually taxed as income in retirement; early withdrawals may cost extra unless an exception applies.',
  },
  {
    id: 'roth_vs_traditional',
    keywords: ['roth vs', 'traditional vs roth', 'roth or traditional', 'pre-tax or roth', 'after-tax 401'],
    question: 'Roth vs traditional contributions',
    shortAnswer: 'Traditional saves you taxes today; Roth is taxed now, but qualified withdrawals later can be tax-free.',
    fullAnswer: '**Traditional** money goes in before tax, so your taxable income drops this year — you\'ll generally pay income tax when you withdraw in retirement. **Roth** is funded with after-tax dollars; if you follow the rules, qualified withdrawals can be tax-free later. There\'s no one "right" answer — it depends on your tax bracket now vs. later, how long you\'ll invest, and whether you like paying taxes now or later. Plenty of people use a mix.',
  },
  {
    id: 'plan_loans',
    keywords: ['401k loan', 'plan loan', 'borrow from 401', 'loan from my account', 'loan rules', 'loan limit', 'maximum loan', 'loan interest', 'repay loan'],
    question: 'How do 401(k) loans work?',
    shortAnswer: 'If your plan allows it, you borrow from what\'s vested, pay yourself back with interest, and usually repay through payroll.',
    fullAnswer: 'When your plan offers **401(k) loans**, you can borrow from your **vested** balance within IRS and plan limits — often up to the lesser of 50% of vested dollars or $50,000. Payments (principal + interest) go back into **your** account, usually straight from your paycheck. If you don\'t pay it back on schedule, or you leave your job with a balance outstanding, the rest may count as a **taxable distribution** — sometimes with penalties.',
  },
  {
    id: 'withdrawal_rules',
    keywords: ['withdrawal rules', 'early withdrawal', 'penalty', 'hardship withdrawal', 'take money out before retirement', 'cash out 401', 'distribution rules'],
    question: 'What are the withdrawal rules?',
    shortAnswer: 'Before 59½, withdrawals are often taxed and hit with an extra 10% unless you qualify for an exception.',
    fullAnswer: 'Money coming out of a traditional 401(k) is usually taxed as income. If you\'re under **59½**, there\'s often a **10% additional tax** on top — unless you fit an exception (certain hardships, disability, separation after 55 in some cases, newer rules like parts of SECURE 2.0, etc.). **Roth** works differently for contributions vs. earnings. Your plan\'s **SPD** and administrator spell out what\'s actually available to you.',
  },
  {
    id: 'contribution_limits',
    keywords: ['contribution limit', 'irs limit', 'max contribution', 'max deferral', 'annual limit', 'how much can i contribute', '402(g)'],
    question: 'What are the contribution limits?',
    shortAnswer: 'The IRS caps how much you can defer each year; if you\'re 50+, catch-up may let you add more.',
    fullAnswer: 'Each year the IRS sets **elective deferral limits** for 401(k)s (they bump them occasionally). If you\'re **50 or older**, **catch-up** contributions can let you save extra — when your plan allows it. Employer match or profit-sharing follows different rules than your personal deferral cap. Payroll systems usually stop you from going over; if you\'re close to the max, your plan admin can confirm the numbers.',
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
