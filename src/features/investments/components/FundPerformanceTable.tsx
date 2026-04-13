import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { cn } from '../../../lib/cn'

interface FundRow {
  name: string
  ticker: string
  oneM: number
  threeM: number
  oneY: number
  threeY: number
}

const FUNDS: FundRow[] = [
  { name: 'Target Date 2050',      ticker: 'TDF50',  oneM:  1.2, threeM:  3.4, oneY:  12.1, threeY: 9.8  },
  { name: 'US Equity Index',       ticker: 'USEI',   oneM:  2.1, threeM:  5.2, oneY:  18.3, threeY: 12.4 },
  { name: 'International Equity',  ticker: 'INTL',   oneM: -0.4, threeM:  1.8, oneY:   8.6, threeY: 5.1  },
  { name: 'Bond Index',            ticker: 'BOND',   oneM:  0.3, threeM:  0.9, oneY:   3.2, threeY: 2.8  },
  { name: 'Stable Value',          ticker: 'STAB',   oneM:  0.4, threeM:  1.2, oneY:   4.8, threeY: 4.5  },
  { name: 'Small Cap Growth',      ticker: 'SCG',    oneM:  3.2, threeM:  7.1, oneY:  22.5, threeY: 15.2 },
]

function ReturnCell({ value }: { value: number }) {
  return (
    <td className={cn(
      'px-4 py-3 text-right text-sm font-medium',
      value > 0 ? 'text-status-success' : value < 0 ? 'text-status-danger' : 'text-text-muted'
    )}>
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
    </td>
  )
}

export function FundPerformanceTable() {
  return (
    <Card padding="none">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle>Fund Performance</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-page">
              {['Fund', '1M', '3M', '1Y', '3Y'].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider',
                    h === 'Fund' ? 'text-left' : 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {FUNDS.map((f) => (
              <tr key={f.ticker} className="hover:bg-surface-page transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">{f.name}</p>
                  <p className="text-xs text-text-muted">{f.ticker}</p>
                </td>
                <ReturnCell value={f.oneM} />
                <ReturnCell value={f.threeM} />
                <ReturnCell value={f.oneY} />
                <ReturnCell value={f.threeY} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default FundPerformanceTable
