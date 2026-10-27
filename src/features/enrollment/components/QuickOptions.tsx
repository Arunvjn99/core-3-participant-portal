import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { TermInfo } from '@/features/learning/TermInfo'
import type { TermId } from '@/features/learning/glossary'
import { SDB_FUNDS } from '@/features/plan/sdbFunds'
import { SdbMeta } from '@/features/plan/PlanFundsTable'
import { CYCLES, nextIncreaseDate, type Cycle, type InvestMode, type SourceKey, type Unit } from '@/features/plan/electionsData'

/** Optional settings from the full flow, shown inside the section they belong to. */

export interface AutoTiming {
  cycle: Cycle
  sourceWise: boolean
  rothAmount: number
  rothCap: number
}

const fieldCls =
  'h-9 w-24 rounded-md border border-gray-200 bg-transparent px-2 text-right text-[0.85rem] font-semibold tabular-nums text-gray-900 [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

const linkCls = 'text-[0.8rem] font-medium text-blue-600 hover:underline dark:text-blue-400'

function Check({ checked, onChange, title, sub, info }: { checked: boolean; onChange: (v: boolean) => void; title: string; sub?: string; info?: TermId }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-gray-300 accent-blue-600" />
      <span>
        <span className="block text-gray-900 dark:text-white" style={{ fontSize: '0.86rem', fontWeight: 500 }}>
          {title}
          {info && <> <TermInfo term={info} /></>}
        </span>
        {sub && <span className="block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>{sub}</span>}
      </span>
    </label>
  )
}

function NumberField({ value, onChange, label, suffix, prefix, min, max, step = 1 }: {
  value: number; onChange: (v: number) => void; label: string; suffix?: string; prefix?: string; min: number; max: number; step?: number
}) {
  return (
    <span className="relative inline-block shrink-0">
      {prefix && <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[0.8rem] text-gray-400">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => {
          const n = parseFloat(e.target.value)
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)))
        }}
        className={cn(fieldCls, prefix && 'pl-5', suffix && 'pr-6')}
      />
      {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[0.75rem] text-gray-400">{suffix}</span>}
    </span>
  )
}

/** A link-style toggle that reveals extra controls in place. */
function Disclosure({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={cn(linkCls, 'inline-flex items-center gap-1')}>
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div id={id} className="mt-3">
          {children}
        </div>
      )}
    </div>
  )
}

/** Contribution: exact rate per source, in % of pay or dollars per paycheck, or the plan's default rate. */
export function ExactAmounts(p: {
  unit: Unit
  onUnit: (u: Unit) => void
  /** Dollars per paycheck for each 1% of pay */
  paycheckPerPct: number
  sourceRates: Record<SourceKey, number>
  onSourceRate: (key: SourceKey, pct: number) => void
  planRate: Record<SourceKey, number>
  onUsePlanRate: () => void
  maxRate: number
}) {
  const { t } = useTranslation()
  const dollars = p.unit === 'dollar'
  return (
    <Disclosure id="quick-exact" label={t('enrollment.quick.exact_toggle')}>
      <p className="mb-3 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>{t('enrollment.quick.exact_sub')}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label={t('plan.def.unit')} className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          {(['percent', 'dollar'] as const).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={p.unit === u}
              onClick={() => p.onUnit(u)}
              className={cn('rounded-md px-3 py-1.5 text-[0.8rem] font-medium', p.unit === u ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300')}
            >
              {t(`enrollment.quick.unit_${u}`)}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1">
          <button type="button" onClick={p.onUsePlanRate} className={linkCls}>
            {t('plan.def.use_plan_rate')} ({p.planRate.preTax + p.planRate.roth}%)
          </button>
          <TermInfo term="plan_deferral_rate" />
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {(['preTax', 'roth'] as const).map((k) => (
          <div key={k} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
            <span className="min-w-0">
              <span className="block text-gray-900 dark:text-white" style={{ fontSize: '0.84rem', fontWeight: 500 }}>{t(`plan.src_${k}`)}</span>
              <span className="block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.72rem', lineHeight: 1.35 }}>{t(`plan.def.explain_${k}`)}</span>
            </span>
            <NumberField
              value={dollars ? Math.round(p.sourceRates[k] * p.paycheckPerPct * 100) / 100 : p.sourceRates[k]}
              onChange={(v) => p.onSourceRate(k, dollars ? v / p.paycheckPerPct : v)}
              label={`${t(`plan.src_${k}`)} ${dollars ? t('plan.def.per_paycheck') : '%'}`}
              prefix={dollars ? '$' : undefined}
              suffix={dollars ? undefined : '%'}
              min={0}
              max={dollars ? Math.round(p.maxRate * p.paycheckPerPct) : p.maxRate}
              step={dollars ? 1 : 0.5}
            />
          </div>
        ))}
      </div>
    </Disclosure>
  )
}

/** Auto-increase: when increases happen, and optionally a different increase and cap per source. */
export function AutoIncreaseTiming(p: {
  now: number
  timing: AutoTiming
  onTiming: (patch: Partial<AutoTiming>) => void
  auto: { amount: number; max: number }
  onAuto: (patch: { amount?: number; max?: number }) => void
  bothSources: boolean
  capRange: readonly [number, number]
}) {
  const { t } = useTranslation()
  const fmtDate = (d: Date) => d.toLocaleDateString(getAppDateLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
  const row = (k: SourceKey, amount: number, cap: number, set: (patch: { amount?: number; max?: number }) => void) => (
    <tr key={k}>
      <td className="px-3 py-2 text-gray-900 dark:text-white">{t(`plan.src_${k}`)}</td>
      <td className="px-3 py-2 text-right">
        <NumberField value={amount} onChange={(v) => set({ amount: v })} label={`${t(`plan.src_${k}`)} ${t('plan.def.increment')}`} suffix="%" min={1} max={10} step={0.5} />
      </td>
      <td className="px-3 py-2 text-right">
        <NumberField value={cap} onChange={(v) => set({ max: v })} label={`${t(`plan.src_${k}`)} ${t('plan.def.max_limit')}`} suffix="%" min={p.capRange[0]} max={p.capRange[1]} />
      </td>
    </tr>
  )

  return (
    <div className="mt-4">
      <p className="mb-2 text-gray-900 dark:text-white" style={{ fontSize: '0.84rem', fontWeight: 500 }}>{t('enrollment.quick.when_title')} <TermInfo term="increment_cycle" /></p>
      <div role="radiogroup" aria-label={t('plan.def.cycle')} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {CYCLES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={p.timing.cycle === c}
            onClick={() => p.onTiming({ cycle: c })}
            className={cn('rounded-lg border-2 p-2.5 text-left', p.timing.cycle === c ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700')}
          >
            <span className="block text-gray-900 dark:text-white" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t(`plan.def.cycle_${c}_rule`)}</span>
            <span className="block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>{t(`plan.def.cycle_${c}`)}</span>
            <span className="mt-0.5 block text-gray-400" style={{ fontSize: '0.7rem' }}>{t('plan.def.next_date', { date: fmtDate(nextIncreaseDate(c, p.now, p.now)) })}</span>
          </button>
        ))}
      </div>

      {p.bothSources && (
        <div className="mt-3">
          <Check checked={p.timing.sourceWise} onChange={(v) => p.onTiming({ sourceWise: v })} title={t('enrollment.quick.source_wise')} info="sources" />
          {p.timing.sourceWise && (
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr className="bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th className="px-3 py-2 font-semibold">{t('plan.def.source')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('plan.def.increment')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('plan.def.max_limit')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {row('preTax', p.auto.amount, p.auto.max, p.onAuto)}
                  {row('roth', p.timing.rothAmount, p.timing.rothCap, (x) => p.onTiming({ ...(x.amount !== undefined && { rothAmount: x.amount }), ...(x.max !== undefined && { rothCap: x.max }) }))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const MODES: InvestMode[] = ['risk_style', 'plan_selected', 'own']

/** Investments: the first choice is how to invest; everything below follows from it. */
export function InvestModePicker({ mode, onMode }: { mode: InvestMode; onMode: (m: InvestMode) => void }) {
  const { t } = useTranslation()
  return (
    <>
      <p className="mb-2 text-gray-900 dark:text-white" style={{ fontSize: '0.84rem', fontWeight: 500 }}>
        {t('enrollment.quick.mode_title')} <TermInfo term="invest_mode" />
      </p>
      <div role="radiogroup" aria-label={t('enrollment.quick.mode_title')} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => onMode(m)}
            className={cn(
              'rounded-xl border-2 p-3 text-left transition-colors',
              mode === m ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
            )}
          >
            {m === 'risk_style' && (
              <span className="mb-1 inline-block rounded-full bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-300" style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                {t('enrollment.quick.recommended')}
              </span>
            )}
            <span className={cn('block', mode === m ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white')} style={{ fontSize: '0.86rem', fontWeight: 600 }}>
              {t(`enrollment.quick.mode_${m}`)}
            </span>
            <span className="mt-0.5 block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.74rem', lineHeight: 1.35 }}>{t(`enrollment.quick.mode_${m}_sub`)}</span>
          </button>
        ))}
      </div>
    </>
  )
}

/** Investments: auto rebalance and Self-Directed Brokerage, both off by default. Opting in to SDB lists its investments. */
export function InvestExtras(p: {
  autoRebalance: boolean
  onAutoRebalance: (v: boolean) => void
  sdb: boolean
  onSdb: (v: boolean) => void
  /** Tickers already in the allocation */
  selected: string[]
  onAddSdbFund: (ticker: string) => void
  trackSeparately: boolean
  onTrackSeparately: (v: boolean) => void
  bothSources: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
      <Check checked={p.autoRebalance} onChange={p.onAutoRebalance} title={t('plan.inv.auto_rebalance')} sub={t('plan.inv.auto_rebalance_sub')} info="auto_rebalance" />
      <Check checked={p.sdb} onChange={p.onSdb} title={t('plan.inv.sdb')} sub={t('plan.inv.sdb_sub')} info="sdb" />
      {p.sdb && (
        <div className="ml-8 space-y-3">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" style={{ fontSize: '0.74rem' }}>
            {t('plan.sdb_funds.note')}
          </p>

          {p.bothSources && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-800 dark:text-gray-200" style={{ fontSize: '0.8rem' }}>{t('plan.sdb_funds.track')}</span>
              <div role="radiogroup" aria-label={t('plan.sdb_funds.track')} className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
                {([true, false] as const).map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    role="radio"
                    aria-checked={p.trackSeparately === v}
                    onClick={() => p.onTrackSeparately(v)}
                    className={cn('rounded-md px-3 py-1 text-[0.78rem] font-medium', p.trackSeparately === v ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300')}
                  >
                    {t(v ? 'plan.sdb_funds.yes' : 'plan.sdb_funds.no')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-gray-900 dark:text-white" style={{ fontSize: '0.84rem', fontWeight: 600 }}>{t('plan.sdb_funds.title')}</p>
            <p className="mb-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.74rem' }}>{t('plan.sdb_funds.sub')}</p>
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
              {SDB_FUNDS.map((f) => {
                const added = p.selected.includes(f.ticker)
                return (
                  <li key={f.ticker} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-gray-900 dark:text-white" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{f.name}</span>
                      <SdbMeta f={f} />
                      <span className="mt-0.5 block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.72rem' }}>
                        {t('plan.sdb_funds.stats', { y1: f.returns.y1.toFixed(2), er: f.expenseRatioPct.toFixed(2) })}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => p.onAddSdbFund(f.ticker)}
                      aria-label={`${t(added ? 'plan.sdb_funds.added' : 'plan.sdb_funds.add')}: ${f.name}`}
                      className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1 text-[0.78rem] font-medium text-blue-600 hover:bg-blue-50 disabled:border-transparent disabled:text-green-700 disabled:hover:bg-transparent dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:disabled:text-green-400"
                    >
                      {t(added ? 'plan.sdb_funds.added' : 'plan.sdb_funds.add')}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
