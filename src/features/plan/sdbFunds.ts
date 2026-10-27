import type { SourceFundAllocation } from '@/features/enrollment/investmentCatalog'
import type { PlanFund } from './planFunds'

/**
 * Investments available through the Self-Directed Brokerage (SDB) window, shown once a participant opts in.
 * SAMPLE DATA for demonstration, matching the Core 2.0 prototype's SDB lineup: returns, fees, CUSIPs and
 * account numbers are illustrative. Real SDB investments come from the brokerage provider.
 */
export type SdbAccount = { status: 'active'; numbers: string[] } | { status: 'not_activated' }

export interface SdbFund extends PlanFund {
  sdb: true
  account: SdbAccount
}

const MID_400 = { name: 'S&P MidCap 400 Index', returns: { ytd: 6.9, y1: 11.62, y5: 10.01, y10: 9.05, sinceInception: 9.2 } }

/** Tickers are prefixed with `SDB:` so they never collide with core plan funds. */
export const SDB_FUNDS: SdbFund[] = [
  {
    sdb: true, ticker: 'SDB:FSMDX', name: 'Fidelity Mid Cap Index Fund (FSMDX)', category: 'Mid Cap', assetClass: 'U.S. Equity', cusip: '316146489',
    expenseRatioPct: 0.03, shareholderFeePct: 0, account: { status: 'not_activated' },
    returns: { ytd: 6.92, y1: 11.88, y5: 10.12, y10: 9.4, sinceInception: 9.55 },
    benchmark: { name: 'Russell Midcap Index', returns: { ytd: 7.0, y1: 12.0, y5: 10.2, y10: 9.5, sinceInception: 9.6 } },
  },
  {
    sdb: true, ticker: 'SDB:NTIAX', name: 'Columbia Mid Cap Index Fund (NTIAX)', category: 'Mid Cap', assetClass: 'U.S. Equity', cusip: '19765P489',
    expenseRatioPct: 0.2, shareholderFeePct: 0, account: { status: 'active', numbers: ['ENROLL3456'] },
    returns: { ytd: 6.71, y1: 11.4, y5: 9.86, y10: 8.92, sinceInception: 9.1 }, benchmark: MID_400,
  },
  {
    sdb: true, ticker: 'SDB:PESPX', name: 'BNY Mellon Mid Cap Index Shares (PESPX)', category: 'Mid Cap', assetClass: 'U.S. Equity', cusip: '05589H107',
    expenseRatioPct: 0.29, shareholderFeePct: 0, account: { status: 'not_activated' },
    returns: { ytd: 6.55, y1: 11.21, y5: 9.74, y10: 8.88, sinceInception: 9.02 }, benchmark: MID_400,
  },
  {
    sdb: true, ticker: 'SDB:FMIF', name: 'Franklin Managed Income Fund', category: 'Large Cap', assetClass: 'U.S. Equity', cusip: '354026106',
    expenseRatioPct: 0.62, shareholderFeePct: 0, account: { status: 'active', numbers: ['ENROLL04456', 'ENROLL34354'] },
    returns: { ytd: 5.84, y1: 9.12, y5: 6.48, y10: 5.91, sinceInception: 6.2 },
    benchmark: { name: 'Morningstar Moderate Allocation', returns: { ytd: 5.2, y1: 8.75, y5: 6.1, y10: 5.7, sinceInception: 6.0 } },
  },
]

export const isSdbTicker = (ticker: string) => ticker.startsWith('SDB:')
export const sdbFundByTicker = (ticker: string) => SDB_FUNDS.find((f) => f.ticker === ticker)

/** SDB funds in the shape the enrolment allocation table uses. */
export const sdbCatalog: SourceFundAllocation[] = SDB_FUNDS.map((f) => ({
  name: f.name,
  ticker: f.ticker,
  expense: `${f.expenseRatioPct.toFixed(2)}%`,
  assetClass: 'SDB',
  color: 'var(--chart-amber)',
  allocation: 0,
}))
