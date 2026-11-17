import type { TFunction } from 'i18next'
import { PLANS } from '@/features/portfolio/portfolioData'
import { isLiability, type AccountType, type LinkedAccount } from './linkService'

/** This plan's account: the same record the dashboard's Total balance reads, so both pages agree. */
export const PLAN_ACCOUNT = PLANS[0]

export type AccountGroup = 'retirement' | 'assets' | 'debts'
export const ACCOUNT_GROUPS: AccountGroup[] = ['retirement', 'assets', 'debts']

const RETIREMENT_TYPES: AccountType[] = ['retirement_401k', 'ira', 'roth_ira']

export function groupOf(type: AccountType): AccountGroup {
  if (isLiability(type)) return 'debts'
  return RETIREMENT_TYPES.includes(type) ? 'retirement' : 'assets'
}

/** Slices of the "what you own" bar, in display order. */
export type AssetSlice = 'plan' | 'retirement' | 'cash' | 'property'
export const ASSET_SLICES: AssetSlice[] = ['plan', 'retirement', 'cash', 'property']

export interface OutsideAssetsSummary {
  planBalance: number
  /** Linked or manual retirement accounts held elsewhere. */
  outsideRetirement: number
  /** This plan + retirement accounts held elsewhere. */
  totalRetirement: number
  totalAssets: number
  totalDebts: number
  /** Everything owned minus everything owed. */
  netWorth: number
  slices: Record<AssetSlice, number>
}

export function summarize(accounts: LinkedAccount[], planBalance = PLAN_ACCOUNT.balance): OutsideAssetsSummary {
  const slices: Record<AssetSlice, number> = { plan: planBalance, retirement: 0, cash: 0, property: 0 }
  let totalDebts = 0
  for (const a of accounts) {
    const group = groupOf(a.type)
    if (group === 'debts') totalDebts += a.balance
    else if (group === 'retirement') slices.retirement += a.balance
    else if (a.type === 'property') slices.property += a.balance
    else slices.cash += a.balance
  }
  const totalAssets = slices.plan + slices.retirement + slices.cash + slices.property
  return {
    planBalance,
    outsideRetirement: slices.retirement,
    totalRetirement: slices.plan + slices.retirement,
    totalAssets,
    totalDebts,
    netWorth: totalAssets - totalDebts,
    slices,
  }
}

/** Whole-dollar amount in the app's locale; negatives read "−$1,200". */
export function formatMoney(value: number, locale: string): string {
  const rounded = Math.round(value)
  const text = `$${Math.abs(rounded).toLocaleString(locale, { maximumFractionDigits: 0 })}`
  return rounded < 0 ? `−${text}` : text
}

/**
 * Reads an amount the participant typed ("1,500", "1500.50", "1.500,50").
 * A separator followed by one or two digits at the end is the decimal mark; any other separator groups thousands.
 */
export function parseAmount(raw: string): number | null {
  const s = raw.replace(/[^\d.,]/g, '')
  if (!/\d/.test(s)) return null
  const lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','))
  const decimals = lastSep >= 0 ? s.length - lastSep - 1 : 0
  const hasDecimal = lastSep >= 0 && decimals >= 1 && decimals <= 2
  const normalized = hasDecimal ? `${s.slice(0, lastSep).replace(/[.,]/g, '')}.${s.slice(lastSep + 1)}` : s.replace(/[.,]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** The name a participant knows an account by: their nickname, else the institution. */
export function accountName(account: LinkedAccount, t: TFunction): string {
  return account.nickname || account.institution || t(`outside_assets.type.${account.type}`)
}
