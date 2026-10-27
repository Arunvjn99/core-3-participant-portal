import { fundCatalog } from '@/features/enrollment/investmentCatalog'
import { SDB_FUNDS } from './sdbFunds'

/**
 * Plan investment lineup with performance and fee columns.
 * SAMPLE DATA for demonstration: returns, benchmarks and fees are illustrative, not real fund data.
 * Fund names, tickers, asset classes and expense ratios come from the shared fund catalogue.
 */
export interface Returns {
  ytd: number
  y1: number
  y5: number
  y10: number
  sinceInception: number
}

export interface PlanFund {
  ticker: string
  name: string
  /** Display category, e.g. "Large Cap Blend" */
  category: string
  /** Asset class bucket used by filters and performance charts */
  assetClass: 'U.S. Equity' | 'International Equity' | 'Taxable Bond' | 'Real Estate'
  cusip: string
  expenseRatioPct: number
  shareholderFeePct: number
  returns: Returns
  benchmark: { name: string; returns: Returns }
}

const SP500 = { name: 'S&P 500 Index', returns: { ytd: 9.1, y1: 15.1, y5: 14.18, y10: 12.4, sinceInception: 11.2 } }
const AGG = { name: 'Bloomberg U.S. Aggregate Bond', returns: { ytd: 3.4, y1: 5.32, y5: 1.04, y10: 2.28, sinceInception: 4.2 } }
const INTL = { name: 'MSCI ACWI ex-USA', returns: { ytd: 6.2, y1: 11.4, y5: 6.1, y10: 5.0, sinceInception: 5.6 } }
const REIT = { name: 'MSCI US REIT', returns: { ytd: 4.1, y1: 7.5, y5: 5.2, y10: 6.0, sinceInception: 7.1 } }
const MID = { name: 'S&P MidCap 400', returns: { ytd: 7.9, y1: 13.2, y5: 10.4, y10: 9.6, sinceInception: 10.1 } }
const GROWTH = { name: 'Russell 1000 Growth', returns: { ytd: 11.5, y1: 19.0, y5: 16.1, y10: 14.1, sinceInception: 12.2 } }
const SMALL = { name: 'Russell 2000 Growth', returns: { ytd: 8.4, y1: 12.3, y5: 8.2, y10: 8.5, sinceInception: 9.0 } }
const EM = { name: 'MSCI Emerging Markets', returns: { ytd: 7.0, y1: 10.1, y5: 3.9, y10: 3.7, sinceInception: 4.4 } }

const META: Record<string, Omit<PlanFund, 'ticker' | 'name' | 'expenseRatioPct' | 'assetClass'> & { assetClass: PlanFund['assetClass'] }> = {
  VTSAX: { category: 'Large Cap Blend', assetClass: 'U.S. Equity', cusip: '922908728', shareholderFeePct: 0, returns: { ytd: 8.62, y1: 14.82, y5: 13.91, y10: 11.87, sinceInception: 10.74 }, benchmark: SP500 },
  VIMAX: { category: 'Mid Cap Blend', assetClass: 'U.S. Equity', cusip: '922908645', shareholderFeePct: 0, returns: { ytd: 7.7, y1: 12.9, y5: 10.1, y10: 9.3, sinceInception: 9.9 }, benchmark: MID },
  VIGAX: { category: 'Large Cap Growth', assetClass: 'U.S. Equity', cusip: '921910501', shareholderFeePct: 0, returns: { ytd: 11.2, y1: 18.6, y5: 15.8, y10: 13.8, sinceInception: 12.0 }, benchmark: GROWTH },
  VSGAX: { category: 'Small Cap Growth', assetClass: 'U.S. Equity', cusip: '922908488', shareholderFeePct: 0, returns: { ytd: 8.1, y1: 11.9, y5: 8.0, y10: 8.3, sinceInception: 8.8 }, benchmark: SMALL },
  VBTLX: { category: 'Intermediate Bond', assetClass: 'Taxable Bond', cusip: '921937835', shareholderFeePct: 0, returns: { ytd: 3.12, y1: 5.18, y5: 0.86, y10: 2.14, sinceInception: 4.02 }, benchmark: AGG },
  PONAX: { category: 'Multisector Bond', assetClass: 'Taxable Bond', cusip: '722005667', shareholderFeePct: 0, returns: { ytd: 4.3, y1: 6.4, y5: 2.1, y10: 3.2, sinceInception: 5.3 }, benchmark: AGG },
  VWIGX: { category: 'Foreign Large Growth', assetClass: 'International Equity', cusip: '921910204', shareholderFeePct: 0, returns: { ytd: 5.9, y1: 10.7, y5: 5.8, y10: 5.1, sinceInception: 6.0 }, benchmark: INTL },
  VEMAX: { category: 'Emerging Markets', assetClass: 'International Equity', cusip: '922042858', shareholderFeePct: 0, returns: { ytd: 6.6, y1: 9.8, y5: 3.7, y10: 3.5, sinceInception: 4.2 }, benchmark: EM },
  VGSLX: { category: 'Real Estate', assetClass: 'Real Estate', cusip: '922908553', shareholderFeePct: 0, returns: { ytd: 3.9, y1: 7.2, y5: 5.0, y10: 5.8, sinceInception: 6.9 }, benchmark: REIT },
}

export const PLAN_FUNDS: PlanFund[] = fundCatalog.flatMap((f) => {
  const m = META[f.ticker]
  return m ? [{ ticker: f.ticker, name: f.name, expenseRatioPct: parseFloat(f.expense), ...m }] : []
})

export const ASSET_CLASSES = Array.from(new Set(PLAN_FUNDS.map((f) => f.assetClass)))

/** Core plan funds and, for tickers prefixed `SDB:`, Self-Directed Brokerage funds. */
export const fundByTicker = (ticker: string): PlanFund | undefined => PLAN_FUNDS.find((f) => f.ticker === ticker) ?? SDB_FUNDS.find((f) => f.ticker === ticker)

/** Cost per $1,000 invested for an expense ratio. */
export const per1000 = (pct: number) => (pct * 10).toFixed(2)
