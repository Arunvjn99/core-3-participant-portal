import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, LayoutGrid, Plus, Search, SlidersHorizontal, Target, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { CYCLES, PLAN_RULES, nextIncreaseDate, type InvestMode } from '@/features/plan/electionsData'
import { fundCatalog } from '../../investmentCatalog'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../../agent/planConfig'
import { AUTO_AMOUNTS, AUTO_CAPS, FUND_COLORS, RISKS, blendedFee, clamp, fundMeta, round2, rowsFor, type Election } from './model'
import { InfoTip, Pills, Segmented, Stepper, Switch } from './ui'

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

// ── Contribution ──
export function ContributionEditor({ value, onChange, ctx }: { value: Election; onChange: (e: Election) => void; ctx: Ctx }) {
  const { t } = useTranslation()
  const money = (v: number) => `$${Math.round(v).toLocaleString(ctx.locale)}`
  const cap = PLAN_CONFIG.match.capPercent
  const [min, max] = PLAN_LIMITS.rate
  const total = round2(value.preTax + value.roth)
  const perCheck = (ctx.salary * total) / 100 / ctx.periods
  const match = employerMatch(ctx.salary, total)
  const fullMatch = employerMatch(ctx.salary, cap)
  const dollarsFor = (pct: number) => round2((ctx.salary * pct) / 100 / ctx.periods)
  const set = (preTax: number, roth: number) => onChange({ ...value, preTax: round2(preTax), roth: round2(roth) })
  const presets = [
    { key: 'match', label: t('enrollment.core.ed.preset_match', { rate: cap }), pre: cap, ro: 0 },
    { key: 'roth', label: t('enrollment.core.ed.preset_roth', { rate: cap }), pre: 0, ro: cap },
    { key: 'split', label: t('enrollment.core.ed.preset_split', { half: cap / 2 }), pre: cap / 2, ro: cap / 2 },
    { key: 'plan', label: t('enrollment.core.ed.preset_plan', { rate: PLAN_RULES.defaultRate.preTax }), pre: PLAN_RULES.defaultRate.preTax, ro: PLAN_RULES.defaultRate.roth },
  ]
  const active = presets.find((p) => p.pre === value.preTax && p.ro === value.roth)?.key ?? null
  const outOfRange = total < min || total > max

  const source = (key: 'preTax' | 'roth') => {
    const pct = value[key]
    const setPct = (v: number) => (key === 'preTax' ? set(v, value.roth) : set(value.preTax, v))
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
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={match >= fullMatch ? 'full' : 'gap'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className={cn('mt-2 flex items-center gap-1.5 text-[13px] font-medium', match >= fullMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}
          >
            {match >= fullMatch ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Target className="h-3.5 w-3.5" aria-hidden />}
            {match >= fullMatch ? t('enrollment.core.ed.full_match', { amount: money(match) }) : t('enrollment.core.ed.match_gap', { amount: money(fullMatch - match), rate: cap })}
          </motion.p>
        </AnimatePresence>
      </div>

      <Field title={t('enrollment.core.ed.quick')}>
        <Pills label={t('enrollment.core.ed.quick')} value={active} options={presets.map((p) => ({ value: p.key, label: p.label }))} onChange={(k) => {
          const p = presets.find((x) => x.key === k)
          if (p) set(p.pre, p.ro)
        }} />
      </Field>

      <Field title={t('enrollment.core.ed.by_source')}>
        <Segmented size="sm" label={t('plan.def.unit')} value={value.unit} onChange={(u) => onChange({ ...value, unit: u })} options={[{ value: 'percent', label: t('enrollment.quick.unit_percent') }, { value: 'dollar', label: t('enrollment.quick.unit_dollar') }]} />
        <div className="mt-1 divide-y divide-slate-100 dark:divide-gray-800">
          {source('preTax')}
          {source('roth')}
        </div>
        {outOfRange && <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">{t('enrollment.feed.err_rate', { min, max, total })}</p>}
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
  const amounts = AUTO_AMOUNTS.filter((n) => n >= PLAN_LIMITS.autoAmount[0] && n <= PLAN_LIMITS.autoAmount[1])
  const caps = AUTO_CAPS.filter((n) => n >= PLAN_LIMITS.autoCap[0] && n <= PLAN_LIMITS.autoCap[1])

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
                <Field title={t('enrollment.core.ed.raise_by')}>
                  <Pills label={t('enrollment.core.ed.raise_by')} value={a.amount[k]} options={amounts.map((n) => ({ value: n, label: `+${n}%` }))} onChange={(n) => setAuto({ amount: a.sourceWise ? { ...a.amount, [k]: n } : { preTax: n, roth: n } })} />
                </Field>
                <Field title={t('enrollment.core.ed.stop_at')}>
                  <Pills label={t('enrollment.core.ed.stop_at')} value={a.cap[k]} options={caps.map((n) => ({ value: n, label: `${n}%` }))} onChange={(n) => setAuto({ cap: a.sourceWise ? { ...a.cap, [k]: n } : { preTax: n, roth: n } })} />
                </Field>
              </div>
            ))}

            {both && (
              <div className="flex items-center justify-between gap-4">
                <p className={cn(label, 'flex items-center gap-1')}>
                  {t('enrollment.quick.source_wise')}
                  <InfoTip label={t('enrollment.quick.source_wise')} text={t('enrollment.core.ed.source_tip')} />
                </p>
                <Switch checked={a.sourceWise} onChange={(v) => setAuto({ sourceWise: v })} label={t('enrollment.quick.source_wise')} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Investments ──
export function InvestmentsEditor({ value, onChange, onViewAll }: { value: Election; onChange: (e: Election) => void; onViewAll: () => void }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const rows = rowsFor(value)
  const total = rows.reduce((s, r) => s + r.pct, 0)
  const approaches: { value: InvestMode; icon: typeof Target; title: string; desc: string }[] = [
    { value: 'risk_style', icon: Target, title: t('enrollment.core.ed.mode_risk'), desc: t('enrollment.core.ed.mode_risk_d') },
    { value: 'plan_selected', icon: LayoutGrid, title: t('enrollment.core.ed.mode_plan'), desc: t('enrollment.core.ed.mode_plan_d') },
    { value: 'own', icon: SlidersHorizontal, title: t('enrollment.core.ed.mode_own'), desc: t('enrollment.core.ed.mode_own_d') },
  ]
  const setMode = (m: InvestMode) => onChange({ ...value, mode: m, ownRows: m === 'own' && value.mode !== 'own' ? rows.map((r) => ({ ...r })) : value.ownRows })
  const setPct = (ticker: string, pct: number) => onChange({ ...value, ownRows: value.ownRows.map((r) => (r.ticker === ticker ? { ...r, pct: clamp(Math.round(pct), 0, 100) } : r)) })
  const addable = fundCatalog.filter((c) => !value.ownRows.some((r) => r.ticker === c.ticker) && (!query.trim() || `${c.name} ${c.ticker}`.toLowerCase().includes(query.trim().toLowerCase())))

  return (
    <div className="space-y-6">
      <Field title={t('enrollment.core.ed.approach')}>
        <div className="space-y-1.5" role="radiogroup" aria-label={t('enrollment.core.ed.approach')}>
          {approaches.map(({ value: m, icon: Icon, title, desc }) => {
            const on = value.mode === m
            return (
              <button key={m} type="button" role="radio" aria-checked={on} onClick={() => setMode(m)} className={cn('flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors', on ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30' : 'border-slate-200 hover:border-slate-300 dark:border-gray-700')}>
                <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', on ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-gray-800')}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium text-slate-900 dark:text-white">{title}</span>
                  <span className={hint}>{desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      </Field>

      {value.mode === 'risk_style' && (
        <Field title={t('enrollment.core.ed.risk')}>
          <Segmented size="sm" label={t('enrollment.core.ed.risk')} value={value.risk} onChange={(r) => onChange({ ...value, risk: r })} options={RISKS.map((r) => ({ value: r, label: t(`enrollment.investment.level_${r}`) }))} />
        </Field>
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
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: FUND_COLORS[i % FUND_COLORS.length] }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">{meta?.name ?? r.ticker}</span>
                  <span className="text-[12px] text-slate-500">{r.ticker} · {meta?.expense}</span>
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
        <p className={cn(hint, 'mt-2')}>{t('enrollment.core.ed.fee_line', { fee: blendedFee(rows).toFixed(2) })}</p>
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
                    <span className="text-[12px] text-slate-500">{c.ticker} · {c.assetClass} · {c.expense}</span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Field>
      )}

      <div className="space-y-4 border-t border-slate-100 pt-5 dark:border-gray-800">
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
        <button type="button" onClick={onViewAll} className="text-[13px] font-medium text-blue-700 hover:underline dark:text-blue-300">
          {t('plan.inv.view_funds')}
        </button>
      </div>
    </div>
  )
}
