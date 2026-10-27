import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/cn'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PERIODS, allHoldings, byAssetClass, weightedReturn, type Period } from './portfolioData'

const TOTAL = 'total'

/** Return by asset class for a chosen period, with show/hide checkboxes. Sample data. */
export function AssetClassPerformance() {
  const { t } = useTranslation()
  const election = useElectionsStore((s) => s.investment)
  const [period, setPeriod] = useState<Period>('YTD')

  const groups = useMemo(() => byAssetClass(allHoldings(election)), [election])
  const allHoldingsList = useMemo(() => groups.flatMap((g) => g.holdings), [groups])
  const [hidden, setHidden] = useState<string[]>([])

  const series = useMemo(
    () => [
      { key: TOTAL, label: t('portfolio.perf.total'), value: weightedReturn(allHoldingsList, period) },
      ...groups.map((g) => ({ key: g.assetClass, label: g.assetClass, value: weightedReturn(g.holdings, period) })),
    ],
    [groups, allHoldingsList, period, t],
  )
  const shown = series.filter((s) => !hidden.includes(s.key))
  const colors = ['#2563eb', '#16a34a', '#7c3aed', '#d97706', '#0891b2']

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-gray-900 dark:text-white">{t('portfolio.perf.title')}</h3>
        <div role="radiogroup" aria-label={t('portfolio.perf.period')} className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => setPeriod(p)} className={cn('rounded-md px-2.5 py-1 text-xs font-semibold transition-colors', period === p ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        <legend className="sr-only">{t('portfolio.perf.series')}</legend>
        {series.map((s, i) => (
          <label key={s.key} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={!hidden.includes(s.key)} onChange={() => setHidden((h) => (h.includes(s.key) ? h.filter((x) => x !== s.key) : [...h, s.key]))} className="h-4 w-4 rounded accent-blue-600" />
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: colors[i % colors.length] }} aria-hidden />
            {s.label}
          </label>
        ))}
      </fieldset>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{t('portfolio.perf.none')}</p>
      ) : (
        <div className="h-64 w-full" role="img" aria-label={t('portfolio.perf.chart_label', { period })}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shown} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default, #e5e7eb)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-secondary, #6b7280)' }} tickLine={false} axisLine={false} interval={0} />
              <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 12, fill: 'var(--text-secondary, #6b7280)' }} tickLine={false} axisLine={false} width={44} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}%`, t('portfolio.perf.return')]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {shown.map((s) => (
                  <Cell key={s.key} fill={colors[series.findIndex((x) => x.key === s.key) % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {shown.map((s) => (
          <div key={s.key} className="flex justify-between border-b border-gray-100 py-1 dark:border-gray-800">
            <dt className="text-gray-600 dark:text-gray-300">{s.label}</dt>
            <dd className="font-semibold tabular-nums text-gray-900 dark:text-white">{s.value.toFixed(2)}%</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('portfolio.sample_note')}</p>
    </section>
  )
}
