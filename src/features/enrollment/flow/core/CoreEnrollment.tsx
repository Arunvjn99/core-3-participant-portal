import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Check, Loader2, Lock, RotateCw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { LEGAL, ROUTES } from '@/lib/constants'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { useDialogA11y } from '@/lib/useDialogA11y'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useEnrollmentSave } from '@/core/hooks/useEnrollmentSave'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { nextIncreaseDate } from '@/features/plan/electionsData'
import { recommendedFunds, type RiskKey } from '../../investmentCatalog'
import { GROWTH_RATES, buildQuickEnrollmentDefaults } from '../../quickEnrollmentDefaults'
import { useParticipantBasics } from '../../useParticipantBasics'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../../agent/planConfig'
import { checkEligibility, getPlanRules, submitEnrollment } from '../../agent/enrollmentService'
import { FUND_COLORS, blendedFee, fundMeta, pause, round2, rowsFor, type Election } from './model'
import { AgentMark, AnimatedNumber, ConfettiField, DrawnCheck, EdgeGlow, InfoTip, ProjectionChart, Sheet, Shimmer } from './ui'

/**
 * One-click enrollment: Core AI builds a plan from the details already on file and opens straight on it. The participant
 * reviews one screen, adjusts anything in focused side panels, and approves once. Plan data and submission are simulated
 * (see agent/enrollmentService.ts).
 */

type Stage = 'working' | 'review' | 'submitting' | 'done'
type StepState = 'pending' | 'active' | 'done' | 'error'
type SheetKind = 'contribution' | 'auto' | 'invest' | 'disclosures' | null

const WORK_STEPS = 6
const SUBMIT_STEPS = 3
const ease = [0.22, 1, 0.36, 1] as const

/** What Core AI is doing right now, as one line: each step slides in and replaces the last. */
function LiveLine({ steps }: { steps: { state: StepState; label: string }[] }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const active = steps.findIndex((s) => s.state === 'active')
  if (active < 0) return null
  const label = steps[active].label
  return (
    <span className="flex h-6 items-center gap-2.5" role="status">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" aria-hidden />
      <span className="relative h-5 w-[240px] min-w-0 overflow-hidden sm:w-[280px]">
        <AnimatePresence initial={false}>
          <motion.span
            key={label}
            initial={reduce ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: -16, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="absolute inset-0 truncate text-[14px] font-medium leading-5"
          >
            <Shimmer>{label}</Shimmer>
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="shrink-0 text-[12px] tabular-nums text-slate-400">{t('enrollment.core.step_of', { n: active + 1, total: steps.length })}</span>
    </span>
  )
}

/** A placeholder bar while the plan is being built. */
function Bone({ className }: { className?: string }) {
  return <span className={cn('block animate-pulse rounded-lg bg-slate-100 dark:bg-gray-800', className)} aria-hidden />
}

/** Investment style shown for each risk level, in three plain words */
const STYLE_FOR_RISK: Record<RiskKey, 'conservative' | 'moderate' | 'aggressive'> = {
  conservative: 'conservative',
  balanced: 'moderate',
  growth: 'aggressive',
  aggressive: 'aggressive',
}

export default function CoreEnrollment() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const now = useNow()
  const { saveCompleteEnrollment } = useEnrollmentSave()
  const { employer, periods, birthYear, birthMonth, birthDay, age, knownSalary, salary, retireAge, years, savings } = useParticipantBasics()
  const planName = `${employer} ${t('enrollment.rw.plan_name')}`

  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`
  const compact = (v: number) => (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1_000).toLocaleString(locale)}K`)
  const dateLong = (d: Date) => d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })

  // ── Page state ──
  const [stage, setStage] = useState<Stage>('working')
  const [steps, setSteps] = useState<StepState[]>(['active', ...Array(WORK_STEPS - 1).fill('pending')])
  const [problem, setProblem] = useState<'ineligible' | 'rules' | null>(null)
  const [submitSteps, setSubmitSteps] = useState<StepState[]>(Array(SUBMIT_STEPS).fill('pending'))
  const [submitError, setSubmitError] = useState(false)
  const [effective, setEffective] = useState<Date | null>(null)
  const rulesAttempt = useRef(0)
  const started = useRef(false)
  const planRef = useRef<HTMLDivElement>(null)
  /** How much the plan is scaled so all of it fits the window (1 = natural size) */
  const [fit, setFit] = useState(1)

  // ── The draft ──
  const initialElection = (): Election => ({
    unit: 'percent',
    preTax: 4,
    roth: 2,
    auto: { enabled: true, cycle: 'plan_year', sourceWise: false, amount: { preTax: 1, roth: 1 }, cap: { preTax: 10, roth: 10 } },
    mode: 'risk_style',
    risk: 'balanced',
    ownRows: [],
    autoRebalance: false,
    sdb: false,
  })
  const [election, setElection] = useState<Election>(initialElection)
  /** What Core AI first proposed, so Start over can return to it */
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [showFunds, setShowFunds] = useState(false)
  /** Warns before leaving the confirmation without naming a beneficiary */
  const [beneWarn, setBeneWarn] = useState(false)
  const beneRef = useDialogA11y<HTMLDivElement>(beneWarn, () => setBeneWarn(false))
  const [consent, setConsent] = useState(false)
  /** A short confirmation after an edit or a reset; it clears itself */
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)

  const wait = (ms: number) => pause(reduce ? 0 : ms)

  /**
   * Balance at the end of each year from today to retirement, one point per year.
   * Each year adds your contributions and the employer match at that year's rate, then grows at the mix's average return;
   * with auto-increase on, the rate rises by the step each plan year until it reaches the cap.
   */
  const projectPath = (e: Election) => {
    const growth = GROWTH_RATES[e.risk]
    const step = e.auto.enabled ? e.auto.amount.preTax : 0
    const ceiling = Math.max(e.auto.cap.preTax, e.preTax + e.roth)
    let rate = e.preTax + e.roth
    let balance = savings
    const out = [balance]
    for (let y = 0; y < years; y++) {
      balance = (balance + (salary * rate) / 100 + employerMatch(salary, rate)) * (1 + growth)
      out.push(balance)
      rate = Math.min(rate + step, ceiling)
    }
    return out
  }

  // Derived, for any election
  const facts = (e: Election) => {
    const rows = rowsFor(e)
    const total = round2(e.preTax + e.roth)
    return {
      rows,
      total,
      perCheck: (salary * total) / 100 / periods,
      match: employerMatch(salary, total),
      fee: blendedFee(rows),
      rowsTotal: rows.reduce((s, r) => s + r.pct, 0),
      projected: projectPath(e)[years],
      tax: e.preTax > 0 && e.roth > 0 ? t('enrollment.core.tax_mix', { pre: e.preTax, roth: e.roth }) : e.roth > 0 ? t('enrollment.core.tax_roth') : t('enrollment.core.tax_pre'),
      invest: e.mode === 'plan_selected' ? t('enrollment.core.inv_plan') : e.mode === 'own' ? t('enrollment.core.inv_own') : t(`enrollment.core.style_${STYLE_FOR_RISK[e.risk]}`),
    }
  }
  const f = facts(election)
  const funds = f.rows.slice(0, 5)
  const cap = PLAN_CONFIG.match.capPercent
  const fullMatch = employerMatch(salary, cap)
  const rateError = f.total < PLAN_LIMITS.rate[0] || f.total > PLAN_LIMITS.rate[1]
  const fundsError = f.rowsTotal !== 100
  const canApprove = consent && !rateError && !fundsError && stage === 'review'
  const nextAuto = nextIncreaseDate(election.auto.cycle, now, now)
  const autoTarget = election.auto.enabled ? Math.max(election.auto.cap.preTax, f.total) : f.total
  /** Where the contribution goes, by source; the bar is scaled to the auto-increase target */
  const sources = [
    { key: 'preTax', label: t('enrollment.core.src_pre'), pct: election.preTax, bar: 'bg-blue-600' },
    { key: 'roth', label: t('enrollment.core.src_roth'), pct: election.roth, bar: 'bg-indigo-400' },
  ]
  const barMax = Math.max(autoTarget, cap, f.total, 1)
  const nextRate = Math.min(f.total + election.auto.amount.preTax, Math.max(election.auto.cap.preTax, f.total))
  const series = projectPath(election)
  const ready = stage !== 'working' && !problem

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(id)
  }, [toast])

  // Keep the whole plan on one screen: if it's taller than the window, scale it down a little
  const showPlan = stage !== 'done'
  useLayoutEffect(() => {
    const el = planRef.current
    if (!showPlan || !el) return
    let current = parseFloat(getComputedStyle(el).zoom) || 1
    const measure = () => {
      // The visible height divided by the zoom in effect gives the natural height
      const natural = el.getBoundingClientRect().height / (parseFloat(getComputedStyle(el).zoom) || 1)
      const top = document.querySelector('header.sticky')?.getBoundingClientRect().bottom ?? 0
      const footers = document.getElementsByTagName('footer')
      const footerH = footers.length ? footers[footers.length - 1].getBoundingClientRect().height : 0
      // Leave room for the footer so it shows without scrolling
      const available = window.innerHeight - Math.max(top, 0) - footerH - 48
      // Phones scroll naturally; only wider screens are fitted
      const next = window.innerWidth < 640 ? 1 : Math.round(Math.max(0.82, Math.min(1, available / natural)) * 100) / 100
      if (next !== current) {
        current = next
        setFit(next)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [showPlan])

  // ── The work: build the plan from what's on file ──
  const markStep = (i: number, s: StepState) => setSteps((all) => all.map((x, j) => (j === i ? s : x)))

  const run = async () => {
    setProblem(null)
    setStage('working')
    setSteps(['active', ...Array(WORK_STEPS - 1).fill('pending')])
    const { mergeDraftSection } = useEnrollmentDraftStore.getState()
    mergeDraftSection('personalization', { birthMonth, birthYear, birthDay, currentAge: age, retirementAge: retireAge, ...(knownSalary ? { salary: knownSalary } : {}) })
    const eligibility = await checkEligibility(age)
    if (!eligibility.eligible) {
      markStep(0, 'error')
      setProblem('ineligible')
      return
    }
    markStep(0, 'done')
    markStep(1, 'active')
    try {
      await getPlanRules(rulesAttempt.current++)
    } catch {
      markStep(1, 'error')
      setProblem('rules')
      return
    }
    markStep(1, 'done')
    const d = buildQuickEnrollmentDefaults(useEnrollmentDraftStore.getState().draftData)
    const risk = d.riskLevel as RiskKey
    const proposed: Election = {
      ...initialElection(),
      // Split the rate across both sources: about two thirds pre-tax, one third Roth
      preTax: d.contributionPercent - Math.max(1, Math.round(d.contributionPercent / 3)),
      roth: Math.max(1, Math.round(d.contributionPercent / 3)),
      risk,
      ownRows: recommendedFunds(risk).map((x) => ({ ticker: x.ticker, pct: x.allocation })),
      auto: { enabled: d.autoIncrease.enabled, cycle: 'plan_year', sourceWise: false, amount: { preTax: d.autoIncrease.amount, roth: d.autoIncrease.amount }, cap: { preTax: d.autoIncrease.max, roth: d.autoIncrease.max } },
    }
    setElection(proposed)
    for (let i = 2; i < WORK_STEPS; i++) {
      markStep(i, 'active')
      await wait(220)
      markStep(i, 'done')
    }
    setStage('review')
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Approval ──
  const markSubmit = (i: number, s: StepState) => setSubmitSteps((all) => all.map((x, j) => (j === i ? s : x)))
  const approve = async () => {
    if (!canApprove) return
    setSubmitError(false)
    setStage('submitting')
    setSubmitSteps(['active', 'pending', 'pending'])
    const total = f.total
    const share = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)
    const allocation = Object.fromEntries(f.rows.map((r) => [r.ticker, r.pct]))
    await wait(450)
    markSubmit(0, 'done')
    markSubmit(1, 'active')
    try {
      const conf = await submitEnrollment({
        planId: PLAN_CONFIG.plan.planId,
        ratePercent: total,
        preTaxPercent: share(election.preTax),
        rothPercent: share(election.roth),
        autoIncrease: { enabled: election.auto.enabled, amount: election.auto.amount.preTax, max: election.auto.cap.preTax },
        allocation,
        consented: consent,
      })
      markSubmit(1, 'done')
      markSubmit(2, 'active')
      const toUnit = (pct: number) => round2(election.unit === 'dollar' ? (pct / 100) * (salary / periods) : pct)
      const { mergeDraftSection } = useEnrollmentDraftStore.getState()
      const planType = election.roth > election.preTax ? 'roth' : 'traditional'
      mergeDraftSection('plan', { type: planType, planId: planType, planName: planType === 'roth' ? 'Roth 401(k)' : 'Traditional 401(k)' })
      mergeDraftSection('contribution', { percent: total, rate: total, type: 'percentage' })
      mergeDraftSection('source', { preTax: share(election.preTax), roth: share(election.roth), afterTax: 0 })
      mergeDraftSection('autoIncrease', { enabled: election.auto.enabled, amount: election.auto.amount.preTax, max: election.auto.cap.preTax })
      mergeDraftSection('investment', { riskLevel: election.risk, useRecommended: election.mode !== 'own', customAllocation: allocation })
      useEnrollmentDraftStore.setState((s) => ({
        currentStep: 8,
        highestCompletedStep: Math.max(s.highestCompletedStep, 7),
        draftData: { ...s.draftData, review: { confirmedAt: conf.submittedAt, agreed: true } },
        enrollmentStatus: 'complete',
      }))
      useElectionsStore.getState().applyEnrollment({
        preTaxRate: toUnit(election.preTax),
        rothRate: toUnit(election.roth),
        unit: election.unit,
        autoIncrease: { enabled: election.auto.enabled, amount: election.auto.amount.preTax, max: election.auto.cap.preTax },
        autoIncreaseFull: election.auto,
        mode: election.mode,
        autoRebalance: election.autoRebalance,
        sdbOptedIn: election.sdb,
        risk: election.risk,
        allocation,
      })
      const saved = await saveCompleteEnrollment()
      if (!saved.ok) console.warn('[CoreEnrollment] Save failed, continuing with the local record:', saved.error)
      await wait(350)
      markSubmit(2, 'done')
      setEffective(conf.effectiveDate)
      await wait(250)
      setStage('done')
      // The page scrolls inside the shell (the footer stays pinned), so scroll that, not the window
      const scroller = document.querySelector('[data-quick-scroll]') ?? window
      scroller.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    } catch {
      markSubmit(1, 'error')
      setSubmitError(true)
      setStage('review')
    }
  }

  const workSteps = ['s1', 's2', 's3', 's4', 's5', 's6'].map((k, i) => ({ label: t(`enrollment.core.${k}_ing`), state: steps[i] }))
  const submitLog = ['u1', 'u2', 'u3'].map((k, i) => ({ label: t(`enrollment.core.${k}_ing`), state: submitSteps[i] }))

  // What they enrolled in, for the confirmation
  const summary: { label: string; value: string; good?: boolean }[] = [
    { label: t('enrollment.core.m_save'), value: `${f.total}% · ${money(f.perCheck)}${t(periods === 12 ? 'enrollment.core.unit_month' : 'enrollment.core.unit_paycheck')}` },
    { label: t('enrollment.core.m_match_short'), value: `+${money(f.match / 12)}${t('enrollment.core.unit_month')}`, good: true },
    { label: t('enrollment.core.invested_in'), value: f.invest },
    ...(effective ? [{ label: t('enrollment.core.first_contribution'), value: dateLong(effective) }] : []),
  ]

  const card = 'rounded-[24px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 dark:bg-gray-900 dark:ring-gray-800'
  const label = 'text-[14px] font-medium text-slate-500 dark:text-gray-400'

  return (
    <div className="relative -mx-4 -my-6 sm:-mx-6">
      {/* Ambient light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(70%_70%_at_50%_0%,rgba(37,99,235,0.09),transparent_70%)]" aria-hidden />
      {stage === 'done' && <ConfettiField />}

      {/* Where they are in enrollment */}
      <header className="sticky top-0 z-30 bg-[#f5f6f8]/75 backdrop-blur-xl dark:bg-gray-950/80">
        <div className="mx-auto flex h-12 max-w-[1120px] items-center gap-3 px-4 sm:px-6">
          <h1 className="text-[22px] font-bold tracking-[-0.015em] text-slate-900 dark:text-white">{t('enrollment.core.title')}</h1>
        </div>
      </header>

      <main className="relative mx-auto max-w-[900px] px-4 pb-6 pt-6 sm:px-6">
        {showPlan ? (
          <div ref={planRef} style={fit < 1 ? { zoom: fit } : undefined} className="space-y-4">
            {/* Title */}
            <div className="flex items-center gap-4 px-1">
              <motion.span initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }} className="rounded-full shadow-[0_10px_24px_rgba(37,99,235,0.28)]">
                <AgentMark size={52} star working={stage === 'working' || stage === 'submitting'} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.03em] text-slate-900 sm:text-[30px] dark:text-white">
                  {ready || stage === 'submitting' ? (
                    <>
                      {t('enrollment.core.ready_lead')}{' '}
                      <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent dark:from-blue-300 dark:to-indigo-300">{t('enrollment.core.ready_word')}</span>
                    </>
                  ) : problem ? (
                    t('enrollment.core.st_attention')
                  ) : (
                    <Shimmer>{t('enrollment.core.building')}</Shimmer>
                  )}
                </h2>
                <div className="mt-0.5 text-[15px] text-slate-500 dark:text-gray-400">
                  {stage === 'working' && !problem ? <LiveLine steps={workSteps} /> : <p className="truncate"><strong className="font-semibold text-slate-900 dark:text-white">{planName}</strong>{` · ${t('enrollment.core.review_enroll')}`}</p>}
                </div>
              </div>
            </div>

            {problem === 'ineligible' && (
              <div className={cn(card, 'px-6 py-5')}>
                <p className="text-[15px] leading-[1.6] text-slate-700 dark:text-gray-200">{t('enrollment.core.ineligible', { min: PLAN_CONFIG.eligibility.minAge })}</p>
                <button type="button" onClick={() => navigate('/dashboard')} className="mt-3 inline-flex h-10 items-center rounded-full bg-slate-900 px-4 text-[14px] font-medium text-white hover:bg-slate-800">{t('enrollment.core.to_dashboard')}</button>
              </div>
            )}
            {problem === 'rules' && (
              <div className={cn(card, 'flex flex-wrap items-center justify-between gap-3 px-6 py-5')}>
                <p className="text-[15px] leading-[1.6] text-slate-700 dark:text-gray-200">{t('enrollment.core.rules_error')}</p>
                <button type="button" onClick={() => void run()} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-[14px] font-medium text-white hover:bg-slate-800">
                  <RotateCw className="h-4 w-4" aria-hidden />
                  {t('enrollment.core.retry')}
                </button>
              </div>
            )}

            {!problem && (
              <>
                {/* The plan */}
                <motion.article initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45, ease }} aria-label={t('enrollment.core.step_plan')} className={cn(card, 'relative overflow-hidden')}>
                  {!ready && !reduce && <motion.span className="pointer-events-none absolute inset-y-0 z-10 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/5" initial={{ x: '-100%' }} animate={{ x: '400%' }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} aria-hidden />}

                  <div className="grid md:grid-cols-[1.05fr_1fr]">
                    {/* You save */}
                    <section className="p-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <p className={label}>{t('enrollment.core.m_save')}</p>
                      </div>
                      {ready ? (
                        <>
                          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                            <span className="whitespace-nowrap">
                              <span className="text-[34px] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[40px] dark:text-white">
                                <AnimatedNumber countUp delay={0.35} value={f.perCheck} format={money} />
                              </span>
                              <span className="ml-1 text-[16px] text-slate-400">{t('enrollment.core.per_paycheck')}</span>
                            </span>
                            <span className="text-[15px] font-semibold text-blue-900 dark:text-blue-200">
                              <AnimatedNumber countUp delay={0.3} value={f.total} format={(v) => `${round2(v)}%`} /> {t('enrollment.core.of_pay')}
                            </span>
                          </p>
                          <p className="mt-1 text-[14px] text-slate-500 dark:text-gray-400">
                            <Trans
                              i18nKey="enrollment.core.pay_line"
                              values={{ pay: money(salary / 12), amount: money((salary * f.total) / 100 / 12) }}
                              components={{ b: <strong className="font-semibold text-slate-900 dark:text-white" /> }}
                            />
                          </p>
                          {/* How much of pay goes in, split by source */}
                          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800" role="img" aria-label={`${f.total}% ${t('enrollment.core.of_pay')}`}>
                            {sources.map((src, i) => (
                              <motion.span key={src.key} initial={reduce ? false : { width: 0 }} animate={{ width: `${(src.pct / barMax) * 100}%` }} transition={{ delay: 0.35 + i * 0.1, duration: 0.7, ease }} className={cn('h-full', src.bar)} />
                            ))}
                          </div>
                          <ul className="mt-3 grid grid-cols-2 gap-2">
                            {sources.map((src) => (
                              <li key={src.key} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-gray-800/60">
                                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 dark:text-gray-400">
                                  <span className={cn('h-2 w-2 shrink-0 rounded-full', src.bar)} aria-hidden />
                                  <span className="truncate">{src.label}</span>
                                </span>
                                <span className={cn('mt-0.5 block text-[16px] font-semibold tabular-nums', src.pct > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-500')}>{`${src.pct}%`}</span>
                              </li>
                            ))}
                          </ul>
                          {rateError && <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">{t('enrollment.feed.err_rate', { min: PLAN_LIMITS.rate[0], max: PLAN_LIMITS.rate[1], total: f.total })}</p>}
                        </>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <Bone className="h-10 w-48" />
                          <Bone className="h-2.5 w-full" />
                          <Bone className="h-14 w-full" />
                        </div>
                      )}
                    </section>

                    {/* Projected */}
                    <section className="border-t border-slate-100 bg-gradient-to-b from-slate-50/70 to-white p-5 sm:p-6 md:border-l md:border-t-0 dark:border-gray-800 dark:from-gray-800/30 dark:to-gray-900">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(label, 'flex items-center gap-0.5')}>
                          {t('enrollment.core.m_proj', { age: retireAge })}
                          <InfoTip side="bottom" label={t('enrollment.core.m_proj', { age: retireAge })} text={t('enrollment.core.growth_tip')} />
                        </p>
                        <span className="inline-flex h-7 items-center rounded-full bg-blue-50 px-2.5 text-[13px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{t('enrollment.core.m_proj_sub')}</span>
                      </div>
                      {ready ? (
                        <>
                          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[36px] font-bold tracking-[-0.03em] text-slate-900 sm:text-[42px] dark:text-white">
                              <AnimatedNumber countUp delay={0.45} value={f.projected} format={compact} />
                            </span>
                            <span className="text-[14px] font-medium text-emerald-700 dark:text-emerald-400">{t('enrollment.core.incl_match')}</span>
                          </p>
                          <div className="relative mt-1 h-[72px] [&_svg]:h-[72px]">
                            <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200 dark:border-gray-700" aria-hidden />
                            <ProjectionChart
                              key={`${f.total}-${election.risk}`}
                              points={series}
                              startAge={age}
                              height={72}
                              delay={0.6}
                              format={compact}
                              label={t('enrollment.core.chart_label')}
                              pointLabel={(a, value) => t('enrollment.core.chart_point', { age: a, value })}
                            />
                          </div>
                          <div className="mt-1.5 flex justify-between text-[13px] text-slate-400">
                            <span>{t('enrollment.core.today', { age })}</span>
                            <span>{t('enrollment.core.at_age', { age: retireAge })}</span>
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <Bone className="h-10 w-40" />
                          <Bone className="h-[72px] w-full" />
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Match, auto-increase, investments */}
                  <div className="grid border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-slate-100 dark:border-gray-800 dark:divide-gray-800">
                    <section className="p-5 sm:px-6">
                      <p className={cn(label, 'flex items-center gap-0.5')}>
                        {t('enrollment.core.m_match_short')}
                        <InfoTip
                          side="top"
                          label={t('enrollment.core.m_match_short')}
                          text={t('enrollment.core.match_tip', { rate: PLAN_CONFIG.match.ratePercent, cap: cap, pay: money(salary / 12), amount: money(fullMatch / 12) })}
                        />
                      </p>
                      {ready ? (
                        <>
                          <p className="mt-1.5">
                            <span className="text-[24px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
                              <AnimatedNumber countUp delay={0.5} value={f.match / 12} format={money} />
                            </span>
                            <span className="ml-1 text-[15px] text-slate-400">{t('enrollment.core.per_month')}</span>
                          </p>
                          {f.match >= fullMatch ? (
                            <p className="mt-1 flex items-center gap-1 text-[14px] font-medium text-emerald-700 dark:text-emerald-400">
                              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                              {t('enrollment.core.m_match_full')}
                            </p>
                          ) : (
                            <p className="mt-1 text-[14px] font-medium text-amber-700 dark:text-amber-400">{t('enrollment.core.m_match_gap', { amount: `${money((fullMatch - f.match) / 12)}${t('enrollment.core.unit_month')}` })}</p>
                          )}
                        </>
                      ) : (
                        <div className="mt-2.5 space-y-2">
                          <Bone className="h-7 w-28" />
                          <Bone className="h-4 w-20" />
                        </div>
                      )}
                    </section>

                    <section className="border-t border-slate-100 p-5 sm:border-t-0 sm:px-6 dark:border-gray-800">
                      <div className="flex items-center justify-between gap-2">
                        <p className={label}>{t('enrollment.core.row_auto')}</p>
                        {ready && election.auto.enabled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/25">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                            {t('enrollment.core.auto_enabled')}
                          </span>
                        )}
                      </div>
                      {ready ? (
                        <>
                          <p className="mt-1.5 flex items-center gap-1.5 text-[24px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
                            {`${f.total}%`}
                            {election.auto.enabled && (
                              <>
                                <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                                {`${nextRate}%`}
                              </>
                            )}
                          </p>
                          {election.auto.enabled ? (
                            <p className="mt-1 text-[14px] text-slate-500 dark:text-gray-400">
                              {t('enrollment.core.auto_each', { amount: election.auto.amount.preTax, year: nextAuto.getFullYear() })}
                            </p>
                          ) : (
                            <p className="mt-1 text-[14px] text-slate-500 dark:text-gray-400">{t('enrollment.core.auto_off_short')}</p>
                          )}
                        </>
                      ) : (
                        <div className="mt-2.5 space-y-2">
                          <Bone className="h-7 w-28" />
                          <Bone className="h-4 w-40" />
                        </div>
                      )}
                    </section>

                    <section className="border-t border-slate-100 p-5 sm:border-t-0 sm:px-6 dark:border-gray-800">
                      <div className="flex items-center justify-between gap-2">
                        <p className={label}>{t('enrollment.core.row_invest')}</p>
                      </div>
                      {ready ? (
                        <>
                          <p className="mt-1.5 truncate text-[22px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">{f.invest}</p>
                          <p className="mt-1 text-[14px] text-slate-500 dark:text-gray-400">
                            {t('enrollment.core.fee', { fee: f.fee.toFixed(2) })} ·{' '}
                            <button type="button" onClick={() => setShowFunds(true)} className="rounded-md font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300">
                              {t('enrollment.core.funds_n', { count: funds.length })}
                            </button>
                          </p>
                          {fundsError && <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">{t('enrollment.feed.err_funds', { total: f.rowsTotal })}</p>}
                        </>
                      ) : (
                        <div className="mt-2.5 space-y-2">
                          <Bone className="h-7 w-36" />
                          <Bone className="h-4 w-28" />
                        </div>
                      )}
                    </section>
                  </div>

                </motion.article>

                {submitError && stage === 'review' && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-4 py-3 text-[14px] leading-[1.55] text-red-800 ring-1 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {t('enrollment.core.submit_error')}
                  </div>
                )}

                {/* Approval: Core AI asks for permission before it submits anything */}
                <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45, ease }} className={cn(card, 'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6')}>
                  {stage === 'submitting' ? (
                    <div className="min-w-0 flex-1">
                      <LiveLine steps={submitLog} />
                    </div>
                  ) : (
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3.5">
                      <input type="checkbox" checked={consent} disabled={!ready} onChange={(e) => setConsent(e.target.checked)} className="peer sr-only" />
                      <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2', consent ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white dark:border-gray-600 dark:bg-gray-900')} aria-hidden>
                        {consent && <DrawnCheck className="h-3.5 w-3.5" />}
                      </span>
                      <span className="text-[14px] leading-[1.55] text-slate-600 dark:text-gray-300">
                        <Trans
                          i18nKey="enrollment.core.consent"
                          values={{ plan: planName }}
                          components={{
                            terms: (
                              <button type="button" onClick={(e) => { e.preventDefault(); setSheet('disclosures') }} className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800 dark:text-blue-300" />
                            ),
                            b: <strong className="font-semibold text-slate-900 dark:text-white" />,
                          }}
                        />
                      </span>
                    </label>
                  )}
                  <motion.button
                    type="button"
                    whileTap={canApprove ? { scale: 0.97 } : undefined}
                    onClick={() => void approve()}
                    disabled={!canApprove}
                    className="relative inline-flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 px-7 text-[16px] font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,0.4),0_8px_20px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none sm:min-w-[240px] dark:disabled:bg-gray-800"
                  >
                    {canApprove && !reduce && <motion.span className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent" initial={{ x: '-120%' }} animate={{ x: '500%' }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }} aria-hidden />}
                    {stage === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : submitError ? <RotateCw className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                    {stage === 'submitting' ? t('enrollment.core.approving') : submitError ? t('enrollment.core.try_again') : t('enrollment.core.approve')}
                  </motion.button>
                </motion.div>

                {/* Leave without enrolling */}
                <div className="flex items-center">
                  <button type="button" onClick={() => navigate(ROUTES.PRE_ENROLLMENT_DASHBOARD)} disabled={stage === 'submitting'} className="h-10 rounded-full bg-white px-5 text-[14px] font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-800 dark:hover:bg-gray-800">
                    {t('enrollment.core.cancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Enrolled */
          <div className="relative mx-auto flex max-w-[600px] flex-col items-center pt-2 text-center">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 380, damping: 18 }}
              className="relative mb-5 rounded-[18px] bg-white px-5 py-2.5 text-[16px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-gray-900 dark:text-white dark:ring-gray-800"
            >
              {t('enrollment.core.welcome')}
              <span className="absolute -bottom-[7px] left-1/2 h-3.5 w-3.5 translate-x-1 rotate-45 rounded-[2px] bg-white ring-1 ring-slate-200/60 [clip-path:polygon(100%_0,100%_100%,0_100%)] dark:bg-gray-900 dark:ring-gray-800" aria-hidden />
            </motion.p>
            <motion.span initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 14 }}>
              {/* Enrolled: a green tick that draws itself */}
              <span className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_16px_36px_-12px_rgba(16,185,129,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] ring-[9px] ring-emerald-500/15">
                <DrawnCheck className="h-12 w-12" delay={0.25} />
              </span>
            </motion.span>
            <motion.h2 tabIndex={-1} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease }} className="mt-8 text-[30px] font-extrabold leading-[1.1] tracking-[-0.035em] text-slate-900 sm:text-[40px] dark:text-white">
              {t('enrollment.core.congrats')}
            </motion.h2>
            <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-2.5 text-[16px] text-slate-500 dark:text-gray-400">
              {t('enrollment.core.all_set')}
            </motion.p>

            <motion.dl initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5, ease }} className={cn(card, 'mt-6 w-full divide-y divide-slate-100 px-6 py-1 text-left dark:divide-gray-800')}>
              {summary.map((row, i) => (
                <motion.div key={row.label} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 + i * 0.08 }} className="flex items-center justify-between gap-4 py-3.5">
                  <dt className="text-[15px] text-slate-500 dark:text-gray-400">{row.label}</dt>
                  <dd className={cn('text-right text-[16px] font-semibold', row.good ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white')}>{row.value}</dd>
                </motion.div>
              ))}
            </motion.dl>

            <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.45, ease }} className="mt-6 flex w-full flex-col justify-center gap-3 sm:flex-row">
              <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => navigate('/profile?section=beneficiary')} className="h-14 rounded-2xl bg-blue-600 px-8 text-[17px] font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                {t('enrollment.core.add_beneficiaries')}
              </motion.button>
              <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setBeneWarn(true)} className="inline-flex h-14 items-center justify-center gap-1.5 rounded-2xl bg-white px-8 text-[17px] font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-gray-900 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-800">
                {t('enrollment.core.to_dashboard')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </motion.button>
            </motion.div>
          </div>
        )}
      </main>

      {/* Confirms an edit without adding anything to the page */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.p key={toast.id} initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25, ease }} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-[14px] font-medium text-white shadow-[0_12px_32px_rgba(15,23,42,0.25)] dark:bg-white dark:text-slate-900">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                <DrawnCheck className="h-3 w-3" />
              </span>
              {toast.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <EdgeGlow active={stage === 'working' || stage === 'submitting'} />


      {/* Beneficiary reminder before leaving for the dashboard */}
      <AnimatePresence>
        {beneWarn && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }} onClick={() => setBeneWarn(false)} aria-hidden />
            <motion.div
              ref={beneRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="bene-warn-title"
              aria-describedby="bene-warn-body"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: reduce ? 0 : 0.25, ease }}
              className="relative w-full max-w-[420px] rounded-[24px] bg-white p-6 text-left shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/70 dark:bg-gray-900 dark:ring-gray-800"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
              <h2 id="bene-warn-title" className="mt-4 text-[19px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{t('enrollment.core.bene_warn_title')}</h2>
              <p id="bene-warn-body" className="mt-1.5 text-[15px] leading-[1.55] text-slate-600 dark:text-gray-300">{t('enrollment.core.bene_warn_body')}</p>
              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => navigate('/dashboard')} className="h-11 rounded-xl px-4 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800">
                  {t('enrollment.core.bene_warn_skip')}
                </button>
                <button type="button" onClick={() => navigate('/profile?section=beneficiary')} className="h-11 rounded-xl bg-blue-600 px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  {t('enrollment.core.add_beneficiaries')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* The funds the money goes into, view only */}
      <Sheet open={showFunds} onClose={() => setShowFunds(false)} title={t('enrollment.core.funds_title')} subtitle={`${f.invest} · ${t('enrollment.core.fee', { fee: f.fee.toFixed(2) })}`}>
        <ul className="-mt-2 divide-y divide-slate-100 dark:divide-gray-800">
          {funds.map((r, i) => {
            const meta = fundMeta(r.ticker)
            return (
              <motion.li key={r.ticker} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease }} className="flex items-center gap-3 py-3.5">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: FUND_COLORS[i] }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-slate-900 dark:text-white">{meta?.name ?? r.ticker}</span>
                  <span className="block text-[13px] text-slate-500 dark:text-gray-400">{`${r.ticker}${meta ? ` · ${meta.assetClass} · ${t('enrollment.core.fee', { fee: parseFloat(meta.expense).toFixed(2) })}` : ''}`}</span>
                </span>
                <span className="shrink-0 text-[16px] font-semibold tabular-nums text-slate-900 dark:text-white">{`${r.pct}%`}</span>
              </motion.li>
            )
          })}
        </ul>
      </Sheet>

      <Sheet open={sheet === 'disclosures'} onClose={() => setSheet(null)} title={t('enrollment.core.terms_title')} subtitle={planName}>
        <ul className="space-y-5">
          {PLAN_CONFIG.disclosures.map((id) => (
            <li key={id}>
              <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">{t(`enrollment.agent.disclosures.${id}.title`)}</h3>
              <p className="mt-1 text-[13px] leading-[1.6] text-slate-600 dark:text-gray-300">
                {t(`enrollment.agent.disclosures.${id}.body`, { fee: f.fee.toFixed(2), cap, amount: election.auto.amount.preTax, max: election.auto.cap.preTax }).replace(/\*\*/g, '')}
                {id === 'plan_terms' && (
                  <>
                    {' '}
                    <LegalHrefLink href={LEGAL.termsOfServiceHref} className="font-medium text-blue-700 hover:underline dark:text-blue-300">
                      {t('enrollment.review_page.view_terms')}
                    </LegalHrefLink>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </Sheet>

    </div>
  )
}
