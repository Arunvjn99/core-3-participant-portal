export function getPlanInsight(plan: string): string {
  const p = (plan || '').toLowerCase()
  if (p.includes('roth')) return 'Roth grows tax-free. Great if you expect higher income in retirement.'
  if (p.includes('traditional') || p.includes('pre-tax')) return 'Pre-tax lowers your taxable income now. Ideal if you\'re in a high tax bracket.'
  return 'Choose based on your tax situation and retirement timeline.'
}

export function getContributionInsight(percent: number): { insight: string; suggestion?: { label: string; value: number } } {
  if (percent < 6) return { insight: 'Many plans match up to 6%. You may be leaving employer money on the table.', suggestion: { label: 'Try increasing to 8%', value: 8 } }
  if (percent < 10) return { insight: 'Solid start. You\'re likely capturing most of your employer match.' }
  if (percent < 15) return { insight: 'Strong savings rate. You\'re building a healthy retirement foundation.' }
  return { insight: 'Excellent. You\'re maximizing long-term growth potential.' }
}

export function getInvestmentInsight(type: string): string {
  const t = (type || '').toLowerCase()
  if (t.includes('target') || t.includes('date')) return 'Target date funds adjust automatically. Set and forget.'
  if (t.includes('manual')) return 'Manual gives more control. Best if you\'re comfortable choosing allocations.'
  if (t.includes('advisor')) return 'Advisor mix balances growth and risk. Good for most participants.'
  return 'Choose based on how hands-on you want to be.'
}

export function getWithdrawalInsight(amount: number): { insight: string } {
  if (amount < 1000) return { insight: 'Small withdrawal. Check if your plan has a minimum.' }
  if (amount < 5000) return { insight: 'Typical range. Remember: 10% early withdrawal penalty if under 59½.' }
  return { insight: 'Large withdrawal. Consider tax withholding and impact on retirement goals.' }
}

export type VestedInsightData = { total: number; vested: number; unvested: number; percent?: number }

export function getVestedInsight(data: VestedInsightData): string {
  const { unvested, percent } = data
  if (percent != null) {
    if (percent >= 100) return 'You\'re fully vested. All employer contributions are yours.'
    if (percent >= 75) return 'You\'re mostly vested. Keep contributing to reach 100%.'
    if (percent >= 50) return 'Halfway there. Vesting typically increases each year.'
  }
  if (unvested > 0) return 'Vested = what you own. Unvested may be forfeited if you leave early.'
  return 'Your vested balance is the amount you fully own.'
}
