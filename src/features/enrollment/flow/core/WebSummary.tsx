import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AppIcon, ICON_COLOR, IconTile } from '@/design-system/icons'
import { ProjectionChart } from './ui'

/** How often the amounts are shown; every figure on the page follows this */
type Period = 'paycheck' | 'month' | 'year'

export interface WebSummarySource {
  key: string
  label: string
  /** Percent of pay */
  pct: number
  /** Tailwind background class for its bar segment */
  bar: string
}
export interface WebSummaryFund {
  ticker: string
  name: string
  assetClass: string
  pct: number
  color: string
}

export interface WebSummaryProps {
  money: (v: number) => string
  compact: (v: number) => string
  salary: number
  /** Paychecks a year */
  periods: number
  /** Total contribution, percent of pay */
  total: number
  sources: WebSummarySource[]
  /** Employer match for a year, and the most it can be */
  match: number
  fullMatch: number
  /** Matched part of the contribution and the plan's match cap, percent of pay */
  deferral: number
  cap: number
  matchIntro: string
  auto: { enabled: boolean; raiseBy: number; stopAt: number; nextDate: string; schedule: { year: number; rate: number }[] }
  funds: WebSummaryFund[]
  byAssetClass: [string, number][]
  investLabel: string
  growthPct: number
  series: number[]
  age: number
  retireAge: number
  projected: number
  yMax: number
}

const CARD = 'rounded-[20px] bg-surface-card p-5 ring-1 ring-slate-200/70 sm:p-6 dark:ring-white/10'
const CARD_TITLE = 'text-[16px] font-bold text-text-primary'
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

/**
 * The full summary as an interactive page: the same plan as the printable form, broken down so it can be explored.
 * Every amount follows one switch (per paycheck, month or year); bars, years and funds open up on hover, focus or tap.
 */
export function WebSummary(p: WebSummaryProps) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<Period>('paycheck')
  const [activeFlow, setActiveFlow] = useState<string | null>(null)
  const [year, setYear] = useState(0)
  const [openFund, setOpenFund] = useState<string | null>(null)

  const per = period === 'paycheck' ? p.periods : period === 'month' ? 12 : 1
  const ofYear = (v: number) => v / per
  const periodWord = t(`enrollment.core.web.per_${period}`)
  const yearlyYou = (p.salary * p.total) / 100
  const yearlyIn = yearlyYou + p.match

  // Where the money comes from: each source, then the employer, in one bar
  const flow = [
    ...p.sources.filter((s) => s.pct > 0).map((s) => ({ key: s.key, label: s.label, amount: (p.salary * s.pct) / 100, note: t('enrollment.core.web.pct_of_pay', { pct: s.pct }), bar: s.bar })),
    ...(p.match > 0 ? [{ key: 'match', label: t('enrollment.core.web.employer'), amount: p.match, note: t('enrollment.core.web.free_money'), bar: 'bg-emerald-500' }] : []),
  ]
  const matchedRate = Math.min(p.deferral, p.cap)
  const schedule = p.auto.schedule
  const picked = schedule[Math.min(year, schedule.length - 1)]

  return (
    <div className="mx-auto w-full max-w-[920px] space-y-4">
      {/* One switch for every amount on the page */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-secondary">{t('enrollment.core.web.intro')}</p>
        <div role="group" aria-label={t('enrollment.core.web.period_label')} className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-white/[0.08]">
          {(['paycheck', 'month', 'year'] as Period[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={period === k}
              onClick={() => setPeriod(k)}
              className={cn('h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors', FOCUS, period === k ? 'bg-white text-[#2563EB] shadow-sm dark:bg-slate-900 dark:text-blue-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white')}
            >
              {t(`enrollment.core.web.tab_${k}`)}
            </button>
          ))}
        </div>
      </div>

      {/* The four numbers that matter, side by side */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t('enrollment.core.web.kpi_you'), value: p.money(ofYear(yearlyYou)), sub: periodWord },
          { label: t('enrollment.core.web.kpi_employer'), value: `+${p.money(ofYear(p.match))}`, sub: periodWord, tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: t('enrollment.core.web.kpi_total'), value: p.money(ofYear(yearlyIn)), sub: periodWord },
          { label: t('enrollment.core.m_proj', { age: p.retireAge }), value: p.compact(p.projected), sub: t('enrollment.core.not_guaranteed') },
        ].map((k) => (
          <div key={k.label} className={cn(CARD, 'p-4 sm:p-4')}>
            <dt className="text-[12px] font-medium text-text-secondary">{k.label}</dt>
            <dd className={cn('mt-1 text-[22px] font-bold tabular-nums tracking-tight text-text-primary', k.tone)}>{k.value}</dd>
            <dd className="text-[12px] text-text-secondary">{k.sub}</dd>
          </div>
        ))}
      </dl>

      {/* Where the money comes from: one bar, explored by hovering a part or a row */}
      <section className={CARD} aria-labelledby="web-flow">
        <div className="flex items-center gap-3">
          <IconTile name="contributions" />
          <div>
            <h3 id="web-flow" className={CARD_TITLE}>{t('enrollment.core.web.flow_title')}</h3>
            <p className="text-[13px] text-text-secondary">{t('enrollment.core.web.flow_sub', { amount: p.money(ofYear(yearlyIn)), period: periodWord })}</p>
          </div>
        </div>
        <div className="mt-4 flex h-4 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden>
          {flow.map((s) => (
            <span
              key={s.key}
              onMouseEnter={() => setActiveFlow(s.key)}
              onMouseLeave={() => setActiveFlow(null)}
              className={cn('h-full transition-opacity first:rounded-l-full last:rounded-r-full', s.bar, activeFlow && activeFlow !== s.key && 'opacity-30')}
              style={{ width: `${(s.amount / yearlyIn) * 100}%`, minWidth: 6 }}
            />
          ))}
        </div>
        <ul className="mt-4 divide-y divide-slate-200/80 dark:divide-white/10">
          {flow.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                onMouseEnter={() => setActiveFlow(s.key)}
                onMouseLeave={() => setActiveFlow(null)}
                onFocus={() => setActiveFlow(s.key)}
                onBlur={() => setActiveFlow(null)}
                className={cn('flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors', FOCUS, activeFlow === s.key && 'bg-slate-50 dark:bg-white/[0.05]')}
              >
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', s.bar)} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-text-primary">{s.label}</span>
                  <span className="block text-[12px] text-text-secondary">{s.note}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[15px] font-bold tabular-nums text-text-primary">{p.money(ofYear(s.amount))}</span>
                  <span className="block text-[12px] tabular-nums text-text-secondary">{t('enrollment.core.web.share', { pct: Math.round((s.amount / yearlyIn) * 100) })}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Employer match: how much of the match this rate earns */}
        <section className={CARD} aria-labelledby="web-match">
          <div className="flex items-center gap-3">
            <IconTile icon={PiggyBank} />
            <div>
              <h3 id="web-match" className={CARD_TITLE}>{t('enrollment.core.web.match_title')}</h3>
              <p className="text-[13px] text-text-secondary">{p.matchIntro}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="font-semibold text-text-primary">{t('enrollment.core.web.match_meter', { rate: matchedRate, cap: p.cap })}</span>
              <span className={cn('font-semibold', p.match >= p.fullMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300')}>
                {p.match >= p.fullMatch ? t('enrollment.core.m_match_full') : t('enrollment.core.m_match_gap', { amount: `${p.money((p.fullMatch - p.match) / 12)}${t('enrollment.core.unit_month')}` })}
              </span>
            </div>
            <div
              className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={p.cap}
              aria-valuenow={matchedRate}
              aria-label={t('enrollment.core.web.match_meter', { rate: matchedRate, cap: p.cap })}
            >
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (matchedRate / p.cap) * 100)}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt className="text-text-secondary">{t('enrollment.core.web.match_you_get', { period: periodWord })}</dt>
                <dd className="text-[18px] font-bold tabular-nums text-text-primary">{`+${p.money(ofYear(p.match))}`}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">{t('enrollment.core.web.match_max', { period: periodWord })}</dt>
                <dd className="text-[18px] font-bold tabular-nums text-text-primary">{`+${p.money(ofYear(p.fullMatch))}`}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Auto-increase: pick a year to see the rate and the amount then */}
        <section className={CARD} aria-labelledby="web-auto">
          <div className="flex items-center gap-3">
            <IconTile name="goals" />
            <div>
              <h3 id="web-auto" className={CARD_TITLE}>{t('enrollment.core.row_auto')}</h3>
              <p className="text-[13px] text-text-secondary">
                {p.auto.enabled
                  ? t('enrollment.core.web.auto_sub', { by: p.auto.raiseBy, cap: p.auto.stopAt, date: p.auto.nextDate })
                  : t('enrollment.core.web.auto_off')}
              </p>
            </div>
          </div>
          {p.auto.enabled && schedule.length > 0 && picked ? (
            <>
              <div className="mt-5 flex h-28 items-end gap-1.5" role="group" aria-label={t('enrollment.core.web.auto_pick')}>
                {schedule.map((row, i) => (
                  <button
                    key={row.year}
                    type="button"
                    aria-pressed={i === year}
                    aria-label={t('enrollment.core.web.auto_year', { year: row.year, rate: row.rate })}
                    onClick={() => setYear(i)}
                    onMouseEnter={() => setYear(i)}
                    onFocus={() => setYear(i)}
                    className={cn('group/bar flex h-full min-w-0 max-w-[48px] flex-1 flex-col justify-end rounded-t-md', FOCUS)}
                  >
                    <span
                      className={cn('w-full rounded-t-[4px] transition-colors', i === year ? 'bg-[#2563EB] dark:bg-blue-400' : 'bg-blue-200 group-hover/bar:bg-blue-300 dark:bg-blue-500/30')}
                      style={{ height: `${Math.max(8, (row.rate / p.auto.stopAt) * 100)}%` }}
                    />
                  </button>
                ))}
              </div>
              {/* Each year under its own bar */}
              <div className="mt-1.5 flex gap-1.5 text-[10px] tabular-nums text-text-secondary" aria-hidden>
                {schedule.map((row, i) => (
                  <span key={row.year} className={cn('min-w-0 max-w-[48px] flex-1 text-center', i === year && 'font-semibold text-text-primary')}>
                    {`'${String(row.year).slice(2)}`}
                  </span>
                ))}
              </div>
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-text-primary dark:bg-white/[0.05]" aria-live="polite">
                {t('enrollment.core.web.auto_detail', { year: picked.year, rate: picked.rate, amount: p.money((p.salary * picked.rate) / 100 / p.periods) })}
              </p>
            </>
          ) : null}
        </section>
      </div>

      {/* Investments: each fund opens to show what goes into it */}
      <section className={CARD} aria-labelledby="web-funds">
        <div className="flex items-center gap-3">
          <IconTile name="investments" />
          <div>
            <h3 id="web-funds" className={CARD_TITLE}>{t('enrollment.core.sheet_invest')}</h3>
            <p className="text-[13px] text-text-secondary">{t('enrollment.core.web.funds_sub', { invest: p.investLabel, growth: p.growthPct })}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-1">
          {p.funds.map((fund) => {
            const open = openFund === fund.ticker
            return (
              <li key={fund.ticker}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFund(open ? null : fund.ticker)}
                  className={cn('w-full rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]', FOCUS)}
                >
                  <span className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: fund.color }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text-primary">{fund.name}</span>
                    <span className="text-[14px] font-bold tabular-nums text-text-primary">{`${fund.pct}%`}</span>
                    <AppIcon icon={ChevronDown} size="inline" className={cn(ICON_COLOR.muted, 'transition-transform', open && 'rotate-180')} />
                  </span>
                  <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${fund.pct}%`, backgroundColor: fund.color }} />
                  </span>
                </button>
                {open && (
                  <dl className="mx-2 mb-2 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] sm:grid-cols-3 dark:bg-white/[0.05]">
                    <div>
                      <dt className="text-text-secondary">{t('enrollment.core.web.fund_ticker')}</dt>
                      <dd className="font-semibold text-text-primary">{fund.ticker}</dd>
                    </div>
                    <div>
                      <dt className="text-text-secondary">{t('enrollment.core.web.fund_type')}</dt>
                      <dd className="font-semibold text-text-primary">{fund.assetClass}</dd>
                    </div>
                    <div>
                      <dt className="text-text-secondary">{t('enrollment.core.web.fund_in', { period: periodWord })}</dt>
                      <dd className="font-semibold tabular-nums text-text-primary">{p.money(ofYear((yearlyIn * fund.pct) / 100))}</dd>
                    </div>
                  </dl>
                )}
              </li>
            )
          })}
        </ul>
        <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-white/10">
          <p className="text-[13px] font-semibold text-text-primary">{t('enrollment.core.sum_by_type')}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {p.byAssetClass.map(([cls, pct]) => (
              <li key={cls} className="rounded-full bg-slate-100 px-3 py-1 text-[12px] text-text-primary dark:bg-white/[0.08]">
                <span className="font-semibold tabular-nums">{`${pct}%`}</span> {cls}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Projection: the same path as on the card, larger, with every year to explore */}
      <section className={CARD} aria-labelledby="web-proj">
        <div className="flex items-center gap-3">
          <IconTile name="projections" />
          <div>
            <h3 id="web-proj" className={CARD_TITLE}>{t('enrollment.core.m_proj', { age: p.retireAge })}</h3>
            <p className="text-[13px] text-text-secondary">{`${t('enrollment.core.not_guaranteed')} · ${t('enrollment.core.proj_basis', { rate: p.growthPct })}`}</p>
          </div>
          <p className="ml-auto text-[22px] font-bold tabular-nums text-text-primary">{p.compact(p.projected)}</p>
        </div>
        <div className="mt-4">
          <ProjectionChart
            points={p.series}
            startAge={p.age}
            height={140}
            yMax={p.yMax}
            format={p.compact}
            label={t('enrollment.core.chart_label')}
            pointLabel={(a, value) => t('enrollment.core.chart_point', { age: a, value })}
          />
        </div>
      </section>
    </div>
  )
}
