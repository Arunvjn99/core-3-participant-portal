export function getPlanInsight(plan: string): string {
  const p = (plan || '').toLowerCase()
  if (p.includes('roth')) return 'Roth contributions grow tax-free, which may be advantageous if you expect your tax rate to be higher in retirement.'
  if (p.includes('traditional') || p.includes('pre-tax')) return 'Traditional (pre-tax) contributions reduce your taxable income today, which can be beneficial if you are currently in a higher tax bracket.'
  return 'Both options are viable; the right choice generally depends on your current tax situation versus your expected rate in retirement.'
}

export function getContributionInsight(percent: number): { insight: string; suggestion?: { label: string; value: number } } {
  if (percent < 6) return { insight: 'Many plans offer employer matching up to around 6% of your salary. Contributing below this threshold may mean missing out on available employer contributions.', suggestion: { label: 'Try increasing to 8%', value: 8 } }
  if (percent < 10) return { insight: 'Your contribution rate is sufficient to capture a meaningful portion of your employer match.' }
  if (percent < 15) return { insight: 'This is a strong contribution rate that will support meaningful growth in your retirement savings over time.' }
  return { insight: 'You are contributing at a high rate, which positions you well for long-term retirement security.' }
}

export function getInvestmentInsight(type: string): string {
  const t = (type || '').toLowerCase()
  if (t.includes('target') || t.includes('date')) return 'Target-date funds automatically adjust their asset allocation as you approach retirement, making them a low-maintenance option for many participants.'
  if (t.includes('manual')) return 'A manual allocation gives you greater control over your investment mix and may suit participants who are comfortable managing their own portfolio.'
  if (t.includes('advisor')) return 'An advisor-managed option balances growth potential with risk management, which is well-suited for participants who prefer a professionally guided approach.'
  return 'Select the option that best matches your preferred level of involvement in managing your investments.'
}

export function getWithdrawalInsight(amount: number): { insight: string } {
  if (amount < 1000) return { insight: 'This is a relatively small amount — please verify whether your plan has a minimum withdrawal requirement.' }
  if (amount < 5000) return { insight: 'Please note that withdrawals before age 59½ are generally subject to ordinary income tax plus a 10% early withdrawal penalty, unless an exception applies.' }
  return { insight: 'For larger withdrawals, it is worth considering the tax withholding implications and the long-term impact on your retirement savings.' }
}

export type VestedInsightData = { total: number; vested: number; unvested: number; percent?: number }

export function getVestedInsight(data: VestedInsightData): string {
  const { unvested, percent } = data
  if (percent != null) {
    if (percent >= 100) return 'You\'re fully vested — employer money in your account is yours to keep.'
    if (percent >= 75) return 'You\'re most of the way there; staying on track usually gets you the rest over time.'
    if (percent >= 50) return 'You\'re past the halfway mark — vesting often ticks up each year you stay.'
  }
  if (unvested > 0) return 'Think of vested as “yours no matter what.” The rest can depend on how long you stay.'
  return 'Your vested balance is simply what you own outright today.'
}
