import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Pencil, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useProfileStore } from '@/features/profile/profileStore'
import { computeContributionLimits } from '@/features/contributions/limits'
import { useElectionsStore } from './electionsStore'
import {
  CYCLES, PERIODS, PLAN_RULES, SOURCES, nextIncreaseDate,
  type AutoIncrease, type Cycle, type Deferral, type SourceKey, type Unit,
} from './electionsData'

const fieldCls = 'h-10 w-full rounded-md border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white'

export function DeferralPanel() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const now = useNow()
  const elections = useElectionsStore()
  const salary = useEnrollmentDraftStore((s) => s.draftData.savings?.salary ?? s.draftData.personalization?.salary) ?? 85_000
  const age = useEnrollmentDraftStore((s) => s.draftData.personalization?.currentAge) ?? 35
  const frequency = useProfileStore((s) => s.employment.payrollFrequency)
  const periods = PERIODS[frequency] ?? 12

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [d, setD] = useState<Deferral>(elections.deferral)
  const [a, setA] = useState<AutoIncrease>(elections.autoIncrease)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fmtDate = (dt: Date) => dt.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
  const money = (v: number) => `$${v.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: v % 1 ? 2 : 0 })}`

  const toPercent = (def: Deferral, key: SourceKey) => (def.unit === 'percent' ? def[key] : (def[key] * periods * 100) / salary)
  const view = elections.deferral
  const viewTotalPct = toPercent(view, 'preTax') + toPercent(view, 'roth')

  const startEdit = () => {
    setD(elections.deferral)
    setA(elections.autoIncrease)
    setErrors({})
    setSaved(false)
    setEditing(true)
  }

  const draftPct = { preTax: toPercent(d, 'preTax'), roth: toPercent(d, 'roth') }
  const draftTotalPct = draftPct.preTax + draftPct.roth
  const limits = useMemo(() => computeContributionLimits({ salary, contributionPercent: draftTotalPct, age }), [salary, draftTotalPct, age])

  const setUnit = (unit: Unit) => {
    if (unit === d.unit) return
    // Convert the entered values so switching units doesn't change what the participant has chosen.
    const conv = (v: number) => (unit === 'dollar' ? Math.round(((v / 100) * salary) / periods * 100) / 100 : Math.round(((v * periods * 100) / salary) * 100) / 100)
    setD({ ...d, unit, preTax: conv(d.preTax), roth: conv(d.roth), usePlanRate: false })
  }
  const usePlanRate = () => {
    const base = PLAN_RULES.defaultRate
    const conv = (v: number) => (d.unit === 'dollar' ? Math.round(((v / 100) * salary) / periods * 100) / 100 : v)
    setD({ ...d, usePlanRate: true, preTax: conv(base.preTax), roth: conv(base.roth) })
  }
  const setRate = (key: SourceKey, raw: string) => setD({ ...d, usePlanRate: false, [key]: raw === '' ? 0 : Math.max(0, Number(raw)) })

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (draftTotalPct <= 0) e.total = t('plan.def.err_zero')
    else if (draftTotalPct > PLAN_RULES.maxTotalPercent) e.total = t('plan.def.err_max', { max: PLAN_RULES.maxTotalPercent })
    if (a.enabled) {
      for (const k of SOURCES) {
        const amount = a.amount[k]
        const cap = a.cap[k]
        if (!(amount > 0) || amount > PLAN_RULES.autoIncrementMax) e[`amount_${k}`] = t('plan.def.err_increment', { max: PLAN_RULES.autoIncrementMax })
        const current = a.sourceWise ? draftPct[k] : Math.max(draftPct.preTax, draftPct.roth)
        if (!(cap > current) || cap > PLAN_RULES.maxTotalPercent) e[`cap_${k}`] = t('plan.def.err_cap', { max: PLAN_RULES.maxTotalPercent })
        if (!a.sourceWise) break // one value applies to all sources; validate once
      }
    }
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    const finalA: AutoIncrease = a.sourceWise ? a : { ...a, amount: { preTax: a.amount.preTax, roth: a.amount.preTax }, cap: { preTax: a.cap.preTax, roth: a.cap.preTax } }
    const old = elections.deferral
    const deferralChanged = old.unit !== d.unit || old.preTax !== d.preTax || old.roth !== d.roth
    const autoChanged = JSON.stringify(elections.autoIncrease) !== JSON.stringify(finalA)
    elections.saveDeferral(d, finalA, { deferral: deferralChanged, auto: autoChanged })
    setEditing(false)
    setSaved(true)
  }

  const inv = (k: string) => ({ 'aria-invalid': errors[k] ? (true as const) : undefined, 'aria-describedby': errors[k] ? `err-${k}` : undefined })
  const errMsg = (k: string) => (errors[k] ? <p id={`err-${k}`} className="mt-1 text-xs text-red-600">{errors[k]}</p> : null)
  const enrolledAt = elections.enrolledAt
  const cycleLabel = (c: Cycle) => ({ title: t(`plan.def.cycle_${c}`), rule: t(`plan.def.cycle_${c}_rule`), next: t('plan.def.next_date', { date: fmtDate(nextIncreaseDate(c, now, enrolledAt)) }) })

  // ── View mode ──
  if (!editing) {
    const ai = elections.autoIncrease
    return (
      <div className="space-y-4">
        {saved && (
          <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> {t('profile.d.saved')}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('plan.def.title')}</h3>
          <button type="button" onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
            <Pencil className="h-3.5 w-3.5" aria-hidden /> {t('profile.d.edit')}
          </button>
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          {SOURCES.map((k) => (
            <div key={k}>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t(`plan.src_${k}`)}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {view.unit === 'percent' ? `${view[k]}%` : `${money(view[k])}`}
                {view.unit === 'dollar' && <span className="ml-1 text-xs font-normal text-gray-500">{t('plan.def.per_paycheck')}</span>}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('plan.def.total')}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{Math.round(viewTotalPct * 100) / 100}%</dd>
          </div>
        </dl>

        <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('plan.def.auto_title')}</h4>
          {!ai.enabled ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('plan.def.auto_off')}</p>
          ) : (
            <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{t('plan.def.cycle')}</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {t(`plan.def.cycle_${ai.cycle}`)} · {t('plan.def.next_date', { date: fmtDate(nextIncreaseDate(ai.cycle, now, enrolledAt)) })}
                </dd>
              </div>
              {SOURCES.map((k) => (
                <div key={k}>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{t(`plan.src_${k}`)}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{t('plan.def.increase_until', { amount: ai.amount[k], cap: ai.cap[k] })}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    )
  }

  // ── Edit mode ──
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('plan.def.edit_title')}</h3>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900 dark:text-white">{t('plan.def.by_source')}</legend>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" aria-pressed={d.usePlanRate} onClick={usePlanRate} className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors', d.usePlanRate ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800')}>
            {t('plan.def.use_plan_rate')}
          </button>
          <div role="radiogroup" aria-label={t('plan.def.unit')} className="inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
            {(['percent', 'dollar'] as const).map((u) => (
              <button key={u} type="button" role="radio" aria-checked={d.unit === u} onClick={() => setUnit(u)} className={cn('px-3.5 py-1.5 text-sm font-semibold transition-colors', d.unit === u ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800')}>
                {u === 'percent' ? '%' : '$'}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setD(elections.deferral); setErrors({}) }} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {t('plan.def.reset')}
          </button>
        </div>

        {SOURCES.map((k) => (
          <div key={k}>
            <label htmlFor={`def-${k}`} className="text-sm font-medium text-gray-900 dark:text-white">{t(`plan.src_${k}`)}</label>
            <p className="mb-1.5 mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{t(`plan.def.explain_${k}`)}</p>
            <div className="relative max-w-[12rem]">
              {d.unit === 'dollar' && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>}
              <input
                id={`def-${k}`}
                type="number"
                inputMode="decimal"
                min={0}
                step={d.unit === 'percent' ? 0.5 : 1}
                value={d[k]}
                disabled={d.usePlanRate}
                onChange={(e) => setRate(k, e.target.value)}
                className={cn(fieldCls, 'border-gray-200 disabled:opacity-60 dark:border-gray-700', d.unit === 'dollar' ? 'pl-7 pr-3' : 'pr-8')}
              />
              {d.unit === 'percent' && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>}
            </div>
          </div>
        ))}

        <div role="status" className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60" {...inv('total')}>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('plan.def.total')}:{' '}
            <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
              {d.unit === 'percent' ? `${Math.round(draftTotalPct * 100) / 100}%` : `${money(d.preTax + d.roth)} ${t('plan.def.per_paycheck')} (≈ ${Math.round(draftTotalPct * 100) / 100}%)`}
            </span>
          </p>
          {errMsg('total')}
          {limits.reachesLimit && draftTotalPct > 0 && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('plan.def.limit_warning', { year: limits.year, limit: `$${limits.employeeLimit.toLocaleString(locale)}` })}
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900 dark:text-white">{t('plan.def.auto_title')}</legend>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('plan.def.auto_sub')}</p>
        <div role="radiogroup" aria-label={t('plan.def.auto_title')} className="grid gap-2 sm:grid-cols-2">
          {([true, false] as const).map((on) => (
            <button key={String(on)} type="button" role="radio" aria-checked={a.enabled === on} onClick={() => setA({ ...a, enabled: on })} className={cn('rounded-xl border-2 p-3 text-left transition-colors', a.enabled === on ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700')}>
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t(on ? 'plan.def.auto_use' : 'plan.def.auto_dont')}</span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{t(on ? 'plan.def.auto_use_sub' : 'plan.def.auto_dont_sub')}</span>
            </button>
          ))}
        </div>

        {a.enabled && (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('plan.def.cycle')}</p>
              <div role="radiogroup" aria-label={t('plan.def.cycle')} className="grid gap-2 sm:grid-cols-3">
                {CYCLES.map((c) => {
                  const l = cycleLabel(c)
                  return (
                    <button key={c} type="button" role="radio" aria-checked={a.cycle === c} onClick={() => setA({ ...a, cycle: c })} className={cn('rounded-xl border-2 p-3 text-left transition-colors', a.cycle === c ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700')}>
                      <span className="block text-sm font-semibold text-gray-900 dark:text-white">{l.title}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{l.rule}</span>
                      <span className="mt-1 block text-xs font-medium text-blue-700 dark:text-blue-300">{l.next}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-800 dark:text-gray-200">
              <input type="checkbox" checked={a.sourceWise} onChange={(e) => setA({ ...a, sourceWise: e.target.checked })} className="h-4 w-4 rounded accent-blue-600" />
              {t('plan.def.source_wise')}
            </label>
            {!a.sourceWise && <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">{t('plan.def.applies_all')}</p>}

            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">{t('plan.def.source')}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{t('plan.def.increment')}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{t('plan.def.max_limit')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(a.sourceWise ? SOURCES : (['preTax'] as SourceKey[])).map((k) => (
                    <tr key={k}>
                      <td className="px-3 py-3 align-top">
                        <p className="font-medium text-gray-900 dark:text-white">{a.sourceWise ? t(`plan.src_${k}`) : t('plan.def.all_sources')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('plan.def.now_next', {
                            now: Math.round((a.sourceWise ? draftPct[k] : draftPct.preTax) * 100) / 100,
                            next: Math.round(Math.min((a.sourceWise ? draftPct[k] : draftPct.preTax) + a.amount[k], a.cap[k]) * 100) / 100,
                            date: fmtDate(nextIncreaseDate(a.cycle, now, enrolledAt)),
                          })}
                        </p>
                      </td>
                      {(['amount', 'cap'] as const).map((f) => (
                        <td key={f} className="px-3 py-3 align-top">
                          <div className="relative w-28">
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step={0.5}
                              aria-label={`${t(`plan.src_${k}`)} ${t(f === 'amount' ? 'plan.def.increment' : 'plan.def.max_limit')}`}
                              value={a[f][k]}
                              onChange={(e) => setA({ ...a, [f]: { ...a[f], [k]: e.target.value === '' ? 0 : Number(e.target.value) } })}
                              className={cn(fieldCls, 'pr-7', errors[`${f}_${k}`] ? 'border-red-500' : 'border-gray-200 dark:border-gray-700')}
                              {...inv(`${f}_${k}`)}
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                          </div>
                          {errMsg(`${f}_${k}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </fieldset>

      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('profile.d.cancel')}</button>
        <button type="submit" className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">{t('profile.d.save')}</button>
      </div>
    </form>
  )
}
