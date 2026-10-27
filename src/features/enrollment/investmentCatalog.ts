/** Fund lineup and recommended allocations by risk level, shared by the enrollment steps and one-click enrolment. */

export interface FundDetail { name: string; ticker: string; expense: string }
export interface AllocationEntry { name: string; value: number; color: string; funds: FundDetail[] }
export interface SourceFundAllocation { name: string; ticker: string; expense: string; assetClass: string; color: string; allocation: number }

export const allocations: Record<string, AllocationEntry[]> = {
  conservative: [
    { name: 'Bonds', value: 45, color: 'var(--chart-blue)', funds: [{ name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%' }, { name: 'PIMCO Income Fund', ticker: 'PONAX', expense: '0.59%' }] },
    { name: 'US Stocks', value: 25, color: 'var(--chart-green)', funds: [{ name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%' }] },
    { name: 'International Stocks', value: 15, color: 'var(--chart-purple)', funds: [{ name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%' }] },
    { name: 'Real Estate', value: 15, color: 'var(--chart-amber)', funds: [{ name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%' }] },
  ],
  balanced: [
    { name: 'US Stocks', value: 40, color: 'var(--chart-green)', funds: [{ name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%' }, { name: 'Vanguard Mid-Cap Index', ticker: 'VIMAX', expense: '0.05%' }] },
    { name: 'Bonds', value: 25, color: 'var(--chart-blue)', funds: [{ name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%' }] },
    { name: 'International Stocks', value: 20, color: 'var(--chart-purple)', funds: [{ name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%' }] },
    { name: 'Real Estate', value: 15, color: 'var(--chart-amber)', funds: [{ name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%' }] },
  ],
  growth: [
    { name: 'US Stocks', value: 50, color: 'var(--chart-green)', funds: [{ name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%' }, { name: 'Vanguard Growth Index', ticker: 'VIGAX', expense: '0.05%' }] },
    { name: 'International Stocks', value: 20, color: 'var(--chart-purple)', funds: [{ name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%' }] },
    { name: 'Bonds', value: 20, color: 'var(--chart-blue)', funds: [{ name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%' }] },
    { name: 'Real Estate', value: 10, color: 'var(--chart-amber)', funds: [{ name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%' }] },
  ],
  aggressive: [
    { name: 'US Stocks', value: 50, color: 'var(--chart-green)', funds: [{ name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%' }, { name: 'Vanguard Small-Cap Growth', ticker: 'VSGAX', expense: '0.07%' }] },
    { name: 'International Stocks', value: 20, color: 'var(--chart-purple)', funds: [{ name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%' }, { name: 'Vanguard Emerging Markets', ticker: 'VEMAX', expense: '0.14%' }] },
    { name: 'Bonds', value: 20, color: 'var(--chart-blue)', funds: [{ name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%' }] },
    { name: 'Real Estate', value: 10, color: 'var(--chart-amber)', funds: [{ name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%' }] },
  ],
}

export const fundCatalog: SourceFundAllocation[] = [
  { name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%', assetClass: 'Equity', color: 'var(--chart-green)', allocation: 0 },
  { name: 'Vanguard Mid-Cap Index', ticker: 'VIMAX', expense: '0.05%', assetClass: 'Equity', color: 'var(--chart-green)', allocation: 0 },
  { name: 'Vanguard Growth Index', ticker: 'VIGAX', expense: '0.05%', assetClass: 'Equity', color: 'var(--chart-green)', allocation: 0 },
  { name: 'Vanguard Small-Cap Growth', ticker: 'VSGAX', expense: '0.07%', assetClass: 'Equity', color: 'var(--chart-green)', allocation: 0 },
  { name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%', assetClass: 'Fixed Income', color: 'var(--chart-blue)', allocation: 0 },
  { name: 'PIMCO Income Fund', ticker: 'PONAX', expense: '0.59%', assetClass: 'Fixed Income', color: 'var(--chart-blue)', allocation: 0 },
  { name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%', assetClass: 'International', color: 'var(--chart-purple)', allocation: 0 },
  { name: 'Vanguard Emerging Markets', ticker: 'VEMAX', expense: '0.14%', assetClass: 'International', color: 'var(--chart-purple)', allocation: 0 },
  { name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%', assetClass: 'Real Estate', color: 'var(--chart-amber)', allocation: 0 },
]

export type RiskKey = 'conservative' | 'balanced' | 'growth' | 'aggressive'

/**
 * Recommended per-fund allocation for a risk level, summing to exactly 100%.
 * Each asset class's share is split evenly across its funds; any remainder goes to the first fund.
 */
export function recommendedFunds(risk: RiskKey): SourceFundAllocation[] {
  const out: SourceFundAllocation[] = []
  for (const cat of allocations[risk]) {
    const base = Math.floor(cat.value / cat.funds.length)
    const remainder = cat.value - base * cat.funds.length
    cat.funds.forEach((f, i) => {
      const meta = fundCatalog.find((c) => c.ticker === f.ticker)
      if (meta) out.push({ ...meta, allocation: base + (i === 0 ? remainder : 0) })
    })
  }
  return out
}
