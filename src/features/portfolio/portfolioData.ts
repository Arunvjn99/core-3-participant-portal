import { fundByTicker, type PlanFund } from '@/features/plan/planFunds'
import type { Allocation, InvestmentElection, SourceKey } from '@/features/plan/electionsData'

/**
 * Account balances and holdings. SAMPLE DATA: balances, source mix and NAVs are illustrative; holdings are
 * derived from the participant's real investment election so the views stay consistent with what they chose.
 */
export interface PlanAccount {
  id: string
  name: string
  planId: string
  type: string
  status: 'participating'
  balance: number
  vested: number
}

export const PLANS: PlanAccount[] = [
  { id: '401k', name: 'Savings and Retirement 401(k) Plan', planId: '124542', type: '401(k)', status: 'participating', balance: 274_200.82, vested: 249_800 },
  { id: 'profit-sharing', name: 'Profit Sharing and Employee Ownership Plan', planId: '124890', type: 'Profit Sharing', status: 'participating', balance: 13_250, vested: 13_250 },
]

export const TOTAL_BALANCE = PLANS.reduce((s, p) => s + p.balance, 0)
export const TOTAL_VESTED = PLANS.reduce((s, p) => s + p.vested, 0)

export type SourceId = 'preTax' | 'roth' | 'match' | 'afterTax' | 'profitSharing' | 'rollover' | 'qnec' | 'safeHarbor' | 'discretionary' | 'catchUp' | 'rolloverRoth'

/** Share of the 401(k) balance held in each money source (sums to 100). */
export const SOURCE_MIX: { id: SourceId; pct: number }[] = [
  { id: 'preTax', pct: 36.71 },
  { id: 'roth', pct: 12.62 },
  { id: 'match', pct: 20.65 },
  { id: 'afterTax', pct: 5.16 },
  { id: 'profitSharing', pct: 5.74 },
  { id: 'rollover', pct: 8.03 },
  { id: 'qnec', pct: 2.07 },
  { id: 'safeHarbor', pct: 3.67 },
  { id: 'discretionary', pct: 2.41 },
  { id: 'catchUp', pct: 2.07 },
  { id: 'rolloverRoth', pct: 0.87 },
]

/** Placeholder net asset value per share as of the "as of" date. */
export const NAV: Record<string, number> = { VTSAX: 142.3, VIMAX: 64.5, VIGAX: 188.1, VSGAX: 98.1, VBTLX: 10.12, PONAX: 9.85, VWIGX: 32.4, VEMAX: 41.2, VGSLX: 18.6 }

export interface Holding {
  ticker: string
  fund: PlanFund
  nav: number
  units: number
  value: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** The allocation that applies to a given money source under the participant's election. */
export function allocationForSource(e: InvestmentElection, source: SourceId): Allocation {
  if (e.applyAllSources) return e.allocations.all
  if (source === 'preTax') return e.allocations.preTax
  if (source === 'roth') return e.allocations.roth
  return e.allocations.all
}

export function holdingsFor(balance: number, allocation: Allocation): Holding[] {
  const entries = Object.entries(allocation).filter(([tk, pct]) => pct > 0 && fundByTicker(tk))
  const values = entries.map(([, pct]) => round2((balance * pct) / 100))
  // Put any rounding difference on the largest position so the holdings always add up to the balance.
  const diff = round2(balance - values.reduce((a, b) => a + b, 0))
  if (entries.length && diff !== 0) values[values.indexOf(Math.max(...values))] = round2(values[values.indexOf(Math.max(...values))] + diff)
  return entries.map(([ticker], i) => {
    const fund = fundByTicker(ticker) as PlanFund
    const nav = NAV[ticker] ?? 1
    return { ticker, fund, nav, units: Math.round((values[i] / nav) * 1000) / 1000, value: values[i] }
  })
}

/** Balance of each money source; rounding differences are absorbed by the largest source so they add up to the plan balance. */
export function sourceBalances(planBalance = PLANS[0].balance): Record<SourceId, number> {
  const out = Object.fromEntries(SOURCE_MIX.map((s) => [s.id, round2((planBalance * s.pct) / 100)])) as Record<SourceId, number>
  const diff = round2(planBalance - Object.values(out).reduce((a, b) => a + b, 0))
  if (diff !== 0) out.preTax = round2(out.preTax + diff)
  return out
}

/** Combined holdings of the 401(k) across sources, grouped by fund. */
export function allHoldings(e: InvestmentElection): Holding[] {
  const byTicker = new Map<string, Holding>()
  const balances = sourceBalances()
  for (const s of SOURCE_MIX) {
    for (const h of holdingsFor(balances[s.id], allocationForSource(e, s.id))) {
      const cur = byTicker.get(h.ticker)
      if (cur) {
        cur.value = round2(cur.value + h.value)
        cur.units = Math.round((cur.units + h.units) * 1000) / 1000
      } else byTicker.set(h.ticker, { ...h })
    }
  }
  return [...byTicker.values()].sort((a, b) => b.value - a.value)
}

export function byAssetClass(holdings: Holding[]): { assetClass: string; value: number; holdings: Holding[] }[] {
  const map = new Map<string, Holding[]>()
  for (const h of holdings) map.set(h.fund.assetClass, [...(map.get(h.fund.assetClass) ?? []), h])
  return [...map.entries()].map(([assetClass, hs]) => ({ assetClass, holdings: hs, value: round2(hs.reduce((s, h) => s + h.value, 0)) })).sort((a, b) => b.value - a.value)
}

/** Invested (cost) basis is placeholder: current value divided by a fund-specific growth factor. */
export function investedBalance(h: Holding): number {
  return round2(h.value / (1 + h.fund.returns.y1 / 100 / 1.5))
}

export type Period = '1M' | '3M' | '6M' | 'YTD' | '1Y' | '3Y' | '5Y' | '10Y'
export const PERIODS: Period[] = ['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', '10Y']

/** Return for a period, derived from the fund's reported annual returns. Sample data. */
export function periodReturn(f: PlanFund, p: Period): number {
  const r = f.returns
  switch (p) {
    case '1M': return r.y1 / 12
    case '3M': return r.y1 / 4
    case '6M': return r.y1 / 2
    case 'YTD': return r.ytd
    case '1Y': return r.y1
    case '3Y': return (r.y1 * 2 + r.y5) / 3
    case '5Y': return r.y5
    case '10Y': return r.y10
  }
}

/** Value-weighted return for a set of holdings. */
export function weightedReturn(hs: Holding[], p: Period): number {
  const total = hs.reduce((s, h) => s + h.value, 0)
  return total > 0 ? hs.reduce((s, h) => s + (h.value / total) * periodReturn(h.fund, p), 0) : 0
}

export interface SdbAccount {
  number: string
  type: 'traditional' | 'roth'
  updatedOn: string
  updatedThrough: string
}
export const SDB_ACCOUNTS: SdbAccount[] = [
  { number: '1000000001', type: 'traditional', updatedOn: '2025-11-21', updatedThrough: 'file' },
  { number: '1000000002', type: 'roth', updatedOn: '2026-02-15', updatedThrough: 'api' },
]

export type { SourceKey }
