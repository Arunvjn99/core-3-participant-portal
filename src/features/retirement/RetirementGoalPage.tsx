import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Minus, Plus, Target } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { Modal } from '@/design-system/components/Modal'
import { RangeSlider } from '@/design-system/components/RangeSlider'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PLANS } from '@/features/portfolio/portfolioData'
import { stateTaxRate, US_STATES } from './retirementModel'
import { useRetirementGoal } from './retirementStore'
import { ReadinessRing, ReadinessStatus } from './ReadinessRing'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { projectBalance, retirementAgeRange, retirementIncome } from '@/features/enrollment/enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'

const field = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:ring-blue-400/30'
/** The pre-enrollment dashboard's pieces: card surface, pills, labels, and one focus ring for every control */
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const CARD = 'rounded-[20px] bg-surface-card shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 dark:ring-white/10'
const PILL_PRIMARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-[14px] font-semibold text-white shadow-[0_6px_14px_-8px_rgba(37,99,235,0.5)] transition-[filter] hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] ${FOCUS}`
const PILL_SECONDARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-slate-900 shadow-[0_2px_6px_-3px_rgba(11,21,51,0.12)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10 ${FOCUS}`
/** The dashboard's card-header badge: a small coloured tile with a white icon */
const BADGE = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_16px_-8px_rgba(11,21,51,0.45)]'
const LABEL = 'mb-1.5 block text-[14px] font-semibold text-text-primary'
const HINT = 'mt-1.5 text-[12px] leading-snug text-slate-600 dark:text-slate-300'
const ERROR = 'mt-1.5 text-[12px] font-medium text-red-700 dark:text-red-300'

const parseMoney = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0
/** Lowest figures the readiness model accepts: below these the score stops meaning anything */
const MIN_MONTHLY_SPENDING = 1_000
const MIN_SALARY = 10_000

export default function RetirementGoalPage() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const goal = useRetirementGoal()
  const elections = useElectionsStore()
  const mergeDraft = useEnrollmentDraftStore((s) => s.mergeDraftSection)
  const salarySaved = useEnrollmentDraftStore((s) => s.draftData.savings?.salary ?? s.draftData.personalization?.salary) ?? 85_000
  // The dashboard's readiness score comes from the enrollment record; start from the same figures so both match
  const { data, personalization, updateData } = useEnrollment()
  /** The same age the dashboard counts years from, so "Years remaining" and the score agree */
  const currentAge = personalization.currentAge
  const [minAge, maxAge] = retirementAgeRange(currentAge)
  /** Until a goal is saved, start from the dashboard's own goal: 80% of pay, nothing outside the plan */
  const startMonthly = goal.checkedAt ? goal.monthlySpending : Math.round((salarySaved * 0.8) / 12)
  const startOutside = goal.checkedAt ? goal.outsideSavings : 0
  const startRate = data.contributionPercent
  const startPreTax = Math.round(((startRate * data.contributionSources.preTax) / 100) * 10) / 10
  const startRoth = Math.round(((startRate * data.contributionSources.roth) / 100) * 10) / 10
  /** After-tax savings aren't set on this page; kept as they are so the score matches the dashboard */
  const afterTax = Math.max(0, Math.round((startRate - startPreTax - startRoth) * 10) / 10)

  const [location, setLocation] = useState(goal.location)
  const [retirementAge, setRetirementAge] = useState(personalization.retirementAge)
  const [monthly, setMonthly] = useState(String(startMonthly))
  const [salary, setSalary] = useState(String(salarySaved))
  const [outside, setOutside] = useState(String(startOutside))
  const [planId, setPlanId] = useState(PLANS[0].id)
  const [preTax, setPreTax] = useState(startPreTax)
  const [roth, setRoth] = useState(startRoth)
  const [auto, setAuto] = useState(data.autoIncrease)
  const [disclaimer, setDisclaimer] = useState(false)
  const [saved, setSaved] = useState(false)

  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]

  /**
   * One projection for everything on the page (score, expense, income, shortfall, years), using the same model as the
   * dashboard: growth for the chosen risk level, the plan's employer match, auto-increase, 4% withdrawals in today's
   * dollars, Social Security from age 62, state tax on pre-tax withdrawals, plus savings held outside the plan.
   */
  const projection = useMemo(() => {
    const pay = parseMoney(salary)
    const rate = preTax + roth + afterTax
    const years = Math.max(0, retirementAge - currentAge)
    const sources = rate > 0 ? { preTax: (preTax / rate) * 100, roth: (roth / rate) * 100, afterTax: (afterTax / rate) * 100 } : data.contributionSources
    const growthRate = getGrowthRate(data.riskLevel)
    // The main plan starts from the same balance as the dashboard; another plan starts from its own balance
    const startingBalance = plan.id === PLANS[0].id ? personalization.currentSavings : plan.balance
    const balance = projectBalance({
      startingBalance,
      salary: pay,
      ratePercent: rate,
      sources,
      years,
      growthRate,
      autoIncrease: auto ? { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax } : null,
    })
    const income = retirementIncome(balance, years, pay, {
      retirementAge,
      annualGoal: parseMoney(monthly) * 12,
      outsideSavings: parseMoney(outside),
      growthRate,
      stateTaxRate: stateTaxRate(location),
      taxableShare: rate > 0 ? preTax / rate : 1,
    })
    return { years, income }
  }, [salary, preTax, roth, afterTax, retirementAge, currentAge, auto, monthly, outside, location, plan, personalization.currentSavings, data.contributionSources, data.riskLevel, data.autoIncreaseAmount, data.autoIncreaseMax])
  const score = projection.income.readinessPct
  const result = {
    yearsRemaining: projection.years,
    expectedExpense: projection.income.goal,
    allIncome: projection.income.total,
    shortfall: projection.income.gap,
  }

  const errors = {
    monthly: parseMoney(monthly) < MIN_MONTHLY_SPENDING ? t('retirement.err_min_spending', { amount: money(MIN_MONTHLY_SPENDING) }) : '',
    salary: parseMoney(salary) < MIN_SALARY ? t('retirement.err_min_salary', { amount: money(MIN_SALARY) }) : '',
    age: retirementAge < minAge || retirementAge > maxAge ? t('retirement.err_age_range', { min: minAge, max: maxAge }) : '',
    rates: preTax + roth > 75 ? t('plan.def.err_max', { max: 75 }) : '',
  }
  const valid = !Object.values(errors).some(Boolean)

  const cancel = () => {
    setLocation(goal.location)
    setRetirementAge(personalization.retirementAge)
    setMonthly(String(startMonthly))
    setSalary(String(salarySaved))
    setOutside(String(startOutside))
    setPreTax(startPreTax)
    setRoth(startRoth)
    setAuto(data.autoIncrease)
    setSaved(false)
  }

  const update = () => {
    if (!valid) return
    goal.save({ location, retirementAge, monthlySpending: parseMoney(monthly), outsideSavings: parseMoney(outside) })
    mergeDraft('savings', { salary: parseMoney(salary) })
    const rate = Math.round((preTax + roth + afterTax) * 10) / 10
    updateData({
      contributionPercent: rate,
      contributionSources: rate > 0 ? { preTax: (preTax / rate) * 100, roth: (roth / rate) * 100, afterTax: (afterTax / rate) * 100 } : data.contributionSources,
      autoIncrease: auto,
    })
    mergeDraft('personalization', { retirementAge })
    const nextDeferral = { unit: 'percent' as const, preTax, roth, usePlanRate: false }
    const nextAuto = { ...elections.autoIncrease, enabled: auto }
    const changedDef = elections.deferral.unit !== 'percent' || elections.deferral.preTax !== preTax || elections.deferral.roth !== roth
    const changedAuto = elections.autoIncrease.enabled !== auto
    if (changedDef || changedAuto) elections.saveDeferral(nextDeferral, nextAuto, { deferral: changedDef, auto: changedAuto })
    setSaved(true)
  }

  const taxRate = stateTaxRate(location)
  const SLIDER_MAX = 30
  const slider = (value: number, set: (v: number) => void, label: string, hint: string, color: string) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            <p className="text-[14px] font-semibold text-text-primary">{label}</p>
          </div>
          <p className="ml-[18px] mt-0.5 text-[12px] text-slate-600 dark:text-slate-300">{hint}</p>
        </div>
        {/* The exact figure, typeable; the slider below covers the usual range */}
        <span className="relative w-[92px] shrink-0">
          <input type="number" inputMode="decimal" min={0} max={75} step={0.5} value={value} onChange={(e) => { set(Math.max(0, Number(e.target.value) || 0)); setSaved(false) }} aria-label={label} className={cn(field, 'h-10 pr-8 text-right text-[16px] font-bold tabular-nums')} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-500 dark:text-slate-400">%</span>
        </span>
      </div>
      <RangeSlider min={0} max={SLIDER_MAX} step={0.5} value={Math.min(value, SLIDER_MAX)} onChange={(v) => { set(v); setSaved(false) }} color={color} aria-label={label} aria-valuetext={`${value}%`} />
      <div className="flex justify-between text-[12px] text-slate-600 dark:text-slate-300" aria-hidden>
        <span>0%</span>
        <span>{SLIDER_MAX}%</span>
      </div>
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

        <form noValidate onSubmit={(e) => { e.preventDefault(); update() }} className="grid items-start gap-5 lg:grid-cols-5">
          <section className={cn(CARD, 'p-5 sm:p-6 lg:col-span-2')} aria-live="polite">
            <div className="flex flex-wrap items-center gap-5">
              <ReadinessRing score={score} />
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold leading-snug text-text-primary">{t('dashboard.readinessScore')}</p>
                <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300">{t('postDashboard.readiness_sub')}</p>
                <ReadinessStatus score={score} className="mt-3" />
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
              <div><dt className="text-[12px] text-slate-600 dark:text-slate-300">{t('retirement.deferrals')}</dt><dd className="mt-0.5 font-semibold text-text-primary">{t('retirement.pct_of_pay', { pct: Math.round((preTax + roth + afterTax) * 10) / 10 })}</dd></div>
              <div><dt className="text-[12px] text-slate-600 dark:text-slate-300">{t('plan.def.auto_title')}</dt><dd className="mt-0.5 font-semibold text-text-primary">{auto ? t('plan.inv.on') : t('plan.inv.off')}</dd></div>
            </dl>
            <p className="mt-5 border-t border-slate-200/80 pt-4 text-[12px] leading-snug text-slate-600 dark:border-white/10 dark:text-slate-300">
              {t('retirement.not_guaranteed')}{' '}
              <button type="button" onClick={() => setDisclaimer(true)} className={cn('rounded font-semibold text-primary underline underline-offset-2 dark:text-blue-300', FOCUS)}>{t('retirement.disclaimer')}</button>
            </p>
          </section>

          <section className={cn(CARD, 'space-y-5 p-5 sm:p-6 lg:col-span-3')} aria-labelledby="rg-target">
              <div className="flex items-center gap-2.5">
                <span className={cn(BADGE, 'bg-blue-600')} aria-hidden><Target className="h-[18px] w-[18px]" /></span>
                <h2 id="rg-target" className="text-[16px] font-bold text-text-primary">{t('retirement.target')}</h2>
              </div>

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
                  <button type="button" onClick={() => { setRetirementAge((a) => Math.max(minAge, a - 1)); setSaved(false) }} aria-label={t('enrollment.quick.decrease')} className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10', FOCUS)}><Minus className="h-4 w-4" aria-hidden /></button>
                  <span className="w-12 text-center text-[20px] font-bold tabular-nums text-text-primary" aria-live="polite">{retirementAge}</span>
                  <button type="button" onClick={() => { setRetirementAge((a) => Math.min(maxAge, a + 1)); setSaved(false) }} aria-label={t('enrollment.quick.increase')} className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10', FOCUS)}><Plus className="h-4 w-4" aria-hidden /></button>
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


              <div role="group" aria-labelledby="rg-deferral" className="space-y-5 border-t border-slate-200/80 pt-5 dark:border-white/10">
              <h3 id="rg-deferral" className="text-[16px] font-bold text-text-primary">{t('plan.def.title')}</h3>
                <div>
                  {slider(preTax, setPreTax, t('retirement.pretax_deferral'), t('retirement.pretax_hint'), 'var(--chart-blue)')}
                </div>
                {slider(roth, setRoth, t('retirement.roth_deferral'), t('retirement.roth_hint'), 'var(--accent-purple)')}
                {errors.rates && <p role="alert" className={ERROR}>{errors.rates}</p>}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/70 dark:bg-white/5 dark:ring-white/10">
                  <input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); setSaved(false) }} className={cn('mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--color-primary)]', FOCUS)} />
                  <span>
                    <span className="block text-[14px] font-semibold text-text-primary">{t('plan.def.auto_title')} · {auto ? t('plan.inv.on') : t('plan.inv.off')}</span>
                    <span className="mt-0.5 block text-[12px] text-slate-600 dark:text-slate-300">{t('retirement.auto_hint', { amount: elections.autoIncrease.amount.preTax, cap: elections.autoIncrease.cap.preTax })}</span>
                  </span>
                </label>
              </div>

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
          </section>
        </form>
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
