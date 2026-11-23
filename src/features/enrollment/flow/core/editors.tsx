import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, DollarSign, Lightbulb, Plus, Search, Shield, Target, TrendingUp, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { CYCLES, STYLE_TO_RISK, nextIncreaseDate, type InvestMode } from '@/features/plan/electionsData'
import { RiskQuestionnaire } from '@/features/plan/RiskQuestionnaire'
import { AppIcon, IconTile, type IconTileTone } from '@/design-system/icons'
import { fundCatalog } from '../../investmentCatalog'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../../agent/planConfig'
import { clamp, fundColor, fundMeta, round2, rowsFor, type Election } from './model'
import { useTheme } from '@/core/hooks/useTheme'
import { RangeSlider } from '@/design-system/components/RangeSlider'
import { InfoTip, Segmented, Stepper, Switch } from './ui'

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

/** The three sources side by side, as the full enrollment flow explains them */
const SOURCE_GUIDE: { key: 'pre' | 'roth' | 'after'; icon: LucideIcon; tone: IconTileTone }[] = [
  { key: 'pre', icon: TrendingUp, tone: 'blue' },
  { key: 'roth', icon: Shield, tone: 'violet' },
  { key: 'after', icon: DollarSign, tone: 'amber' },
]

// ── Contribution ──
export function ContributionEditor({ value, onChange, ctx }: { value: Election; onChange: (e: Election) => void; ctx: Ctx }) {
  const { t } = useTranslation()
  const money = (v: number) => `$${Math.round(v).toLocaleString(ctx.locale)}`
  const cap = PLAN_CONFIG.match.capPercent
  const [min, max] = PLAN_LIMITS.rate
  const total = round2(value.preTax + value.roth + value.afterTax)
  const perCheck = (ctx.salary * total) / 100 / ctx.periods
  // After-tax savings aren't matched
  const match = employerMatch(ctx.salary, round2(value.preTax + value.roth))
  const fullMatch = employerMatch(ctx.salary, cap)
  const dollarsFor = (pct: number) => round2((ctx.salary * pct) / 100 / ctx.periods)
  const set = (preTax: number, roth: number) => onChange({ ...value, preTax: round2(preTax), roth: round2(roth) })
  const outOfRange = total < min || total > max
  /** Points short of the full match: only pre-tax and Roth count toward it */
  const matchGap = round2(Math.max(0, cap - (value.preTax + value.roth)))
  const showMatchTip = match < fullMatch && matchGap > 0 && total + matchGap <= max
  /** Pre-Tax alone is under the match, though Roth already makes up the rest: moving savings into Pre-Tax keeps the
   *  full match and the same total, and lowers taxable pay now */
  const deferral = round2(value.preTax + value.roth)
  const showPreTaxTip = !showMatchTip && value.preTax < cap && deferral >= cap && value.roth > 0

  const source = (key: 'preTax' | 'roth' | 'afterTax') => {
    const pct = value[key]
    const setPct = (v: number) => (key === 'afterTax' ? onChange({ ...value, afterTax: round2(v) }) : key === 'preTax' ? set(v, value.roth) : set(value.preTax, v))
    return (
      <div className="flex items-center justify-between gap-3 py-3">
        <p className={cn(label, 'flex items-center gap-1')}>
          {t(`plan.src_${key}`)}
          <InfoTip label={t(`plan.src_${key}`)} text={t(`plan.def.explain_${key}`)} />
        </p>
        {value.unit === 'percent' ? (
          <Stepper value={pct} onChange={setPct} min={0} max={max} step={0.5} label={`${t(`plan.src_${key}`)} %`} suffix="%" />
        ) : (
          <Stepper value={dollarsFor(pct)} onChange={(d) => setPct(clamp(round2((d * ctx.periods * 100) / ctx.salary), 0, max))} min={0} max={dollarsFor(max)} step={5} label={`${t(`plan.src_${key}`)} $`} prefix="$" />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-gray-800/50">
        <p className={hint}>{t('enrollment.core.ed.total')}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">{total}%</span>
          <span className="text-[14px] text-slate-500 dark:text-gray-400">{t('enrollment.core.per_check', { amount: money(perCheck) })}</span>
        </p>
        {/* Only shown when short of the full match, as a nudge */}
        <AnimatePresence initial={false}>
          {match < fullMatch && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-amber-700 dark:text-amber-400"
            >
              <Target className="h-3.5 w-3.5" aria-hidden />
              {t('enrollment.core.ed.match_gap', { amount: money(fullMatch - match), rate: cap })}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Pro tip: Pre-Tax is under the match, but Roth already fills the gap */}
      <AnimatePresence initial={false}>
        {showPreTaxTip && (
          <motion.div key="pretax-tip" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-2xl bg-amber-50/80 p-3.5 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-400/20">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
                <AppIcon icon={Lightbulb} size="inline" />
                {t('enrollment.core.pro_tip')}
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.5] text-slate-700 dark:text-gray-200">
                <Trans
                  i18nKey="enrollment.core.match_protip_pre"
                  values={{ cap, pre: value.preTax }}
                  components={{ b: <strong className="font-semibold text-slate-900 dark:text-white" /> }}
                />
              </p>
              <button
                type="button"
                onClick={() => set(cap, deferral - cap)}
                className="mt-2.5 inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[13px] font-semibold text-slate-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-900 dark:text-white dark:ring-amber-400/30 dark:hover:bg-gray-800"
              >
                {t('enrollment.core.match_protip_pre_cta', { cap })}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pro tip while some employer match is left unclaimed */}
      <AnimatePresence initial={false}>
        {showMatchTip && (
          <motion.div key="match-tip" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-2xl bg-amber-50/80 p-3.5 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-400/20">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
                <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                {t('enrollment.core.pro_tip')}
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.5] text-slate-700 dark:text-gray-200">
                <Trans
                  i18nKey="enrollment.core.match_protip"
                  values={{ gap: matchGap, amount: money((fullMatch - match) / 12), cost: money(dollarsFor(matchGap)) }}
                  components={{ b: <strong className="font-semibold text-slate-900 dark:text-white" /> }}
                />
              </p>
              <button
                type="button"
                onClick={() => set(value.preTax + matchGap, value.roth)}
                className="mt-2.5 inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[13px] font-semibold text-slate-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-900 dark:text-white dark:ring-amber-400/30 dark:hover:bg-gray-800"
              >
                {t('enrollment.core.match_protip_cta')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Field title={t('enrollment.core.ed.by_source')}>
        <Segmented size="sm" label={t('plan.def.unit')} value={value.unit} onChange={(u) => onChange({ ...value, unit: u })} options={[{ value: 'percent', label: t('enrollment.quick.unit_percent') }, { value: 'dollar', label: t('enrollment.quick.unit_dollar') }]} />
        <div className="mt-1 divide-y divide-slate-100 dark:divide-gray-800">
          {source('preTax')}
          {source('roth')}
          {source('afterTax')}
        </div>
        {outOfRange && <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">{t('enrollment.feed.err_rate', { min, max, total })}</p>}

        {/* Understanding the difference: each source with its colour, icon and three plain points */}
        <div className="mt-5">
          <p className="text-[14px] font-semibold text-slate-900 dark:text-white">{t('enrollment.source_page.understanding_title')}</p>
          <ul className="mt-3 space-y-3">
            {SOURCE_GUIDE.map(({ key, icon, tone }) => (
              <li key={key} className="rounded-2xl p-3.5 ring-1 ring-slate-200/80 dark:ring-gray-700">
                <span className="flex items-center gap-3">
                  <IconTile icon={icon} tone={tone} />
                  <span className="text-[15px] font-semibold text-slate-900 dark:text-white">{t(`enrollment.source_page.card_${key}_title`)}</span>
                </span>
                <ul className="mt-2.5 space-y-1.5">
                  {[1, 2, 3].map((n) => (
                    <li key={n} className="flex items-start gap-2 text-[13px] leading-snug text-slate-700 dark:text-gray-200">
                      <AppIcon icon={Check} size="inline" className="mt-px text-emerald-600 dark:text-emerald-400" />
                      {t(`enrollment.source_page.card_${key}_p${n}`)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </Field>
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
export function InvestmentsEditor({ value, onChange }: { value: Election; onChange: (e: Election) => void }) {
  const { t } = useTranslation()
  const isDark = useTheme().resolvedMode === 'dark'
  const [query, setQuery] = useState('')
  const [quiz, setQuiz] = useState(false)
  const rows = rowsFor(value)
  const total = rows.reduce((s, r) => s + r.pct, 0)
  const approaches: { value: InvestMode; title: string; desc: string }[] = [
    { value: 'risk_style', title: t('enrollment.core.ed.mode_risk'), desc: t('enrollment.core.ed.mode_risk_d') },
    { value: 'plan_selected', title: t('enrollment.core.ed.mode_plan'), desc: t('enrollment.core.ed.mode_plan_d') },
    { value: 'own', title: t('enrollment.core.ed.mode_own'), desc: t('enrollment.core.ed.mode_own_d') },
  ]
  const setMode = (m: InvestMode) => {
    onChange({ ...value, mode: m, ownRows: m === 'own' && value.mode !== 'own' ? rows.map((r) => ({ ...r })) : value.ownRows })
    // Matching a risk level starts with the questionnaire, unless it has already been answered
    if (m === 'risk_style' && value.mode !== 'risk_style' && !value.riskStyle) setQuiz(true)
  }
  const setPct = (ticker: string, pct: number) => onChange({ ...value, ownRows: value.ownRows.map((r) => (r.ticker === ticker ? { ...r, pct: clamp(Math.round(pct), 0, 100) } : r)) })
  const addable = fundCatalog.filter((c) => !value.ownRows.some((r) => r.ticker === c.ticker) && (!query.trim() || `${c.name} ${c.ticker}`.toLowerCase().includes(query.trim().toLowerCase())))

  return (
    <div className="space-y-6">
      <Field title={t('enrollment.core.ed.approach')}>
        <div className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200 dark:divide-gray-800 dark:ring-gray-700" role="radiogroup" aria-label={t('enrollment.core.ed.approach')}>
          {approaches.map(({ value: m, title, desc }) => {
            const on = value.mode === m
            return (
              <button key={m} type="button" role="radio" aria-checked={on} onClick={() => setMode(m)} className="flex w-full items-start gap-3 px-3.5 py-3 text-left first:rounded-t-xl last:rounded-b-xl hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-gray-800/60">
                <span className={cn('mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-1', on ? 'bg-blue-600 ring-blue-600' : 'ring-slate-300 dark:ring-gray-600')} aria-hidden>
                  {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-[14px] text-slate-900 dark:text-white', on ? 'font-semibold' : 'font-medium')}>{title}</span>
                  {on && <span className={cn(hint, 'block')}>{desc}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </Field>

      {value.mode === 'risk_style' && (
        /* No level to pick by hand: the questionnaire sets it, and can be taken again */
        <p className={cn(hint, '-mt-3')}>
          {value.riskStyle ? t('enrollment.core.ed.quiz_result', { style: t(`enrollment.investment.level_${STYLE_TO_RISK[value.riskStyle]}`) }) : t('enrollment.core.ed.quiz_prompt')}{' '}
          <button type="button" onClick={() => setQuiz(true)} className="inline-flex min-h-6 items-center font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300">
            {value.riskStyle ? t('enrollment.core.ed.quiz_retake') : t('plan.inv.take_questionnaire')}
          </button>
        </p>
      )}
      {/* Above the edit panel: rendered on the page body, stacked over the panel */}
      {createPortal(
        <div className="relative z-[100]">
          <RiskQuestionnaire
            open={quiz}
            onClose={() => setQuiz(false)}
            onComplete={(style) => {
              onChange({ ...value, mode: 'risk_style', risk: STYLE_TO_RISK[style], riskStyle: style })
              setQuiz(false)
            }}
          />
        </div>,
        document.body,
      )}

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
                  <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">{meta?.name ?? r.ticker}</span>
                  <span className="text-[12px] text-slate-500">{r.ticker}{meta ? ` · ${meta.assetClass}` : ''}</span>
                </span>
                {value.mode === 'own' ? (
                  <span className="flex items-center gap-1">
                    <Stepper value={r.pct} onChange={(v) => setPct(r.ticker, v)} min={0} max={100} step={5} label={`${meta?.name ?? r.ticker} %`} suffix="%" />
                    {value.ownRows.length > 1 && (
                      <button type="button" onClick={() => onChange({ ...value, ownRows: value.ownRows.filter((x) => x.ticker !== r.ticker) })} aria-label={`${t('enrollment.quick.remove_fund')}: ${meta?.name ?? r.ticker}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-800">
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                  </span>
                ) : (
                  <span className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{r.pct}%</span>
                )}
              </li>
            )
          })}
        </ul>
      </Field>

      {value.mode === 'own' && (
        <Field title={t('plan.inv.add_fund')}>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('enrollment.core.ed.search_funds')} aria-label={t('enrollment.core.ed.search_funds')} className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </label>
          <ul className="mt-1.5 max-h-40 overflow-y-auto">
            {addable.map((c) => (
              <li key={c.ticker}>
                <button type="button" onClick={() => onChange({ ...value, ownRows: [...value.ownRows, { ticker: c.ticker, pct: 0 }] })} className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-gray-800">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">{c.name}</span>
                    <span className="text-[12px] text-slate-500">{c.ticker} · {c.assetClass}</span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Field>
      )}

      <div className="space-y-4 border-t border-slate-100 pt-5 dark:border-gray-800">
        <p className="text-[14px] font-semibold text-slate-900 dark:text-white">{t('enrollment.core.ed.plan_settings')}</p>
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
    </div>
  )
}
