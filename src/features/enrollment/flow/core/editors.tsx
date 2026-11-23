import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, Lightbulb, Minus, Plus, Search, Target, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { CYCLES, STYLE_TO_RISK, nextIncreaseDate, type InvestMode } from '@/features/plan/electionsData'
import { RiskQuestionnaire } from '@/features/plan/RiskQuestionnaire'
import { AppIcon } from '@/design-system/icons'
import { fundCatalog } from '../../investmentCatalog'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../../agent/planConfig'
import { clamp, fundColor, fundMeta, round2, rowsFor, type Election } from './model'
import { useTheme } from '@/core/hooks/useTheme'
import { RangeSlider } from '@/design-system/components/RangeSlider'
import { InfoTip, Stepper, Switch } from './ui'

interface Ctx {
  salary: number
  periods: number
  locale: string
  now: number
}

const label = 'text-[13px] font-medium text-slate-900 dark:text-white'
const hint = 'text-[12px] leading-[1.5] text-slate-500 dark:text-gray-400'

function Field({ title, tip, children, aside }: { title: string; tip?: { label: string; text: string }; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className={cn(label, 'flex items-center gap-1')}>
          {title}
          {tip && <InfoTip label={tip.label} text={tip.text} />}
        </p>
        {aside}
      </div>
      {children}
    </div>
  )
}

type SourceKey = 'preTax' | 'roth' | 'afterTax'
/** The three sources side by side: a short word or a yes/no per row */
const COMPARE_ROWS: { key: string; values: Record<SourceKey, boolean | 'later' | 'now'> }[] = [
  { key: 'taxed', values: { preTax: 'later', roth: 'now', afterTax: 'now' } },
  { key: 'lower_today', values: { preTax: true, roth: false, afterTax: false } },
  { key: 'tax_free_out', values: { preTax: false, roth: true, afterTax: false } },
  { key: 'match', values: { preTax: true, roth: true, afterTax: false } },
]
const SOURCE_DOT: Record<SourceKey, string> = { preTax: 'bg-blue-600', roth: 'bg-violet-500', afterTax: 'bg-sky-400' }

/** Understanding the difference: one compact table under the sources, each column headed by what you've set */
function SourceCompare({ value }: { value: Election }) {
  const { t } = useTranslation()
  const k = (s: string) => t(`enrollment.source_page.cmp_${s}`)
  const keys: SourceKey[] = ['preTax', 'roth', 'afterTax']
  return (
    <div>
      <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{t('enrollment.source_page.understanding_title')}</p>
      <div className="mt-2 overflow-hidden rounded-xl ring-1 ring-slate-200/80 dark:ring-gray-700">
        <table className="w-full table-fixed border-collapse text-[12px]">
          <colgroup>
            <col className="w-[37%]" />
            <col /><col /><col />
          </colgroup>
          <thead className="bg-slate-50 dark:bg-gray-800/60">
            <tr>
              <th scope="col" className="sr-only">{k('feature')}</th>
              {keys.map((key) => (
                <th key={key} scope="col" className="px-1 py-1.5 text-center font-semibold text-slate-900 dark:text-white">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <span className={cn('h-1.5 w-1.5 rounded-full', SOURCE_DOT[key])} aria-hidden />
                    {t(`plan.src_${key}`)}
                  </span>
                  <span className="block text-[11px] font-medium tabular-nums text-slate-500 dark:text-gray-400">{`${value[key]}%`}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.key} className="border-t border-slate-100 dark:border-gray-800">
                <th scope="row" className="px-2.5 py-1.5 text-left font-medium leading-tight text-slate-600 dark:text-gray-300">{k(`row_${row.key}`)}</th>
                {keys.map((key) => {
                  const v = row.values[key]
                  return (
                    <td key={key} className="px-1 py-1.5 text-center">
                      {typeof v === 'string' ? (
                        <span className="font-semibold text-slate-900 dark:text-white">{k(`val_${v}`)}</span>
                      ) : v ? (
                        <span className="inline-flex" role="img" aria-label={k('yes')}><Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden /></span>
                      ) : (
                        <span className="text-slate-300 dark:text-gray-600" role="img" aria-label={k('no')}>—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Contribution ──
export function ContributionEditor({ value, onChange, ctx }: { value: Election; onChange: (e: Election) => void; ctx: Ctx }) {
  const { t } = useTranslation()
  const money = (v: number) => `$${Math.round(v).toLocaleString(ctx.locale)}`
  const cap = PLAN_CONFIG.match.capPercent
  const [min, max] = PLAN_LIMITS.rate
  const total = round2(value.preTax + value.roth + value.afterTax)
  // After-tax savings aren't matched
  const match = employerMatch(ctx.salary, round2(value.preTax + value.roth))
  const fullMatch = employerMatch(ctx.salary, cap)
  const set = (preTax: number, roth: number) => onChange({ ...value, preTax: round2(preTax), roth: round2(roth) })
  const outOfRange = total < min || total > max
  /** Points short of the full match: only pre-tax and Roth count toward it */
  const matchGap = round2(Math.max(0, cap - (value.preTax + value.roth)))
  const showMatchTip = match < fullMatch && matchGap > 0 && total + matchGap <= max
  /** Pre-Tax alone is under the match, though Roth already makes up the rest: moving savings into Pre-Tax keeps the
   *  full match and the same total, and lowers taxable pay now */
  const deferral = round2(value.preTax + value.roth)
  const showPreTaxTip = !showMatchTip && value.preTax < cap && deferral >= cap && value.roth > 0

  /** Whole-number steps on the total: increases go to Pre-Tax; decreases come out of Pre-Tax, then Roth, then After-Tax */
  const step = (delta: number) => {
    const next = clamp(round2(total + delta), min, max)
    const change = round2(next - total)
    if (change === 0) return
    let { preTax, roth, afterTax } = value
    if (change > 0) preTax = round2(preTax + change)
    else {
      let take = -change
      const cut = (v: number) => { const d = Math.min(v, take); take = round2(take - d); return round2(v - d) }
      preTax = cut(preTax); roth = cut(roth); afterTax = cut(afterTax)
    }
    onChange({ ...value, unit: 'percent', preTax, roth, afterTax })
  }
  const monthly = (ctx.salary * total) / 100 / 12
  const roundBtn =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70 disabled:opacity-40 dark:bg-gray-900 dark:text-gray-200 dark:ring-white/15 dark:hover:bg-gray-800'
  const bold = { b: <strong className="font-semibold text-slate-900 dark:text-white" /> }

  /** Percent only: the source steppers no longer switch to dollars */
  const source = (key: 'preTax' | 'roth' | 'afterTax') => {
    const pct = value[key]
    const setPct = (v: number) =>
      key === 'afterTax'
        ? onChange({ ...value, unit: 'percent', afterTax: round2(v) })
        : onChange({ ...value, unit: 'percent', preTax: round2(key === 'preTax' ? v : value.preTax), roth: round2(key === 'roth' ? v : value.roth) })
    return (
      <div className="flex items-center justify-between gap-3 py-2.5">
        <p className={cn(label, 'flex items-center gap-1')}>
          {t(`plan.src_${key}`)}
          <InfoTip label={t(`plan.src_${key}`)} text={t(`plan.def.explain_${key}`)} />
        </p>
        <Stepper value={pct} onChange={setPct} min={0} max={max} step={0.5} label={`${t(`plan.src_${key}`)} %`} suffix="%" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Your contribution: the total, stepped a whole point at a time, and what it takes from each month's pay */}
      <div className="text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-gray-400">{t('enrollment.contribution_page.your_contribution')}</p>
        <div className="mt-2 flex items-center justify-center gap-5">
          <button type="button" onClick={() => step(-1)} disabled={total <= min} className={roundBtn} aria-label={t('enrollment.contribution_page.decrease')}>
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <p className="min-w-[110px] text-[48px] font-extrabold leading-none tracking-[-0.03em] text-blue-600 tabular-nums dark:text-blue-300" aria-live="polite">
            {total}%
          </p>
          <button type="button" onClick={() => step(1)} disabled={total >= max} className={roundBtn} aria-label={t('enrollment.contribution_page.increase')}>
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-[14px] text-slate-500 dark:text-gray-400">
          <span className="font-bold text-slate-900 dark:text-white">{money(monthly)}</span> {t('enrollment.contribution_page.per_month_from_pay')}
        </p>
        {/* Short of the full match, and the pro tip below can't fix it in one tap: a quiet nudge */}
        <AnimatePresence initial={false}>
          {match < fullMatch && !showMatchTip && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mx-auto mt-2 w-fit max-w-full rounded-full bg-amber-50 px-3 py-1 text-[13px] font-medium leading-snug text-amber-800 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20"
            >
              <Target className="-mt-0.5 mr-1.5 inline h-3.5 w-3.5 align-middle" aria-hidden />
              {t('enrollment.core.ed.match_gap', { amount: money(fullMatch - match), rate: cap })}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Field title={t('enrollment.core.ed.by_source')}>
        <div className="divide-y divide-slate-100 dark:divide-gray-800">
          {source('preTax')}

          {/* Pro tip: one line under Pre-Tax, the row it changes, with the change one tap away */}
          <AnimatePresence initial={false}>
            {(showPreTaxTip || showMatchTip) && (
              <motion.div key={showMatchTip ? 'match-tip' : 'pretax-tip'} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden !border-t-0 pb-2.5">
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50/80 py-1.5 pl-3 pr-1.5 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-400/20">
                  <AppIcon icon={Lightbulb} size="inline" className="text-amber-600 dark:text-amber-300" label={t('enrollment.core.pro_tip')} />
                  <p className="min-w-0 flex-1 text-[13px] leading-snug text-slate-700 dark:text-gray-200">
                    {showMatchTip ? (
                      <Trans i18nKey="enrollment.core.match_protip" values={{ gap: matchGap, amount: money((fullMatch - match) / 12) }} components={bold} />
                    ) : (
                      <Trans i18nKey="enrollment.core.match_protip_pre" values={{ move: round2(cap - value.preTax) }} components={bold} />
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => (showMatchTip ? set(value.preTax + matchGap, value.roth) : set(cap, deferral - cap))}
                    className="inline-flex h-7 shrink-0 items-center rounded-full bg-white px-3 text-[12px] font-semibold text-slate-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-900 dark:text-white dark:ring-amber-400/30 dark:hover:bg-gray-800"
                  >
                    {t('enrollment.core.tip_apply')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {source('roth')}
          {source('afterTax')}
        </div>
        {outOfRange && <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">{t('enrollment.feed.err_rate', { min, max, total })}</p>}
      </Field>

      <SourceCompare value={value} />
    </div>
  )
}

// ── Auto-increase ──
export function AutoIncreaseEditor({ value, onChange, ctx }: { value: Election; onChange: (e: Election) => void; ctx: Ctx }) {
  const { t } = useTranslation()
  const a = value.auto
  const setAuto = (next: Partial<Election['auto']>) => onChange({ ...value, auto: { ...a, ...next } })
  const both = value.preTax > 0 && value.roth > 0
  const sources: ('preTax' | 'roth')[] = a.sourceWise && both ? ['preTax', 'roth'] : ['preTax']
  const next = nextIncreaseDate(a.cycle, ctx.now, ctx.now).toLocaleDateString(ctx.locale, { month: 'long', day: 'numeric', year: 'numeric' })
  const [stepMin, stepMax] = PLAN_LIMITS.autoAmount
  const [capMin, capMax] = PLAN_LIMITS.autoCap
  const sliderValue = 'text-[15px] font-semibold tabular-nums text-slate-900 dark:text-white'
  const sliderEnds = 'mt-1.5 flex justify-between text-[12px] tabular-nums text-slate-500 dark:text-gray-400'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4 dark:bg-gray-800/50">
        <div>
          <p className={label}>{t('enrollment.core.ed.auto_title')}</p>
          <p className={cn(hint, 'mt-0.5')}>{a.enabled ? t('enrollment.core.ed.auto_on', { amount: a.amount.preTax, max: a.cap.preTax, date: next }) : t('enrollment.core.ed.auto_off')}</p>
        </div>
        <Switch checked={a.enabled} onChange={(v) => setAuto({ enabled: v })} label={t('enrollment.core.ed.auto_title')} />
      </div>

      <AnimatePresence initial={false}>
        {a.enabled && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="space-y-6 overflow-hidden">
            <Field title={t('plan.def.cycle')} tip={{ label: t('plan.def.cycle'), text: t('enrollment.core.ed.cycle_tip') }}>
              <div className="space-y-1.5" role="radiogroup" aria-label={t('plan.def.cycle')}>
                {CYCLES.map((c) => {
                  const on = a.cycle === c
                  return (
                    <button key={c} type="button" role="radio" aria-checked={on} onClick={() => setAuto({ cycle: c })} className={cn('flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors', on ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30' : 'border-slate-200 hover:border-slate-300 dark:border-gray-700')}>
                      <span>
                        <span className="block text-[14px] font-medium text-slate-900 dark:text-white">{t(`enrollment.core.ed.cycle_${c}`)}</span>
                        <span className={hint}>{t('enrollment.core.ed.next_on', { date: nextIncreaseDate(c, ctx.now, ctx.now).toLocaleDateString(ctx.locale, { month: 'short', day: 'numeric', year: 'numeric' }) })}</span>
                      </span>
                      <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', on ? 'border-blue-600 bg-blue-600' : 'border-slate-300')}>{on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            {sources.map((k) => (
              <div key={k} className="space-y-4">
                {sources.length > 1 && <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">{t(`plan.src_${k}`)}</p>}
                <Field title={t('enrollment.core.ed.raise_by')} aside={<span className={sliderValue}>{`+${a.amount[k]}%`}</span>}>
                  <RangeSlider
                    min={stepMin}
                    max={stepMax}
                    step={1}
                    value={a.amount[k]}
                    color="#059669"
                    onChange={(n) => setAuto({ amount: a.sourceWise ? { ...a.amount, [k]: n } : { preTax: n, roth: n } })}
                    aria-label={sources.length > 1 ? `${t(`plan.src_${k}`)}: ${t('enrollment.core.ed.raise_by')}` : t('enrollment.core.ed.raise_by')}
                    aria-valuetext={`+${a.amount[k]}%`}
                  />
                  <div className={sliderEnds} aria-hidden><span>{`+${stepMin}%`}</span><span>{`+${stepMax}%`}</span></div>
                </Field>
                <Field title={t('enrollment.core.ed.stop_at')} aside={<span className={sliderValue}>{`${a.cap[k]}%`}</span>}>
                  <RangeSlider
                    min={capMin}
                    max={capMax}
                    step={1}
                    value={a.cap[k]}
                    color="#D97706"
                    onChange={(n) => setAuto({ cap: a.sourceWise ? { ...a.cap, [k]: n } : { preTax: n, roth: n } })}
                    aria-label={sources.length > 1 ? `${t(`plan.src_${k}`)}: ${t('enrollment.core.ed.stop_at')}` : t('enrollment.core.ed.stop_at')}
                    aria-valuetext={`${a.cap[k]}%`}
                  />
                  <div className={sliderEnds} aria-hidden><span>{`${capMin}%`}</span><span>{`${capMax}%`}</span></div>
                </Field>
              </div>
            ))}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Investments ──
export function InvestmentsEditor({ value, onChange, ctx, onQuizChange }: { value: Election; onChange: (e: Election) => void; ctx: Ctx; /** Tells the panel the questionnaire is running, so it can hide its own buttons */ onQuizChange?: (open: boolean) => void }) {
  const { t } = useTranslation()
  const isDark = useTheme().resolvedMode === 'dark'
  const [query, setQuery] = useState('')
  const [quiz, setQuiz] = useState(false)
  useEffect(() => {
    onQuizChange?.(quiz)
    return () => onQuizChange?.(false)
  }, [quiz, onQuizChange])
  const rows = rowsFor(value)
  const total = rows.reduce((s, r) => s + r.pct, 0)
  const approaches: { value: InvestMode; title: string; desc: string }[] = [
    { value: 'plan_selected', title: t('enrollment.core.ed.mode_plan'), desc: t('enrollment.core.ed.mode_plan_d') },
    { value: 'own', title: t('enrollment.core.ed.mode_own'), desc: t('enrollment.core.ed.mode_own_d') },
    { value: 'risk_style', title: t('enrollment.core.ed.mode_risk'), desc: t('enrollment.core.ed.mode_risk_d') },
  ]
  const setMode = (m: InvestMode) => {
    onChange({ ...value, mode: m, ownRows: m === 'own' && value.mode !== 'own' ? rows.map((r) => ({ ...r })) : value.ownRows })
    // Matching a risk level starts with the questionnaire, unless it has already been answered
    if (m === 'risk_style' && value.mode !== 'risk_style' && !value.riskStyle) setQuiz(true)
  }
  const setPct = (ticker: string, pct: number) => onChange({ ...value, ownRows: value.ownRows.map((r) => (r.ticker === ticker ? { ...r, pct: clamp(Math.round(pct), 0, 100) } : r)) })
  const addable = fundCatalog.filter((c) => !value.ownRows.some((r) => r.ticker === c.ticker) && (!query.trim() || `${c.name} ${c.ticker}`.toLowerCase().includes(query.trim().toLowerCase())))

  // What goes in each month, from you and your employer, so the investment choice reads in dollars
  const money = (v: number) => `$${Math.round(v).toLocaleString(ctx.locale)}`
  const pay = ctx.salary / 12
  const yours = {
    preTax: (pay * value.preTax) / 100,
    roth: (pay * value.roth) / 100,
    afterTax: (pay * value.afterTax) / 100,
  }
  const youMonthly = yours.preTax + yours.roth + yours.afterTax
  const employerMonthly = employerMatch(ctx.salary, round2(value.preTax + value.roth)) / 12
  const inMonthly = youMonthly + employerMonthly
  const own = value.mode === 'own'

  // The questionnaire takes the panel's place while it runs: no popup stacked on the panel
  if (quiz) {
    return (
      <RiskQuestionnaire
        inline
        open
        onClose={() => setQuiz(false)}
        onComplete={(style) => {
          onChange({ ...value, mode: 'risk_style', risk: STYLE_TO_RISK[style], riskStyle: style })
          setQuiz(false)
        }}
      />
    )
  }

  const impact = (
    <div className="rounded-2xl bg-slate-50 px-4 py-3.5 dark:bg-gray-800/50">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-gray-400">{t('enrollment.core.ed.impact_title')}</p>
      <dl className="mt-2 grid grid-cols-3 gap-2">
        <div>
          <dt className={hint}>{t('enrollment.core.ed.impact_you')}</dt>
          <dd className="text-[17px] font-bold tabular-nums text-slate-900 dark:text-white">{money(youMonthly)}</dd>
        </div>
        <div>
          <dt className={hint}>{t('enrollment.core.ed.impact_employer')}</dt>
          <dd className="text-[17px] font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{`+${money(employerMonthly)}`}</dd>
        </div>
        <div>
          <dt className={hint}>{t('enrollment.core.ed.impact_total')}</dt>
          <dd className="text-[17px] font-bold tabular-nums text-slate-900 dark:text-white">{money(inMonthly)}</dd>
        </div>
      </dl>
      <p className={cn(hint, 'mt-1.5 tabular-nums')}>
        {(['preTax', 'roth', 'afterTax'] as const)
          .filter((k) => value[k] > 0)
          .map((k) => `${t(`plan.src_${k}`)} ${money(yours[k])}`)
          .join(' · ')}
      </p>
    </div>
  )

  const approachField = (
    <Field title={t('enrollment.core.ed.approach')}>
      <div className="space-y-2" role="radiogroup" aria-label={t('enrollment.core.ed.approach')}>
        {approaches.map(({ value: m, title, desc }) => {
          const on = value.mode === m
          return (
            <div
              key={m}
              className={cn(
                'overflow-hidden rounded-xl ring-1 transition-colors',
                on ? 'bg-blue-50/60 ring-2 ring-blue-600 dark:bg-blue-500/10 dark:ring-blue-400' : 'ring-slate-200 hover:ring-slate-300 dark:ring-gray-700 dark:hover:ring-gray-600',
              )}
            >
              <button type="button" role="radio" aria-checked={on} onClick={() => setMode(m)} className="flex w-full items-start gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
                <span className={cn('mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-1', on ? 'bg-blue-600 ring-blue-600' : 'bg-white ring-slate-300 dark:bg-transparent dark:ring-gray-600')} aria-hidden>
                  {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-slate-900 dark:text-white">{title}</span>
                  <span className={cn(hint, 'mt-0.5 block')}>{desc}</span>
                </span>
              </button>
              {/* The questionnaire belongs to this choice: one row at the foot of its card */}
              {on && m === 'risk_style' && (
                <button
                  type="button"
                  onClick={() => setQuiz(true)}
                  className="flex w-full items-center gap-3 border-t border-blue-100 px-3.5 py-2.5 text-left transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:border-blue-400/20 dark:hover:bg-blue-500/10"
                >
                  <span className="w-[18px] shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-blue-700 dark:text-blue-300">
                      {value.riskStyle ? t('enrollment.core.ed.quiz_retake') : t('plan.inv.take_questionnaire')}
                    </span>
                    <span className={cn(hint, 'block')}>
                      {value.riskStyle ? t('enrollment.core.ed.quiz_result', { style: t(`plan.risk.style_${value.riskStyle}`) }) : t('enrollment.core.ed.quiz_prompt')}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" aria-hidden />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </Field>
  )

  const fundsField = (
    <Field
      title={t('enrollment.core.ed.funds')}
      aside={<span className={cn('text-[12px] font-semibold tabular-nums', total === 100 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600')}>{t('enrollment.core.ed.total_pct', { total })}</span>}
    >
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-gray-800 dark:border-gray-700">
        {rows.map((r, i) => {
          const meta = fundMeta(r.ticker)
          return (
            <li key={r.ticker} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: fundColor(i, isDark) }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={cn('block text-[13px] font-medium leading-snug text-slate-900 dark:text-white', !own && 'truncate')}>{meta?.name ?? r.ticker}</span>
                <span className="text-[12px] text-slate-500">{r.ticker}{meta ? ` · ${meta.assetClass}` : ''}</span>
              </span>
              {own ? (
                <span className="flex items-center gap-1">
                  <Stepper value={r.pct} onChange={(v) => setPct(r.ticker, v)} min={0} max={100} step={5} label={`${meta?.name ?? r.ticker} %`} suffix="%" />
                  {value.ownRows.length > 1 && (
                    <button type="button" onClick={() => onChange({ ...value, ownRows: value.ownRows.filter((x) => x.ticker !== r.ticker) })} aria-label={`${t('enrollment.quick.remove_fund')}: ${meta?.name ?? r.ticker}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-800">
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </span>
              ) : (
                <span className="text-right">
                  <span className="block text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{r.pct}%</span>
                  <span className="block text-[11px] tabular-nums text-slate-500 dark:text-gray-400">{t('enrollment.core.ed.fund_month', { amount: money((inMonthly * r.pct) / 100) })}</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Field>
  )

  const settings = (
    <div className="space-y-4 rounded-2xl ring-1 ring-slate-200 p-4 dark:ring-gray-700">
      <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{t('enrollment.core.ed.plan_settings')}</p>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={label}>{t('plan.inv.auto_rebalance')}</p>
          <p className={hint}>{t('plan.inv.auto_rebalance_sub')}</p>
        </div>
        <Switch checked={value.autoRebalance} onChange={(v) => onChange({ ...value, autoRebalance: v })} label={t('plan.inv.auto_rebalance')} />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={label}>{t('plan.inv.sdb')}</p>
          <p className={hint}>{t('plan.inv.sdb_sub')}</p>
        </div>
        <Switch checked={value.sdb} onChange={(v) => onChange({ ...value, sdb: v })} label={t('plan.inv.sdb')} />
      </div>
      {value.sdb && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-[1.5] text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{t('plan.sdb_funds.note')}</p>}
    </div>
  )

  const addFunds = (
    <Field title={t('plan.inv.add_fund')}>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('enrollment.core.ed.search_funds')} aria-label={t('enrollment.core.ed.search_funds')} className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
      </label>
      <ul className="mt-2 max-h-[240px] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 dark:divide-gray-800 dark:border-gray-700">
        {addable.map((c) => (
          <li key={c.ticker}>
            <button type="button" onClick={() => onChange({ ...value, ownRows: [...value.ownRows, { ticker: c.ticker, pct: 0 }] })} className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-gray-800">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">{c.name}</span>
                <span className="text-[12px] text-slate-500">{c.ticker} · {c.assetClass}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-blue-700 dark:text-blue-300">
                <Plus className="h-4 w-4" aria-hidden />
                {t('enrollment.core.ed.add')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Field>
  )

  return (
    /* Two columns in a wider panel: the choices on the left, what they mean in dollars and funds on the right */
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-7">
      <div className="space-y-6">
        {approachField}
        {/* Build My Own: funds to add sit right under the choice, beside the mix they go into */}
        {own && addFunds}
        {settings}
      </div>
      <div className="space-y-6">
        {impact}
        {fundsField}
      </div>
    </div>
  )
}
