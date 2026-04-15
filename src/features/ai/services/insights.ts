export function getPlanInsight(plan: string): string {
  const p = (plan || '').toLowerCase()
  if (p.includes('roth')) return 'Roth can grow tax-free — a sweet spot if you think your tax rate might be higher later on.'
  if (p.includes('traditional') || p.includes('pre-tax')) return 'Traditional trims your taxable income today — nice if you\'re in a higher bracket right now.'
  return 'Either path can work; it mostly comes down to your tax picture today vs. what you expect in retirement.'
}

export function getContributionInsight(percent: number): { insight: string; suggestion?: { label: string; value: number } } {
  if (percent < 6) return { insight: 'Lots of plans match up to around 6% — you might be leaving some of that on the table.', suggestion: { label: 'Try increasing to 8%', value: 8 } }
  if (percent < 10) return { insight: 'Nice — you\'re probably grabbing a good chunk of any employer match.' }
  if (percent < 15) return { insight: 'That\'s a strong savings rate; you\'re building something real for later.' }
  return { insight: 'You\'re really leaning into long-term growth — great habit to have.' }
}

export function getInvestmentInsight(type: string): string {
  const t = (type || '').toLowerCase()
  if (t.includes('target') || t.includes('date')) return 'Target-date funds shift over time without you babysitting them — popular if you want simplicity.'
  if (t.includes('manual')) return 'Going manual means more control; it helps if you\'re comfy picking your own mix.'
  if (t.includes('advisor')) return 'An advisor-led option blends growth and risk — works well for a lot of people.'
  return 'Pick what matches how involved you want to be day to day.'
}

export function getWithdrawalInsight(amount: number): { insight: string } {
  if (amount < 1000) return { insight: 'On the smaller side — just double-check whether your plan has a minimum.' }
  if (amount < 5000) return { insight: 'Pretty typical range. Heads-up: there\'s often a 10% extra tax if you\'re under 59½ (with exceptions).' }
  return { insight: 'That\'s a bigger chunk — worth thinking through withholding and how it affects your retirement picture.' }
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
