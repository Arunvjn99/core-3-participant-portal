import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PiggyBank } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconTile } from '@/design-system/icons'
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
  const [period, setPeriod] = useState<Period>('month')
  /** With monthly paychecks, per paycheck and per month are the same figure, so only one is offered */
  const periodsShown: Period[] = p.periods === 12 ? ['month', 'year'] : ['paycheck', 'month', 'year']
  const [activeFlow, setActiveFlow] = useState<string | null>(null)

  const per = period === 'paycheck' ? p.periods : period === 'month' ? 12 : 1
  const ofYear = (v: number) => v / per
  const periodWord = t(`enrollment.core.web.per_${period}`)
  /** The same words inside a sentence, where they aren't a label */
  const periodInText = periodWord.toLocaleLowerCase()
  /** Inside a title the period's leading "Per" is a minor word, so it drops to lower case ("You Get per Month") */
  const periodInTitle = periodWord.replace(/^Per /, 'per ').replace(/^Por /, 'por ')
  const yearlyYou = (p.salary * p.total) / 100
  const yearlyIn = yearlyYou + p.match

  // What you save: each source of your own pay. The employer's match has its own card and KPI, so it isn't repeated here
  const flow = [
    ...p.sources.filter((src) => src.pct > 0).map((src) => ({ key: src.key, label: src.label, amount: (p.salary * src.pct) / 100, note: t('enrollment.core.web.pct_of_pay', { pct: src.pct }), bar: src.bar })),
  ]
  const flowTotal = flow.reduce((sum, row) => sum + row.amount, 0) || 1
  const [hoverClass, setHoverClass] = useState<string | null>(null)
  const matchedRate = Math.min(p.deferral, p.cap)
  const schedule = p.auto.schedule

  return (
    <div className="mx-auto w-full max-w-[920px] space-y-4">
      {/* One switch for every amount on the page */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-secondary">{t('enrollment.core.web.intro')}</p>
        <div role="group" aria-label={t('enrollment.core.web.period_label')} className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-white/[0.08]">
          {periodsShown.map((k) => (
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
        ].map((k, i) => (
          <div key={k.label} className={cn(CARD, 'flex items-end justify-between gap-3 p-4 sm:p-4')}>
            <div className="min-w-0">
              <dt className="text-[12px] font-medium text-text-secondary">{k.label}</dt>
              <dd className={cn('mt-1 text-[22px] font-bold tabular-nums tracking-tight text-text-primary', k.tone)}>{k.value}</dd>
              <dd className="text-[12px] text-text-secondary">{k.sub}</dd>
            </div>
            {/* The projection tile's growth line sits beside its figure, so every tile stays the same height */}
            {i === 3 && <Sparkline points={p.series} label={t('enrollment.core.chart_label')} from={t('enrollment.core.web.auto_today')} to={t('enrollment.core.web.age', { age: p.retireAge })} />}
          </div>
        ))}
      </dl>

      {/* Where the money comes from: one bar, explored by hovering a part or a row */}
      <section className={CARD} aria-labelledby="web-flow">
        <div className="flex items-center gap-3">
          <IconTile name="contributions" />
          <div>
            <h3 id="web-flow" className={CARD_TITLE}>{t('enrollment.core.web.flow_title')}</h3>
            <p className="text-[13px] text-text-secondary">{t('enrollment.core.web.flow_sub', { you: p.money(ofYear(yearlyYou)), period: periodInText })}</p>
          </div>
        </div>
        <div className="mt-4 flex h-4 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden>
          {flow.map((s) => (
            <span
              key={s.key}
              onMouseEnter={() => setActiveFlow(s.key)}
              onMouseLeave={() => setActiveFlow(null)}
              className={cn('h-full transition-opacity first:rounded-l-full last:rounded-r-full', s.bar, activeFlow && activeFlow !== s.key && 'opacity-30')}
              style={{ width: `${(s.amount / flowTotal) * 100}%`, minWidth: 6 }}
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
                  <span className="block text-[12px] tabular-nums text-text-secondary">{t('enrollment.core.web.share', { pct: Math.round((s.amount / flowTotal) * 100) })}</span>
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
                <dt className="text-text-secondary">{t('enrollment.core.web.match_you_get', { period: periodInTitle })}</dt>
                <dd className="text-[18px] font-bold tabular-nums text-text-primary">{`+${p.money(ofYear(p.match))}`}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">{t('enrollment.core.web.match_max', { period: periodInTitle })}</dt>
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
          {p.auto.enabled && schedule.length > 0 ? (
            <>
              <table className="mt-4 w-full text-[13px]">
                <caption className="sr-only">{t('enrollment.core.sum_schedule')}</caption>
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[12px] text-text-secondary dark:border-white/10">
                    <th scope="col" className="py-1.5 pr-3 font-semibold">{t('enrollment.core.web.auto_when')}</th>
                    <th scope="col" className="py-1.5 pr-3 font-semibold">{t('enrollment.core.web.auto_rate')}</th>
                    <th scope="col" className="py-1.5 text-right font-semibold">{t('enrollment.core.web.auto_amount', { period: periodInTitle })}</th>
                  </tr>
                </thead>
                <tbody>
                  {[{ year: 0, rate: p.total }, ...schedule].map((row, i) => (
                    <tr key={row.year} className="border-b border-slate-100 last:border-0 dark:border-white/[0.06]">
                      <th scope="row" className={cn('py-2 pr-3 text-left', i === 0 ? 'font-semibold text-text-primary' : 'font-medium text-text-primary')}>
                        {i === 0 ? t('enrollment.core.web.auto_today') : row.year}
                      </th>
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" aria-hidden>
                            <span className={cn('block h-full rounded-full', i === 0 ? 'bg-slate-400' : 'bg-[#2563EB] dark:bg-blue-400')} style={{ width: `${Math.min(100, (row.rate / p.auto.stopAt) * 100)}%` }} />
                          </span>
                          <span className="font-semibold tabular-nums text-text-primary">{`${row.rate}%`}</span>
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums text-text-primary">{p.money(ofYear((p.salary * row.rate) / 100))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* How each amount is worked out */}
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] text-text-secondary dark:bg-white/[0.05]">
                {t('enrollment.core.web.auto_how', { pay: p.money(ofYear(p.salary)), period: periodInText, cap: p.auto.stopAt })}
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
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <caption className="sr-only">{t('enrollment.core.ed.funds')}</caption>
            <thead>
              <tr className="border-b border-slate-200 text-left text-[12px] font-semibold text-text-secondary dark:border-white/10">
                <th scope="col" className="py-2 pr-3 font-semibold">{t('enrollment.core.ed.funds')}</th>
                <th scope="col" className="hidden py-2 pr-3 font-semibold sm:table-cell">{t('enrollment.core.web.fund_type')}</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">%</th>
                <th scope="col" className="py-2 text-right font-semibold">{t('enrollment.core.web.fund_in', { period: periodInTitle })}</th>
              </tr>
            </thead>
            <tbody>
              {p.funds.map((fund) => {
                const lit = hoverClass === fund.assetClass
                const dim = hoverClass !== null && !lit
                return (
                  <tr key={fund.ticker} className={cn('border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-white/[0.04]', lit && 'bg-blue-50/70 dark:bg-blue-500/10', dim && 'opacity-40')}>
                    <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                      <span className="flex items-start gap-2.5">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: fund.color }} aria-hidden />
                        <span className="min-w-0">
                          <span className="block font-semibold text-text-primary">{fund.name}</span>
                          <span className="block text-[12px] text-text-secondary">{fund.ticker}<span className="sm:hidden">{` · ${fund.assetClass}`}</span></span>
                        </span>
                      </span>
                    </th>
                    <td className="hidden py-2.5 pr-3 align-top text-text-secondary sm:table-cell">{fund.assetClass}</td>
                    <td className="py-2.5 pr-3 text-right align-top font-bold tabular-nums text-text-primary">{`${fund.pct}%`}</td>
                    <td className="py-2.5 text-right align-top tabular-nums text-text-primary">{p.money(ofYear((yearlyIn * fund.pct) / 100))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-white/10">
          <p className="text-[13px] font-semibold text-text-primary">{t('enrollment.core.sum_by_type')}</p>
          {/* Hover or focus a type to pick out its funds above */}
          <ul className="mt-2 flex flex-wrap gap-2">
            {p.byAssetClass.map(([cls, pct]) => (
              <li key={cls}>
                <button
                  type="button"
                  aria-pressed={hoverClass === cls}
                  onMouseEnter={() => setHoverClass(cls)}
                  onMouseLeave={() => setHoverClass(null)}
                  onFocus={() => setHoverClass(cls)}
                  onBlur={() => setHoverClass(null)}
                  className={cn('rounded-full px-3 py-1 text-[12px] text-text-primary transition-colors', FOCUS, hoverClass === cls ? 'bg-blue-100 dark:bg-blue-500/25' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14]')}
                >
                  <span className="font-semibold tabular-nums">{`${pct}%`}</span> {cls}
                </button>
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

/** A small growth line for a tile: the balance from today to retirement, filled underneath, its two ends labelled */
function Sparkline({ points, label, from, to }: { points: number[]; label: string; from: string; to: string }) {
  if (points.length < 2) return null
  const W = 200
  const H = 36
  const max = Math.max(...points) || 1
  const xy = points.map((v, i) => [(i / (points.length - 1)) * W, H - 3 - (v / max) * (H - 8)] as const)
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <div className="w-[45%] max-w-[120px] shrink-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-9 w-full" role="img" aria-label={label} preserveAspectRatio="none">
        <path d={`${line} L${W},${H} L0,${H} Z`} className="fill-blue-500/10 dark:fill-blue-400/15" />
        <path d={line} fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-blue-600 dark:stroke-blue-400" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-text-secondary" aria-hidden>
        <span>{from}</span>
        <span>{to}</span>
      </div>
    </div>
  )
}
