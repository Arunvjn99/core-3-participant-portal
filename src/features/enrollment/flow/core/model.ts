import { PLAN_DEFAULT_ALLOCATION, type AutoIncrease, type InvestMode, type RiskStyle, type Unit } from '@/features/plan/electionsData'
import { fundCatalog, recommendedFunds, type RiskKey } from '../../investmentCatalog'

/** The participant's elections as one object, so editors can work on a copy and apply it in one go. */
export type Row = { ticker: string; pct: number }

export interface Election {
  unit: Unit
  preTax: number
  roth: number
  /** After-tax savings: not matched, and auto-increase doesn't raise them */
  afterTax: number
  auto: AutoIncrease
  mode: InvestMode
  risk: RiskKey
  /** The risk questionnaire's answer, once taken: the risk level can be changed only after it */
  riskStyle?: RiskStyle
  ownRows: Row[]
  autoRebalance: boolean
  sdb: boolean
}

export const RISKS: RiskKey[] = ['conservative', 'balanced', 'growth', 'aggressive']
export const AUTO_AMOUNTS = [1, 2, 3]
export const AUTO_CAPS = [10, 12, 15]

/** One distinct colour per fund position, so allocations stay readable however many funds there are. */
/**
 * Fund colours, in a fixed order (a fund keeps its colour wherever it appears). The first five pass the colour-blind
 * separation and normal-vision checks next to each other; dark mode uses deeper steps of the same hues so they sit in
 * the readable band on the dark surface. Light-mode teal, amber and sky are faint on white, so a fund is always named
 * beside its colour (legend rows or a table), never shown by colour alone.
 */
export const FUND_COLORS = ['#2563eb', '#14b8a6', '#6366f1', '#f59e0b', '#0ea5e9', '#a855f7', '#ec4899', '#64748b', '#22c55e', '#f97316']
export const FUND_COLORS_DARK = ['#3b82f6', '#0d9488', '#6366f1', '#d97706', '#0284c7', '#a855f7', '#ec4899', '#64748b', '#22c55e', '#f97316']
export const fundColor = (i: number, dark = false) => (dark ? FUND_COLORS_DARK : FUND_COLORS)[i % FUND_COLORS.length]

export const round2 = (n: number) => Math.round(n * 100) / 100
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function rowsFor(e: Election): Row[] {
  if (e.mode === 'plan_selected') return Object.entries(PLAN_DEFAULT_ALLOCATION).map(([ticker, pct]) => ({ ticker, pct }))
  if (e.mode === 'risk_style') return recommendedFunds(e.risk).map((f) => ({ ticker: f.ticker, pct: f.allocation }))
  return e.ownRows
}

export const fundMeta = (ticker: string) => fundCatalog.find((c) => c.ticker === ticker)

export function blendedFee(rows: Row[]): number {
  return rows.reduce((s, r) => s + (r.pct * parseFloat(fundMeta(r.ticker)?.expense ?? '0')) / 100, 0)
}

/** Allocation grouped by asset class, largest first */
export function byAssetClass(rows: Row[]): { name: string; pct: number }[] {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = fundMeta(r.ticker)?.assetClass ?? 'Other'
    m.set(k, (m.get(k) ?? 0) + r.pct)
  }
  return [...m.entries()].map(([name, pct]) => ({ name, pct })).sort((a, b) => b.pct - a.pct)
}

export const sameElection = (a: Election, b: Election) => JSON.stringify(a) === JSON.stringify(b)
