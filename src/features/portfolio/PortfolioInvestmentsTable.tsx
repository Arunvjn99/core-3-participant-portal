import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Download, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { downloadCsv } from '@/features/plan/downloadCsv'
import { PLAN_DEFAULT_ALLOCATION } from '@/features/plan/electionsData'
import { PLANS, allHoldings, holdingsFor, investedBalance, type Holding } from './portfolioData'

type SortKey = 'name' | 'assetClass' | 'ytd' | 'invested' | 'current' | 'gain' | 'units'

const gain = (h: Holding) => h.value - investedBalance(h)

/** The participant's holdings with search, sorting, plan filter and CSV export. Sample data. */
export function PortfolioInvestmentsTable() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const election = useElectionsStore((s) => s.investment)
  const [planId, setPlanId] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'current', dir: 'desc' })

  const holdings = useMemo(() => {
    const k = allHoldings(election)
    if (planId === '401k') return k
    const ps = holdingsFor(PLANS[1].balance, PLAN_DEFAULT_ALLOCATION)
    if (planId === 'profit-sharing') return ps
    const map = new Map<string, Holding>()
    for (const h of [...k, ...ps]) {
      const cur = map.get(h.ticker)
      if (cur) map.set(h.ticker, { ...cur, value: cur.value + h.value, units: Math.round((cur.units + h.units) * 1000) / 1000 })
      else map.set(h.ticker, h)
    }
    return [...map.values()]
  }, [election, planId])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const val = (h: Holding): number | string => {
      switch (sort.key) {
        case 'name': return h.fund.name
        case 'assetClass': return h.fund.assetClass
        case 'ytd': return h.fund.returns.ytd
        case 'invested': return investedBalance(h)
        case 'current': return h.value
        case 'gain': return gain(h)
        case 'units': return h.units
      }
    }
    return holdings
      .filter((h) => !q || h.fund.name.toLowerCase().includes(q) || h.fund.cusip.includes(q) || h.ticker.toLowerCase().includes(q))
      .sort((a, b) => {
        const x = val(a)
        const y = val(b)
        const c = typeof x === 'string' ? x.localeCompare(String(y)) : (x as number) - (y as number)
        return sort.dir === 'asc' ? c : -c
      })
  }, [holdings, query, sort])

  const money = (v: number) => `$${v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const signed = (v: number) => `${v >= 0 ? '+' : '-'}${money(Math.abs(v))}`
  const totals = rows.reduce((a, h) => ({ invested: a.invested + investedBalance(h), current: a.current + h.value }), { invested: 0, current: 0 })

  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'assetClass' ? 'asc' : 'desc' }))
  const th = (key: SortKey, align: 'left' | 'right' = 'right') => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cn('px-3 py-2 font-semibold', align === 'right' ? 'text-right' : 'text-left')}>
      <button type="button" onClick={() => toggle(key)} className="inline-flex items-center gap-1 uppercase">
        {t(`portfolio.inv.col_${key}`)}
        {sort.key === key && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />)}
      </button>
    </th>
  )

  const exportCsv = () =>
    downloadCsv('portfolio-investments.csv', [
      ['Investment name', 'Asset class', 'CUSIP', 'Fund return YTD %', 'Invested balance', 'Current balance', 'Gain/loss', 'Unit balance'],
      ...rows.map((h) => [h.fund.name, h.fund.assetClass, h.fund.cusip, h.fund.returns.ytd, investedBalance(h), h.value, gain(h).toFixed(2), h.units]),
    ])

  const field = 'h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white'

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-gray-900 dark:text-white">{t('portfolio.inv.title')}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <label>
            <span className="sr-only">{t('portfolio.select_plan')}</span>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={field}>
              <option value="all">{t('portfolio.all_plans')}</option>
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="relative">
            <span className="sr-only">{t('portfolio.inv.search')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('portfolio.inv.search')} className={`${field} w-56 pl-9`} />
          </label>
          <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            <Download className="h-4 w-4" aria-hidden /> {t('plan.funds.export')}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{t('plan.funds.none')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                {th('name', 'left')}
                {th('assetClass', 'left')}
                <th scope="col" className="px-3 py-2 text-left font-semibold">{t('portfolio.inv.col_cusip')}</th>
                {th('ytd')}
                {th('invested')}
                {th('current')}
                {th('gain')}
                {th('units')}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((h) => {
                const g = gain(h)
                return (
                  <tr key={h.ticker}>
                    <th scope="row" className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{h.fund.name}</th>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{h.fund.assetClass}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-600 dark:text-gray-300">{h.fund.cusip}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{h.fund.returns.ytd.toFixed(2)}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{money(investedBalance(h))}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{money(h.value)}</td>
                    <td className={cn('px-3 py-2.5 text-right tabular-nums', g >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600')}>{signed(g)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{h.units.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-800/60">
                <td className="px-3 py-2.5" colSpan={4}>{t('portfolio.summary.total')}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(totals.invested)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(totals.current)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{signed(totals.current - totals.invested)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('portfolio.sample_note')}</p>
    </section>
  )
}
