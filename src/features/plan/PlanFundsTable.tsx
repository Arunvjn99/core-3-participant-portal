import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Search } from 'lucide-react'
import { ASSET_CLASSES, PLAN_FUNDS, per1000, type Returns } from './planFunds'
import { downloadCsv } from './downloadCsv'
import { SDB_FUNDS, type SdbFund } from './sdbFunds'

type SortKey = 'y1' | 'ytd' | 'y5' | 'y10' | 'expense'

const pct = (v: number) => `${v.toFixed(2)}%`

/** Plan investment lineup: search, asset-class filter, sortable returns, fees and benchmarks. Sample data. */
export function PlanFundsTable({ showHeading = true, includeSdb = false }: { showHeading?: boolean; includeSdb?: boolean }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [assetClass, setAssetClass] = useState('')
  const [sort, setSort] = useState<SortKey>('y1')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const key = (f: (typeof PLAN_FUNDS)[number]) => (sort === 'expense' ? -f.expenseRatioPct : f.returns[sort as keyof Returns])
    const all = includeSdb ? [...PLAN_FUNDS, ...SDB_FUNDS] : PLAN_FUNDS
    return all.filter((f) => (!assetClass || f.assetClass === assetClass) && (!q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || f.ticker.toLowerCase().includes(q) || f.cusip.includes(q))).sort((a, b) => key(b) - key(a))
  }, [query, assetClass, sort, includeSdb])

  const exportCsv = () =>
    downloadCsv('plan-investments.csv', [
      ['Fund', 'Category', 'Asset class', 'CUSIP', 'YTD %', '1 yr %', '5 yr %', '10 yr %', 'Since inception %', 'Expense ratio %', 'Per $1,000', 'Shareholder-type fees %'],
      ...rows.map((f) => [f.name, f.category, f.assetClass, f.cusip, f.returns.ytd, f.returns.y1, f.returns.y5, f.returns.y10, f.returns.sinceInception, f.expenseRatioPct, per1000(f.expenseRatioPct), f.shareholderFeePct]),
    ])

  const field = 'h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white'

  return (
    <div>
      {showHeading && <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{t('plan.funds.sorted_by')}</p>}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[12rem] flex-1">
          <span className="sr-only">{t('plan.funds.search')}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('plan.funds.search')} className={`${field} w-full pl-9`} />
        </label>
        <label>
          <span className="sr-only">{t('plan.funds.asset_class')}</span>
          <select value={assetClass} onChange={(e) => setAssetClass(e.target.value)} className={field}>
            <option value="">{t('plan.funds.all_classes')}</option>
            {ASSET_CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t('plan.funds.sort')}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={field}>
            {(['y1', 'ytd', 'y5', 'y10', 'expense'] as const).map((k) => (
              <option key={k} value={k}>{t(`plan.funds.sort_${k}`)}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          <Download className="h-4 w-4" aria-hidden /> {t('plan.funds.export')}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{t('plan.funds.none')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th scope="col" rowSpan={2} className="px-3 py-2 font-semibold">{t('plan.funds.col_fund')}</th>
                <th scope="col" rowSpan={2} className="px-2 py-2 text-right font-semibold">{t('plan.funds.col_ytd')}</th>
                <th scope="colgroup" colSpan={4} className="px-2 pt-2 text-center font-semibold">{t('plan.funds.col_avg')}</th>
                <th scope="colgroup" colSpan={2} className="px-2 pt-2 text-center font-semibold">{t('plan.funds.col_expense')}</th>
                <th scope="col" rowSpan={2} className="px-3 py-2 text-right font-semibold">{t('plan.funds.col_fees')}</th>
              </tr>
              <tr>
                {(['y1', 'y5', 'y10', 'inception'] as const).map((k) => (
                  <th key={k} scope="col" className="px-2 pb-2 text-right font-semibold">{t(`plan.funds.col_${k}`)}</th>
                ))}
                <th scope="col" className="px-2 pb-2 text-right font-semibold">{t('plan.funds.col_pct')}</th>
                <th scope="col" className="px-2 pb-2 text-right font-semibold">{t('plan.funds.col_per1000')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((f) => (
                <FundRows key={f.ticker} f={f} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('plan.funds.sample_note')}</p>
    </div>
  )
}

function FundRows({ f }: { f: (typeof PLAN_FUNDS)[number] }) {
  const { t } = useTranslation()
  const cells = (r: Returns) => [r.ytd, r.y1, r.y5, r.y10, r.sinceInception]
  return (
    <>
      <tr>
        <th scope="row" className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
          {f.name}
          {'sdb' in f ? (
            <SdbMeta f={f as SdbFund} />
          ) : (
            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">{f.category} · {f.ticker}</span>
          )}
        </th>
        {cells(f.returns).map((v, i) => (
          <td key={i} className="px-2 py-2.5 text-right tabular-nums text-gray-900 dark:text-white">{pct(v)}</td>
        ))}
        <td className="px-2 py-2.5 text-right tabular-nums">{pct(f.expenseRatioPct)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums">${per1000(f.expenseRatioPct)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{pct(f.shareholderFeePct)}</td>
      </tr>
      <tr className="bg-gray-50/60 text-xs text-gray-500 dark:bg-gray-800/30 dark:text-gray-400">
        <th scope="row" className="px-3 py-1.5 font-normal">{t('plan.funds.benchmark', { name: f.benchmark.name })}</th>
        {cells(f.benchmark.returns).map((v, i) => (
          <td key={i} className="px-2 py-1.5 text-right tabular-nums">{pct(v)}</td>
        ))}
        <td className="px-2 py-1.5 text-right">—</td>
        <td className="px-2 py-1.5 text-right">—</td>
        <td className="px-3 py-1.5 text-right">{t('plan.funds.na')}</td>
      </tr>
    </>
  )
}

/** Category, CUSIP and brokerage account status for an SDB fund. */
export function SdbMeta({ f }: { f: SdbFund }) {
  const { t } = useTranslation()
  return (
    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
      {f.category} · <span className="font-semibold text-amber-700 dark:text-amber-400">{t('plan.sdb_funds.tag')}</span> · CUSIP {f.cusip}
      <span className="block">
        {f.account.status === 'active'
          ? t('plan.sdb_funds.account', { numbers: f.account.numbers.join(', ') })
          : t('plan.sdb_funds.not_activated')}
      </span>
    </span>
  )
}
