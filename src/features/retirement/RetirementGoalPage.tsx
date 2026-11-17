import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { Modal } from '@/design-system/components/Modal'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useProfileStore } from '@/features/profile/profileStore'
import { ageFrom } from '@/features/profile/profileData'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PLANS } from '@/features/portfolio/portfolioData'
import { runModel, stateTaxRate, US_STATES } from './retirementModel'
import { useRetirementGoal } from './retirementStore'

const field = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:ring-blue-400/30'
/** The pre-enrollment dashboard's pieces: card surface, pills, labels, and one focus ring for every control */
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const CARD = 'rounded-[20px] bg-surface-card shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 dark:ring-white/10'
const PILL_PRIMARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-[14px] font-semibold text-white shadow-[0_6px_14px_-8px_rgba(37,99,235,0.5)] transition-[filter] hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] ${FOCUS}`
const PILL_SECONDARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-slate-900 shadow-[0_2px_6px_-3px_rgba(11,21,51,0.12)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10 ${FOCUS}`
const LABEL = 'mb-1.5 block text-[14px] font-semibold text-text-primary'
const HINT = 'mt-1.5 text-[12px] leading-snug text-slate-600 dark:text-slate-300'
const ERROR = 'mt-1.5 text-[12px] font-medium text-red-700 dark:text-red-300'

const parseMoney = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0

function Ring({ pct, label }: { pct: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const stroke = pct >= 80 ? '#4DAF7A' : pct >= 60 ? '#E2AE55' : '#DE7F7F'
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/10" strokeWidth="11" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={stroke} strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)} transform="rotate(-90 60 60)" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[30px] font-medium tabular-nums text-text-primary">{pct}%</span>
    </div>
  )
}

export default function RetirementGoalPage() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const now = useNow()
  const goal = useRetirementGoal()
  const elections = useElectionsStore()
  const mergeDraft = useEnrollmentDraftStore((s) => s.mergeDraftSection)
  const salarySaved = useEnrollmentDraftStore((s) => s.draftData.savings?.salary ?? s.draftData.personalization?.salary) ?? 85_000
  const dob = useProfileStore((s) => s.personal.dob)
  const currentAge = ageFrom(dob, now)?.years ?? 38

  const [location, setLocation] = useState(goal.location)
  const [retirementAge, setRetirementAge] = useState(goal.retirementAge)
  const [monthly, setMonthly] = useState(String(goal.monthlySpending))
  const [salary, setSalary] = useState(String(salarySaved))
  const [outside, setOutside] = useState(String(goal.outsideSavings))
  const [planId, setPlanId] = useState(PLANS[0].id)
  const [preTax, setPreTax] = useState(elections.deferral.unit === 'percent' ? elections.deferral.preTax : Math.round(((elections.deferral.preTax * 12 * 100) / salarySaved) * 10) / 10)
  const [roth, setRoth] = useState(elections.deferral.unit === 'percent' ? elections.deferral.roth : Math.round(((elections.deferral.roth * 12 * 100) / salarySaved) * 10) / 10)
  const [auto, setAuto] = useState(elections.autoIncrease.enabled)
  const [disclaimer, setDisclaimer] = useState(false)
  const [saved, setSaved] = useState(false)

  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]

  const result = useMemo(
    () =>
      runModel({
        currentAge,
        retirementAge,
        salary: parseMoney(salary),
        monthlySpending: parseMoney(monthly),
        outsideSavings: parseMoney(outside),
        balance: plan.balance,
        preTaxPct: preTax,
        rothPct: roth,
        autoIncrease: { enabled: auto, amount: elections.autoIncrease.amount.preTax, cap: elections.autoIncrease.cap.preTax },
        state: location,
      }),
    [currentAge, retirementAge, salary, monthly, outside, plan.balance, preTax, roth, auto, location, elections.autoIncrease],
  )

  const errors = {
    monthly: parseMoney(monthly) <= 0 ? t('retirement.err_amount') : '',
    salary: parseMoney(salary) <= 0 ? t('retirement.err_amount') : '',
    age: retirementAge <= currentAge ? t('retirement.err_age', { age: currentAge }) : '',
    rates: preTax + roth > 75 ? t('plan.def.err_max', { max: 75 }) : '',
  }
  const valid = !Object.values(errors).some(Boolean)

  const cancel = () => {
    setLocation(goal.location)
    setRetirementAge(goal.retirementAge)
    setMonthly(String(goal.monthlySpending))
    setSalary(String(salarySaved))
    setOutside(String(goal.outsideSavings))
    setPreTax(elections.deferral.preTax)
    setRoth(elections.deferral.roth)
    setAuto(elections.autoIncrease.enabled)
    setSaved(false)
  }

  const update = () => {
    if (!valid) return
    goal.save({ location, retirementAge, monthlySpending: parseMoney(monthly), outsideSavings: parseMoney(outside) })
    mergeDraft('savings', { salary: parseMoney(salary) })
    const nextDeferral = { unit: 'percent' as const, preTax, roth, usePlanRate: false }
    const nextAuto = { ...elections.autoIncrease, enabled: auto }
    const changedDef = elections.deferral.unit !== 'percent' || elections.deferral.preTax !== preTax || elections.deferral.roth !== roth
    const changedAuto = elections.autoIncrease.enabled !== auto
    if (changedDef || changedAuto) elections.saveDeferral(nextDeferral, nextAuto, { deferral: changedDef, auto: changedAuto })
    setSaved(true)
  }

  const taxRate = stateTaxRate(location)
  const slider = (value: number, set: (v: number) => void, label: string) => (
    <div className="mt-2.5 flex items-center gap-3">
      <input type="range" min={0} max={30} step={0.5} value={value} onChange={(e) => { set(Number(e.target.value)); setSaved(false) }} aria-label={label} className={cn('h-2 flex-1 cursor-pointer rounded-full accent-[var(--color-primary)]', FOCUS)} />
      <span className="relative w-24">
        <input type="number" inputMode="decimal" min={0} max={75} step={0.5} value={value} onChange={(e) => { set(Math.max(0, Number(e.target.value) || 0)); setSaved(false) }} aria-label={label} className={cn(field, 'pr-8 text-right tabular-nums')} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-500 dark:text-slate-400">%</span>
      </span>
    </div>
  )

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6 lg:py-7">
        <Link to="/post-enrollment-dashboard" className={cn('mb-3 inline-flex min-h-10 items-center gap-1.5 rounded-md text-[14px] font-semibold text-slate-600 transition-colors hover:text-text-primary dark:text-slate-300 dark:hover:text-white', FOCUS)}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> {t('retirement.back')}
        </Link>
        <header className="mb-5">
          <h1 className="text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{t('retirement.title')}</h1>
          <p className="mt-1 text-[15px] leading-snug text-text-secondary">{t('retirement.subtitle')}</p>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-5">
          <section className={cn(CARD, 'p-5 sm:p-6 lg:col-span-2')} aria-live="polite">
            <div className="flex items-center gap-4">
              <Ring pct={result.readinessPct} label={t('retirement.of_goal', { pct: result.readinessPct })} />
              <div className="min-w-0">
                <p className="text-[16px] font-bold leading-snug text-text-primary">{result.readinessPct >= 80 ? t('retirement.goal_reached') : t('retirement.goal_gap')}</p>
                <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300">{t('retirement.of_goal_short')}</p>
              </div>
            </div>
            <dl className="mt-5 divide-y divide-slate-200/80 border-y border-slate-200/80 text-[14px] dark:divide-white/10 dark:border-white/10">
              {[
                ['expected_expense', money(result.expectedExpense), ''],
                ['all_income', money(result.allIncome), 'text-emerald-800 dark:text-emerald-300'],
                ['shortfall', money(result.shortfall), result.shortfall > 0 ? 'text-red-700 dark:text-red-300' : ''],
              ].map(([k, v, cls]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-slate-600 dark:text-slate-300">{t(`retirement.${k}`)}</dt>
                  <dd className={cn('font-semibold tabular-nums text-text-primary', cls)}>{v}</dd>
                </div>
              ))}
            </dl>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 text-[14px]">
              <div><dt className="text-[12px] text-slate-600 dark:text-slate-300">{t('retirement.age_label')}</dt><dd className="mt-0.5 font-semibold tabular-nums text-text-primary">{retirementAge}</dd></div>
              <div><dt className="text-[12px] text-slate-600 dark:text-slate-300">{t('retirement.years_remaining')}</dt><dd className="mt-0.5 font-semibold tabular-nums text-text-primary">{result.yearsRemaining}</dd></div>
              <div><dt className="text-[12px] text-slate-600 dark:text-slate-300">{t('retirement.deferrals')}</dt><dd className="mt-0.5 font-semibold text-text-primary">{t('retirement.pct_of_pay', { pct: preTax + roth })}</dd></div>
              <div><dt className="text-[12px] text-slate-600 dark:text-slate-300">{t('plan.def.auto_title')}</dt><dd className="mt-0.5 font-semibold text-text-primary">{auto ? t('plan.inv.on') : t('plan.inv.off')}</dd></div>
            </dl>
            <p className="mt-5 border-t border-slate-200/80 pt-4 text-[12px] leading-snug text-slate-600 dark:border-white/10 dark:text-slate-300">
              {t('retirement.not_guaranteed')}{' '}
              <button type="button" onClick={() => setDisclaimer(true)} className={cn('rounded font-semibold text-primary underline underline-offset-2 dark:text-blue-300', FOCUS)}>{t('retirement.disclaimer')}</button>
            </p>
          </section>

          <section className={cn(CARD, 'p-5 sm:p-6 lg:col-span-3')}>
            <form noValidate onSubmit={(e) => { e.preventDefault(); update() }} className="space-y-5">
              <h2 className="text-[18px] font-bold leading-tight text-text-primary">{t('retirement.target')}</h2>

              <div>
                <label htmlFor="rg-location" className={LABEL}>{t('retirement.location')}</label>
                <select id="rg-location" value={location} onChange={(e) => { setLocation(e.target.value); setSaved(false) }} className={field}>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className={HINT}>{t('retirement.location_hint')} {taxRate === 0 ? t('retirement.no_state_tax') : t('retirement.state_tax_est', { pct: Math.round(taxRate * 100) })}</p>
              </div>

              <div>
                <p className={LABEL} id="rg-age-label">{t('retirement.planned_age')}</p>
                <div className="flex items-center gap-3" role="group" aria-labelledby="rg-age-label">
                  <button type="button" onClick={() => { setRetirementAge((a) => Math.max(currentAge + 1, a - 1)); setSaved(false) }} aria-label={t('enrollment.quick.decrease')} className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10', FOCUS)}><Minus className="h-4 w-4" aria-hidden /></button>
                  <span className="w-12 text-center text-[20px] font-bold tabular-nums text-text-primary" aria-live="polite">{retirementAge}</span>
                  <button type="button" onClick={() => { setRetirementAge((a) => Math.min(80, a + 1)); setSaved(false) }} aria-label={t('enrollment.quick.increase')} className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10', FOCUS)}><Plus className="h-4 w-4" aria-hidden /></button>
                  <span className="text-[13px] text-slate-600 dark:text-slate-300">{t('retirement.years_from_now', { years: result.yearsRemaining })}</span>
                </div>
                {errors.age && <p role="alert" className={ERROR}>{errors.age}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ['rg-monthly', t('retirement.monthly_spending'), monthly, setMonthly, errors.monthly, t('retirement.spending_hint', { amount: money(parseMoney(monthly) * 12) })],
                  ['rg-salary', t('retirement.annual_salary'), salary, setSalary, errors.salary, t('retirement.salary_hint')],
                  ['rg-outside', t('retirement.outside_savings'), outside, setOutside, '', t('retirement.outside_hint')],
                ] as const).map(([id, label, value, set, err, hint]) => (
                  <div key={id} className={id === 'rg-outside' ? 'sm:col-span-2' : ''}>
                    <label htmlFor={id} className={LABEL}>{label}</label>
                    <span className="relative block">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-slate-500 dark:text-slate-400">$</span>
                      <input id={id} inputMode="numeric" value={Number(value || 0).toLocaleString(locale)} aria-invalid={err ? true : undefined} onChange={(e) => { set(String(parseMoney(e.target.value))); setSaved(false) }} className={cn(field, 'pl-7 tabular-nums', err && 'border-red-500 focus:border-red-500 focus:ring-red-200')} />
                    </span>
                    {err ? <p role="alert" className={ERROR}>{err}</p> : <p className={HINT}>{hint}</p>}
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="rg-plan" className={LABEL}>{t('retirement.plan')}</label>
                <select id="rg-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className={field}>
                  {PLANS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <fieldset className="space-y-5 border-t border-slate-200/80 pt-5 dark:border-white/10">
                <legend className="float-left mb-1 w-full text-[16px] font-bold text-text-primary">{t('plan.def.title')}</legend>
                <div className="clear-left">
                  <p className="text-[14px] font-semibold text-text-primary">{t('retirement.pretax_deferral')}</p>
                  <p className="mt-0.5 text-[12px] text-slate-600 dark:text-slate-300">{t('retirement.pretax_hint')}</p>
                  {slider(preTax, setPreTax, t('retirement.pretax_deferral'))}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">{t('retirement.roth_deferral')}</p>
                  <p className="mt-0.5 text-[12px] text-slate-600 dark:text-slate-300">{t('retirement.roth_hint')}</p>
                  {slider(roth, setRoth, t('retirement.roth_deferral'))}
                </div>
                {errors.rates && <p role="alert" className={ERROR}>{errors.rates}</p>}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/70 dark:bg-white/5 dark:ring-white/10">
                  <input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); setSaved(false) }} className={cn('mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--color-primary)]', FOCUS)} />
                  <span>
                    <span className="block text-[14px] font-semibold text-text-primary">{t('plan.def.auto_title')} · {auto ? t('plan.inv.on') : t('plan.inv.off')}</span>
                    <span className="mt-0.5 block text-[12px] text-slate-600 dark:text-slate-300">{t('retirement.auto_hint', { amount: elections.autoIncrease.amount.preTax, cap: elections.autoIncrease.cap.preTax })}</span>
                  </span>
                </label>
              </fieldset>

              {saved && (
                <p role="status" className="flex items-center gap-1.5 text-[14px] font-semibold text-emerald-800 dark:text-emerald-300">
                  <Check className="h-4 w-4" aria-hidden />
                  {t('retirement.saved')}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
                <button type="button" onClick={cancel} className={PILL_SECONDARY}>{t('profile.d.cancel')}</button>
                <button type="submit" disabled={!valid} className={PILL_PRIMARY}>{t('retirement.update')}</button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <Modal open={disclaimer} onClose={() => setDisclaimer(false)} size="md" title={t('retirement.disclaimer')}>
        <p className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">{t('retirement.disclaimer_body')}</p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => setDisclaimer(false)} className={PILL_PRIMARY}>{t('retirement.close')}</button>
        </div>
      </Modal>
    </AnimatedPage>
  )
}
