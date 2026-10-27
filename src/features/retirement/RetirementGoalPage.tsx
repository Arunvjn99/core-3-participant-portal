import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
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

const field = 'h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white'

const parseMoney = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0

function Ring({ pct, label }: { pct: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={label}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626'} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 60 60)" />
      <text x="60" y="64" textAnchor="middle" className="fill-current text-2xl font-bold" fontSize="26">{pct}%</text>
    </svg>
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
    <div className="mt-2 flex items-center gap-3">
      <input type="range" min={0} max={30} step={0.5} value={value} onChange={(e) => { set(Number(e.target.value)); setSaved(false) }} aria-label={label} className="h-2 flex-1 text-blue-600" />
      <span className="relative w-24">
        <input type="number" inputMode="decimal" min={0} max={75} step={0.5} value={value} onChange={(e) => { set(Math.max(0, Number(e.target.value) || 0)); setSaved(false) }} aria-label={label} className={cn(field, 'pr-7 text-right tabular-nums')} />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
      </span>
    </div>
  )

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <Link to="/post-enrollment-dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {t('retirement.back')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('retirement.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('retirement.subtitle')}</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2" aria-live="polite">
            <div className="flex items-center gap-4 text-gray-900 dark:text-white">
              <Ring pct={result.readinessPct} label={t('retirement.of_goal', { pct: result.readinessPct })} />
              <div>
                <p className="text-sm font-semibold">{result.readinessPct >= 80 ? t('retirement.goal_reached') : t('retirement.goal_gap')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('retirement.of_goal_short')}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ['expected_expense', money(result.expectedExpense), ''],
                ['all_income', money(result.allIncome), 'text-green-700 dark:text-green-400'],
                ['shortfall', money(result.shortfall), result.shortfall > 0 ? 'text-red-600' : ''],
              ].map(([k, v, cls]) => (
                <div key={k} className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                  <dt className="text-gray-600 dark:text-gray-300">{t(`retirement.${k}`)}</dt>
                  <dd className={cn('font-semibold tabular-nums text-gray-900 dark:text-white', cls)}>{v}</dd>
                </div>
              ))}
            </dl>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-gray-500 dark:text-gray-400">{t('retirement.age_label')}</dt><dd className="font-semibold text-gray-900 dark:text-white">{retirementAge}</dd></div>
              <div><dt className="text-xs text-gray-500 dark:text-gray-400">{t('retirement.years_remaining')}</dt><dd className="font-semibold text-gray-900 dark:text-white">{result.yearsRemaining}</dd></div>
              <div><dt className="text-xs text-gray-500 dark:text-gray-400">{t('retirement.deferrals')}</dt><dd className="font-semibold text-gray-900 dark:text-white">{t('retirement.pct_of_pay', { pct: preTax + roth })}</dd></div>
              <div><dt className="text-xs text-gray-500 dark:text-gray-400">{t('plan.def.auto_title')}</dt><dd className="font-semibold text-gray-900 dark:text-white">{auto ? t('plan.inv.on') : t('plan.inv.off')}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {t('retirement.not_guaranteed')}{' '}
              <button type="button" onClick={() => setDisclaimer(true)} className="font-semibold text-blue-600 underline dark:text-blue-400">{t('retirement.disclaimer')}</button>
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-3">
            <form noValidate onSubmit={(e) => { e.preventDefault(); update() }} className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('retirement.target')}</h2>

              <div>
                <label htmlFor="rg-location" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{t('retirement.location')}</label>
                <select id="rg-location" value={location} onChange={(e) => { setLocation(e.target.value); setSaved(false) }} className={field}>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('retirement.location_hint')} {taxRate === 0 ? t('retirement.no_state_tax') : t('retirement.state_tax_est', { pct: Math.round(taxRate * 100) })}</p>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-gray-900 dark:text-white" id="rg-age-label">{t('retirement.planned_age')}</p>
                <div className="flex items-center gap-3" role="group" aria-labelledby="rg-age-label">
                  <button type="button" onClick={() => { setRetirementAge((a) => Math.max(currentAge + 1, a - 1)); setSaved(false) }} aria-label={t('enrollment.quick.decrease')} className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"><Minus className="h-4 w-4" /></button>
                  <span className="w-12 text-center text-lg font-semibold tabular-nums text-gray-900 dark:text-white" aria-live="polite">{retirementAge}</span>
                  <button type="button" onClick={() => { setRetirementAge((a) => Math.min(80, a + 1)); setSaved(false) }} aria-label={t('enrollment.quick.increase')} className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"><Plus className="h-4 w-4" /></button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('retirement.years_from_now', { years: result.yearsRemaining })}</span>
                </div>
                {errors.age && <p role="alert" className="mt-1 text-xs text-red-600">{errors.age}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ['rg-monthly', t('retirement.monthly_spending'), monthly, setMonthly, errors.monthly, t('retirement.spending_hint', { amount: money(parseMoney(monthly) * 12) })],
                  ['rg-salary', t('retirement.annual_salary'), salary, setSalary, errors.salary, t('retirement.salary_hint')],
                  ['rg-outside', t('retirement.outside_savings'), outside, setOutside, '', t('retirement.outside_hint')],
                ] as const).map(([id, label, value, set, err, hint]) => (
                  <div key={id} className={id === 'rg-outside' ? 'sm:col-span-2' : ''}>
                    <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{label}</label>
                    <span className="relative block">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                      <input id={id} inputMode="numeric" value={Number(value || 0).toLocaleString(locale)} aria-invalid={err ? true : undefined} onChange={(e) => { set(String(parseMoney(e.target.value))); setSaved(false) }} className={cn(field, 'pl-7 tabular-nums', err && 'border-red-500')} />
                    </span>
                    {err ? <p role="alert" className="mt-1 text-xs text-red-600">{err}</p> : <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="rg-plan" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{t('retirement.plan')}</label>
                <select id="rg-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className={field}>
                  {PLANS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <fieldset className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">{t('plan.def.title')}</legend>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t('retirement.pretax_deferral')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('retirement.pretax_hint')}</p>
                  {slider(preTax, setPreTax, t('retirement.pretax_deferral'))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t('retirement.roth_deferral')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('retirement.roth_hint')}</p>
                  {slider(roth, setRoth, t('retirement.roth_deferral'))}
                </div>
                {errors.rates && <p role="alert" className="text-xs text-red-600">{errors.rates}</p>}
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); setSaved(false) }} className="mt-0.5 h-4 w-4 rounded accent-blue-600" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">{t('plan.def.auto_title')} · {auto ? t('plan.inv.on') : t('plan.inv.off')}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{t('retirement.auto_hint', { amount: elections.autoIncrease.amount.preTax, cap: elections.autoIncrease.cap.preTax })}</span>
                  </span>
                </label>
              </fieldset>

              {saved && <p role="status" className="text-sm font-medium text-green-600">{t('retirement.saved')}</p>}
              <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <button type="button" onClick={cancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('profile.d.cancel')}</button>
                <button type="submit" disabled={!valid} className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50">{t('retirement.update')}</button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <Modal open={disclaimer} onClose={() => setDisclaimer(false)} size="md" title={t('retirement.disclaimer')}>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{t('retirement.disclaimer_body')}</p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => setDisclaimer(false)} className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">{t('retirement.close')}</button>
        </div>
      </Modal>
    </AnimatedPage>
  )
}
