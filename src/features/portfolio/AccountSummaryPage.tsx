import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { Badge } from '@/design-system/components/Badge'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PLAN_DEFAULT_ALLOCATION } from '@/features/plan/electionsData'
import {
  PLANS, SOURCE_MIX, allocationForSource, allHoldings, byAssetClass, holdingsFor, sourceBalances,
  type Holding, type SourceId,
} from './portfolioData'

type Tab = 'sources' | 'investments'
type SortKey = 'name' | 'balance'

interface Row {
  id: string
  label: string
  balance: number
  holdings: Holding[]
}

export default function AccountSummaryPage() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const now = useNow()
  const election = useElectionsStore((s) => s.investment)

  const [planId, setPlanId] = useState(PLANS[0].id)
  const [tab, setTab] = useState<Tab>('sources')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'balance', dir: 'desc' })
  const [open, setOpen] = useState<string | null>(null)

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]
  const money = (v: number) => `$${v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const asOf = new Date(now).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })

  const rows: Row[] = useMemo(() => {
    if (plan.id !== '401k') {
      const hs = holdingsFor(plan.balance, PLAN_DEFAULT_ALLOCATION)
      return tab === 'sources'
        ? [{ id: 'profitSharing', label: t('portfolio.src.profitSharing'), balance: plan.balance, holdings: hs }]
        : byAssetClass(hs).map((g) => ({ id: g.assetClass, label: g.assetClass, balance: g.value, holdings: g.holdings }))
    }
    if (tab === 'sources') {
      const balances = sourceBalances(plan.balance)
      return SOURCE_MIX.map((s) => {
        const balance = balances[s.id]
        return { id: s.id, label: t(`portfolio.src.${s.id}`), balance, holdings: holdingsFor(balance, allocationForSource(election, s.id as SourceId)) }
      })
    }
    return byAssetClass(allHoldings(election)).map((g) => ({ id: g.assetClass, label: g.assetClass, balance: g.value, holdings: g.holdings }))
  }, [plan, tab, election, t])

  const sorted = [...rows].sort((a, b) => {
    const cmp = sort.key === 'name' ? a.label.localeCompare(b.label) : a.balance - b.balance
    return sort.dir === 'asc' ? cmp : -cmp
  })
  const total = rows.reduce((s, r) => s + r.balance, 0)
  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))
  const sortIcon = (key: SortKey) => (sort.key === key ? sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden /> : null)
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none')

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <nav className="mb-3 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/post-enrollment-dashboard" className="hover:underline">{t('portfolio.dashboard')}</Link> <span aria-hidden>›</span> <span className="text-gray-900 dark:text-white">{t('portfolio.summary.title')}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('portfolio.summary.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('portfolio.summary.subtitle')}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('portfolio.summary.plans')}>
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === plan.id}
              onClick={() => { setPlanId(p.id); setOpen(null) }}
              className={cn('rounded-2xl border-2 p-4 text-left transition-colors', p.id === plan.id ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900')}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</span>
                <Badge variant="success">{t('portfolio.participating')}</Badge>
              </span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{t('portfolio.plan_id', { id: p.planId })} · {t('portfolio.type', { type: p.type })}</span>
              <span className="mt-3 grid grid-cols-2 gap-3">
                <span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{t('portfolio.account_balance')}</span>
                  <span className="block text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{money(p.balance)}</span>
                </span>
                <span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{t('portfolio.vested_balance')}</span>
                  <span className="block text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{money(p.vested)}</span>
                </span>
              </span>
            </button>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div role="tablist" aria-label={t('portfolio.summary.view_by')} className="inline-flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                {(['sources', 'investments'] as const).map((id) => (
                  <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setOpen(null) }} className={cn('rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all', tab === id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400')}>
                    {t(`portfolio.summary.tab_${id}`)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t('portfolio.summary.view_by')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('portfolio.account_balance')}</p>
              <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{money(total)} <span className="text-sm font-medium text-gray-500">100.00%</span></p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <th scope="col" aria-sort={ariaSort('name')} className="px-3 py-2 font-semibold">
                    <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 uppercase">{t(`portfolio.summary.col_${tab}`)} {sortIcon('name')}</button>
                  </th>
                  <th scope="col" aria-sort={ariaSort('balance')} className="px-3 py-2 text-right font-semibold">
                    <button type="button" onClick={() => toggleSort('balance')} className="inline-flex items-center gap-1 uppercase">{t('portfolio.summary.col_balance')} {sortIcon('balance')}</button>
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">{t('portfolio.summary.col_percent')}</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">{t('portfolio.summary.col_details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sorted.map((r) => {
                  const isOpen = open === r.id
                  return (
                    <Fragment key={r.id}>
                      <tr>
                        <th scope="row" className="px-3 py-3 font-medium text-gray-900 dark:text-white">{r.label}</th>
                        <td className="px-3 py-3 text-right tabular-nums">{money(r.balance)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{total ? ((r.balance / total) * 100).toFixed(2) : '0.00'}%</td>
                        <td className="px-3 py-3 text-right">
                          <button type="button" aria-expanded={isOpen} aria-label={t('portfolio.summary.show_holdings', { name: r.label })} onClick={() => setOpen(isOpen ? null : r.id)} className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} aria-hidden />
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={4} className="bg-gray-50/70 px-3 py-3 dark:bg-gray-800/30">
                            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('portfolio.summary.nav_as_of', { date: asOf })}</p>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                              {r.holdings.map((h) => (
                                <li key={h.ticker} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
                                  <span className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-white">{h.fund.name}</span>
                                  <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">{t('portfolio.summary.nav', { nav: h.nav.toFixed(2) })}</span>
                                  <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">{t('portfolio.summary.units', { units: h.units.toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) })}</span>
                                  <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{money(h.value)}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-800/60">
                  <td className="px-3 py-2.5">{t('portfolio.summary.total')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{money(total)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">100.00%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('portfolio.sample_note')}</p>
        </section>
      </div>
    </AnimatedPage>
  )
}
