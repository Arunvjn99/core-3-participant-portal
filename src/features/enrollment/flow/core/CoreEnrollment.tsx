import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBlocker, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Check, FileText, Landmark, Loader2, Lock, Pencil, Printer, RotateCcw, RotateCw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { LEGAL, ROUTES } from '@/lib/constants'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { useDialogA11y } from '@/lib/useDialogA11y'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useEnrollmentSave } from '@/core/hooks/useEnrollmentSave'
import { useTheme } from '@/core/hooks/useTheme'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { nextIncreaseDate } from '@/features/plan/electionsData'
import { recommendedFunds, type RiskKey } from '../../investmentCatalog'
import { GROWTH_RATES, buildQuickEnrollmentDefaults } from '../../quickEnrollmentDefaults'
import { useParticipantBasics } from '../../useParticipantBasics'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../../agent/planConfig'
import { checkEligibility, getPlanRules, submitEnrollment } from '../../agent/enrollmentService'
import { blendedFee, fundColor, fundMeta, pause, round2, rowsFor, type Election } from './model'
import { AgentMark, AnimatedNumber, ConfettiField, DrawnCheck, EdgeGlow, InfoTip, ProjectionChart, Sheet, Shimmer } from './ui'
import { AutoIncreaseEditor, ContributionEditor, InvestmentsEditor } from './editors'

/**
 * One-click enrollment: Core AI builds a plan from the details already on file and opens straight on it. The participant
 * reviews one screen, adjusts anything in focused side panels, and approves once. Plan data and submission are simulated
 * (see agent/enrollmentService.ts).
 */

type Stage = 'working' | 'review' | 'submitting' | 'done'
type StepState = 'pending' | 'active' | 'done' | 'error'
type EditKind = 'contribution' | 'auto' | 'invest'
type SheetKind = EditKind | 'disclosures' | 'summary' | null

/** Whether one part of the plan differs between two elections: what the card's Edited tags and the change count compare */
function partChanged(kind: EditKind, a: Election, b: Election): boolean {
  if (kind === 'contribution') return a.preTax !== b.preTax || a.roth !== b.roth || a.afterTax !== b.afterTax || a.unit !== b.unit
  if (kind === 'auto') return JSON.stringify(a.auto) !== JSON.stringify(b.auto)
  return a.mode !== b.mode || a.risk !== b.risk || a.autoRebalance !== b.autoRebalance || a.sdb !== b.sdb || (b.mode === 'own' && JSON.stringify(a.ownRows) !== JSON.stringify(b.ownRows))
}
const EDIT_KINDS: EditKind[] = ['contribution', 'auto', 'invest']

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
  const isDark = useTheme().resolvedMode === 'dark'
  const now = useNow()
  const { saveCompleteEnrollment } = useEnrollmentSave()
  const { employer, periods, birthYear, birthMonth, birthDay, age, knownSalary, salary, retireAge, years, savings } = useParticipantBasics()
  const planName = t('enrollment.rw.plan_name', { employer })

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

  // ── The draft ──
  const initialElection = (): Election => ({
    unit: 'percent',
    preTax: 4,
    roth: 2,
    afterTax: 1,
    auto: { enabled: true, cycle: 'plan_year', sourceWise: false, amount: { preTax: 1, roth: 1 }, cap: { preTax: 10, roth: 10 } },
    mode: 'risk_style',
    risk: 'balanced',
    ownRows: [],
    autoRebalance: false,
    sdb: false,
  })
  const [election, setElection] = useState<Election>(initialElection)
  /** What Core AI first proposed: edits are compared with it, and Reset returns to it */
  const [suggested, setSuggested] = useState<Election | null>(null)
  /** The plan as it was when an edit panel opened, so Cancel can put it back */
  const [snapshot, setSnapshot] = useState<Election | null>(null)
  const [sheet, setSheet] = useState<SheetKind>(null)
  /** Set just before leaving on purpose (to the step-by-step flow), so the discard prompt doesn't stop it */
  const leaving = useRef(false)
  const [showFunds, setShowFunds] = useState(false)
  /** Warns before leaving the confirmation without naming a beneficiary */
  const [beneWarn, setBeneWarn] = useState(false)
  const beneRef = useDialogA11y<HTMLDivElement>(beneWarn, () => setBeneWarn(false))
  const [consent, setConsent] = useState(false)
  /** The contribution source being pointed at, on the bar or its card */
  const [activeSrc, setActiveSrc] = useState<string | null>(null)
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
      balance = (balance + (salary * (rate + e.afterTax)) / 100 + employerMatch(salary, rate)) * (1 + growth)
      out.push(balance)
      rate = Math.min(rate + step, ceiling)
    }
    return out
  }

  // Derived, for any election
  const facts = (e: Election) => {
    const rows = rowsFor(e)
    const total = round2(e.preTax + e.roth + e.afterTax)
    return {
      rows,
      total,
      perCheck: (salary * total) / 100 / periods,
      // After-tax savings aren't matched
      match: employerMatch(salary, round2(e.preTax + e.roth)),
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
  const deferral = round2(election.preTax + election.roth)
  /** Where the contribution goes, by source; the bar is scaled to the auto-increase target */
  const sources = [
    { key: 'preTax', label: t('enrollment.core.src_pre'), pct: election.preTax, bar: 'bg-blue-600' },
    { key: 'roth', label: t('enrollment.core.src_roth'), pct: election.roth, bar: 'bg-indigo-400' },
    { key: 'afterTax', label: t('enrollment.core.src_after'), pct: election.afterTax, bar: 'bg-sky-400' },
  ]
  /** The bar is the whole contribution, split by source, so it is always full */
  const barMax = f.total || 1
  const nextRate = round2(Math.min(deferral + election.auto.amount.preTax, Math.max(election.auto.cap.preTax, deferral)) + election.afterTax)
  const series = projectPath(election)
  const seriesMax = Math.max(...series) || 1
  // Round axis values: about four steps of 1, 2, 2.5 or 5 times a power of ten, topping just above the largest balance
  const yStep = (() => {
    const raw = seriesMax / 4
    const p = 10 ** Math.floor(Math.log10(raw))
    return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? raw
  })()
  const yMax = Math.ceil(seriesMax / yStep) * yStep
  const yTicks = Array.from({ length: Math.round(yMax / yStep) + 1 }, (_, i) => i * yStep)
  const tickLabel = (v: number) => (v === 0 ? '$0' : v >= 1_000_000 ? `$${+(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1_000)}K`)
  const midAge = Math.round((age + retireAge) / 2)
  /** The average yearly return the projection assumes for this investment mix, as a percentage */
  const growthPct = round2(GROWTH_RATES[election.risk] * 100)
  const ready = stage !== 'working' && !problem

  // ── Editing: panels change the plan live; Cancel puts back what was there when the panel opened ──
  const edited = Object.fromEntries(EDIT_KINDS.map((k) => [k, !!suggested && partChanged(k, suggested, election)])) as Record<EditKind, boolean>
  const changeCount = EDIT_KINDS.filter((k) => edited[k]).length
  const canEdit = ready && stage === 'review'
  const editCtx = { salary, periods, locale, now }
  const openEdit = (kind: EditKind) => {
    setSnapshot(election)
    setSheet(kind)
  }
  const cancelEdit = () => {
    if (snapshot) setElection(snapshot)
    setSnapshot(null)
    setSheet(null)
  }
  const doneEdit = (kind: EditKind) => {
    if (snapshot && partChanged(kind, snapshot, election)) {
      const text =
        kind === 'contribution'
          ? t('enrollment.core.toast_contribution', { rate: f.total })
          : kind === 'auto'
            ? election.auto.enabled
              ? t('enrollment.core.toast_auto_on', { amount: election.auto.amount.preTax, max: election.auto.cap.preTax })
              : t('enrollment.core.toast_auto_off')
            : t('enrollment.core.toast_invest', { style: f.invest })
      setToast({ id: Date.now(), text })
    }
    setSnapshot(null)
    setSheet(null)
  }
  const resetToSuggested = () => {
    if (!suggested) return
    setElection(suggested)
    setToast({ id: Date.now(), text: t('enrollment.core.reset_toast') })
  }
  /** Writes the plan as it stands into the enrollment draft, for approval or for the step-by-step flow */
  const writeDraft = (e: Election) => {
    const facts_ = facts(e)
    const total = facts_.total
    const share = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)
    const allocation = Object.fromEntries(facts_.rows.map((r) => [r.ticker, r.pct]))
    const { mergeDraftSection } = useEnrollmentDraftStore.getState()
    const planType = e.roth > e.preTax ? 'roth' : 'traditional'
    mergeDraftSection('plan', { type: planType, planId: planType, planName: planType === 'roth' ? 'Roth 401(k)' : 'Traditional 401(k)' })
    mergeDraftSection('contribution', { percent: total, rate: total, type: 'percentage' })
    mergeDraftSection('source', { preTax: share(e.preTax), roth: share(e.roth), afterTax: share(e.afterTax) })
    mergeDraftSection('autoIncrease', { enabled: e.auto.enabled, amount: e.auto.amount.preTax, max: e.auto.cap.preTax })
    mergeDraftSection('investment', { riskLevel: e.risk, useRecommended: e.mode !== 'own', customAllocation: allocation })
    return allocation
  }
  /** "More options": carry the plan as it stands into the step-by-step flow, at that panel's step */
  const toCustomFlow = (kind: EditKind) => {
    writeDraft(election)
    setSnapshot(null)
    setSheet(null)
    leaving.current = true
    navigate(kind === 'contribution' ? '/enrollment/contribution' : kind === 'auto' ? '/enrollment/auto-increase' : '/enrollment/investment')
  }
  // Leaving with unsaved edits (Cancel, browser back, a link) asks first; closing the tab gets the browser's own prompt
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !leaving.current && stage === 'review' && changeCount > 0 && currentLocation.pathname !== nextLocation.pathname)
  const discardRef = useDialogA11y<HTMLDivElement>(blocker.state === 'blocked', () => blocker.reset?.())
  const summaryRef = useDialogA11y<HTMLDivElement>(sheet === 'summary', () => setSheet(null))
  useEffect(() => {
    if (stage !== 'review' || changeCount === 0) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [stage, changeCount])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(id)
  }, [toast])

  // The plan shows at its natural size and the page scrolls. (It used to shrink itself with CSS zoom to fit the window,
  // but uneven zoom made text blurry, and recalculating it made the whole plan jump.)
  const showPlan = stage !== 'done'

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
    setSuggested(proposed)
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
        afterTaxPercent: share(election.afterTax),
        autoIncrease: { enabled: election.auto.enabled, amount: election.auto.amount.preTax, max: election.auto.cap.preTax },
        allocation,
        consented: consent,
      })
      markSubmit(1, 'done')
      markSubmit(2, 'active')
      const toUnit = (pct: number) => round2(election.unit === 'dollar' ? (pct / 100) * (salary / periods) : pct)
      writeDraft(election)
      useEnrollmentDraftStore.setState((s) => ({
        currentStep: 8,
        highestCompletedStep: Math.max(s.highestCompletedStep, 7),
        draftData: { ...s.draftData, review: { confirmedAt: conf.submittedAt, agreed: true } },
        enrollmentStatus: 'complete',
      }))
      useElectionsStore.getState().applyEnrollment({
        preTaxRate: toUnit(election.preTax),
        rothRate: toUnit(election.roth),
        afterTaxRate: toUnit(election.afterTax),
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
  const summary: { label: string; value: string; sub?: string; good?: boolean }[] = [
    { label: t('enrollment.core.plan_label'), value: planName, sub: t(PLAN_CONFIG.plan.nameKey) },
    {
      label: t('enrollment.core.m_save'),
      value: `${f.total}% · ${money(f.perCheck)}${t(periods === 12 ? 'enrollment.core.unit_month' : 'enrollment.core.unit_paycheck')}`,
      sub: effective ? t('enrollment.core.first_on', { date: dateLong(effective) }) : undefined,
    },
    { label: t('enrollment.core.m_match_short'), value: `+${money(f.match / 12)}${t('enrollment.core.unit_month')}`, good: true },
    { label: t('enrollment.core.row_invest'), value: f.invest },
  ]

  /** Employer adds tooltip: the rule, then what you'd save and get at half the cap, at the cap, and above it */
  const matchPer = `$${(PLAN_CONFIG.match.ratePercent / 100).toFixed(PLAN_CONFIG.match.ratePercent % 100 === 0 ? 0 : 2)}`
  const matchRows = [round2(cap / 2), cap, cap + 2].map((r) => {
    const you = (salary * r) / 100 / 12
    const employer = employerMatch(salary, r) / 12
    return { r, you, employer, total: you + employer }
  })
  const matchTip = (
    <span className="block">
      <span className="block">{t('enrollment.core.match_tip_intro', { per: matchPer, cap })}</span>
      <span className="mt-2 block text-white/60">{t('enrollment.core.match_tip_on', { pay: money(salary / 12) })}</span>
      <span className="mt-1 grid grid-cols-[1.3fr_1fr_1fr] gap-x-3 tabular-nums">
        <span className="py-1 text-[11px] text-white/60">{t('enrollment.core.match_col_you')}</span>
        <span className="py-1 text-right text-[11px] text-white/60">{t('enrollment.core.match_col_employer')}</span>
        <span className="py-1 text-right text-[11px] text-white/60">{t('enrollment.core.match_col_total')}</span>
        {matchRows.map((row) => {
          const best = row.r === cap
          const cell = cn('border-t border-white/10 py-1', best && 'font-semibold text-white')
          return (
            <span key={row.r} className="contents">
              <span className={cell}>{`${row.r}% · ${money(row.you)}`}</span>
              <span className={cn(cell, 'text-right')}>
                {money(row.employer)}
                {row.r > cap && <span className="ml-1 text-[10px] text-white/60">{t('enrollment.core.match_max')}</span>}
              </span>
              <span className={cn(cell, 'text-right')}>{money(row.total)}</span>
            </span>
          )
        })}
      </span>
      <span className="mt-2 block text-white/75">{t('enrollment.core.match_tip_sources')}</span>
    </span>
  )

  // ── Full summary: a one-page form document (like the PDF a plan sends), optional; it can be printed or saved as a PDF.
  //    It is always dark ink on white paper, in the app's dark mode too, because it is a document. ──
  const yesNo = (v: boolean) => t(v ? 'common.yes' : 'common.no')
  /** One boxed field of the form: a small label over its value */
  const sumField = (label: string, value: React.ReactNode, wide = false) => (
    <div className={cn('border-b border-r border-slate-300 px-3 py-2', wide && 'col-span-2 sm:col-span-3')}>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  )
  const sumFields = (children: React.ReactNode) => <dl className="grid grid-cols-2 border-l border-slate-300 sm:grid-cols-3">{children}</dl>
  /** A numbered part of the form: a shaded title bar, then its fields */
  const sumSection = (n: number, title: string, children: React.ReactNode) => (
    <section className="break-inside-avoid">
      <h3 className="flex items-center gap-2 border border-slate-300 bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-800">
        <span className="tabular-nums">{n}.</span>
        {title}
      </h3>
      {children}
    </section>
  )
  /** A note across the full width of a section */
  const sumNote = (text: string) => <p className="border-x border-b border-slate-300 px-3 py-2 text-[12px] leading-[1.5] text-slate-700">{text}</p>
  // The detail behind the summary: what goes in, where it goes, and how the plan changes over the years
  const perYear = (pct: number) => (salary * pct) / 100
  const monthlyIn = (salary * f.total) / 100 / 12
  const autoSchedule = (() => {
    if (!election.auto.enabled) return []
    const rows: { year: number; rate: number }[] = []
    const ceiling = Math.max(election.auto.cap.preTax, deferral)
    let rate = deferral
    let year = nextAuto.getFullYear()
    while (rate < ceiling && rows.length < 12) {
      rate = Math.min(round2(rate + election.auto.amount.preTax), ceiling)
      rows.push({ year, rate: round2(rate + election.afterTax) })
      year += 1
    }
    return rows
  })()
  const byAssetClass = Object.entries(
    f.rows.reduce<Record<string, number>>((acc, r) => {
      const cls = fundMeta(r.ticker)?.assetClass ?? r.ticker
      acc[cls] = (acc[cls] ?? 0) + r.pct
      return acc
    }, {}),
  ).sort((x, y) => y[1] - x[1])
  // Ruled tables, as on a printed form
  const sumTable = 'w-full border-collapse text-left text-[12px]'
  const sumTh = 'border border-slate-300 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500'
  const sumTd = 'border border-slate-300 px-3 py-1.5 tabular-nums text-slate-900'
  const preparedOn = dateLong(new Date(now))
  const summaryDoc = (
    <article aria-labelledby="sum-doc-title" className="mx-auto w-full max-w-[816px] bg-white px-5 py-6 text-slate-900 sm:px-12 sm:py-12">
      {/* Letterhead */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">{employer}</p>
          <h2 id="sum-doc-title" className="mt-1 text-[22px] font-bold leading-tight">{t('enrollment.core.summary_title')}</h2>
          <p className="mt-0.5 text-[13px] text-slate-700">{planName}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-[11px]">
          <dt className="text-slate-500">{t('enrollment.core.sum_plan_id')}</dt>
          <dd className="text-right font-semibold">{PLAN_CONFIG.plan.planId}</dd>
          <dt className="text-slate-500">{t('enrollment.core.sum_prepared_label')}</dt>
          <dd className="text-right font-semibold">{preparedOn}</dd>
        </dl>
      </header>

      <div className="mt-6 space-y-5">
        {sumSection(1, t('enrollment.core.plan_label'), sumFields(
          <>
            {sumField(t('enrollment.core.plan_label'), planName)}
            {sumField(t('enrollment.core.plan_type'), t(PLAN_CONFIG.plan.nameKey))}
            {sumField(t('enrollment.core.sum_employer'), employer)}
          </>,
        ))}

        {sumSection(2, t('enrollment.core.sum_based_on'), sumFields(
          <>
            {sumField(t('enrollment.core.sum_salary'), money(salary))}
            {sumField(t('enrollment.core.sum_paychecks'), t('enrollment.core.sum_paychecks_value', { count: periods }))}
            {sumField(t('enrollment.core.sum_savings'), money(savings))}
            {sumField(t('enrollment.core.sum_age'), t('enrollment.core.sum_age_value', { age }))}
            {sumField(t('enrollment.core.sum_retire_age'), t('enrollment.core.sum_age_value', { age: retireAge }))}
            {sumField(t('enrollment.core.sum_years'), t('enrollment.core.sum_years_value', { count: years }))}
          </>,
        ))}

        {sumSection(3, t('enrollment.core.sheet_contribution'), (
          <>
            {sumFields(
              <>
                {sumField(t('enrollment.core.ed.total'), `${f.total}%`)}
                {sumField(t('enrollment.core.sum_per_paycheck'), money(f.perCheck))}
                {sumField(t('enrollment.core.sum_per_year'), money(perYear(f.total)))}
              </>,
            )}
            <table className={sumTable}>
              <caption className="sr-only">{t('enrollment.core.sum_by_source')}</caption>
              <thead>
                <tr>
                  <th scope="col" className={sumTh}>{t('enrollment.core.sum_source')}</th>
                  <th scope="col" className={cn(sumTh, 'text-right')}>{t('enrollment.core.sum_rate')}</th>
                  <th scope="col" className={cn(sumTh, 'text-right')}>{t('enrollment.core.sum_per_paycheck')}</th>
                  <th scope="col" className={cn(sumTh, 'text-right')}>{t('enrollment.core.sum_per_year')}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => (
                  <tr key={src.key}>
                    <th scope="row" className={cn(sumTd, 'font-normal')}>
                      <span className="block font-semibold">{src.label}</span>
                      <span className="block text-[11px] text-slate-600">{t(`enrollment.core.src_tip_${src.key}`)}</span>
                    </th>
                    <td className={cn(sumTd, 'text-right align-top')}>{`${src.pct}%`}</td>
                    <td className={cn(sumTd, 'text-right align-top')}>{money((salary * src.pct) / 100 / periods)}</td>
                    <td className={cn(sumTd, 'text-right align-top')}>{money(perYear(src.pct))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ))}

        {sumSection(4, t('enrollment.core.m_match_short'), (
          <>
            {sumNote(t('enrollment.core.match_tip_intro', { per: matchPer, cap }))}
            {sumFields(
              <>
                {sumField(t('enrollment.core.sum_matched_rate'), `${Math.min(deferral, cap)}% / ${cap}%`)}
                {sumField(t('enrollment.core.sum_per_month'), `+${money(f.match / 12)}`)}
                {sumField(t('enrollment.core.sum_per_year'), `+${money(f.match)}`)}
                {sumField(
                  t('enrollment.core.sum_status'),
                  f.match >= fullMatch ? t('enrollment.core.m_match_full') : t('enrollment.core.m_match_gap', { amount: `${money((fullMatch - f.match) / 12)}${t('enrollment.core.unit_month')}` }),
                )}
                {sumField(t('enrollment.core.sum_total_in'), `${money(monthlyIn + f.match / 12)}${t('enrollment.core.unit_month')}`, true)}
              </>,
            )}
          </>
        ))}

        {sumSection(5, t('enrollment.core.row_auto'), (
          <>
            {sumFields(
              <>
                {sumField(t('enrollment.core.sum_status'), election.auto.enabled ? t('enrollment.core.auto_enabled') : t('enrollment.core.auto_off_short'))}
                {election.auto.enabled && (
                  <>
                    {sumField(t('enrollment.core.ed.raise_by'), `+${election.auto.amount.preTax}%`)}
                    {sumField(t('enrollment.core.ed.stop_at'), `${election.auto.cap.preTax}%`)}
                    {sumField(t('plan.def.cycle'), t(`enrollment.core.ed.cycle_${election.auto.cycle}`))}
                    {sumField(t('enrollment.core.sum_next_increase'), dateLong(nextAuto))}
                  </>
                )}
              </>,
            )}
            {autoSchedule.length > 0 && (
              <table className={sumTable}>
                <caption className="sr-only">{t('enrollment.core.sum_schedule')}</caption>
                <thead>
                  <tr>
                    <th scope="col" className={sumTh}>{t('enrollment.core.sum_year')}</th>
                    <th scope="col" className={cn(sumTh, 'text-right')}>{t('enrollment.core.sum_your_rate')}</th>
                    <th scope="col" className={cn(sumTh, 'text-right')}>{t('enrollment.core.sum_per_paycheck')}</th>
                  </tr>
                </thead>
                <tbody>
                  {autoSchedule.map((row) => (
                    <tr key={row.year}>
                      <th scope="row" className={cn(sumTd, 'font-semibold')}>{row.year}</th>
                      <td className={cn(sumTd, 'text-right')}>{`${row.rate}%`}</td>
                      <td className={cn(sumTd, 'text-right')}>{money((salary * row.rate) / 100 / periods)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {autoSchedule.length > 0 && election.afterTax > 0 && sumNote(t('enrollment.core.sum_schedule_note', { after: election.afterTax, cap: election.auto.cap.preTax }))}
          </>
        ))}

        {sumSection(6, t('enrollment.core.sheet_invest'), (
          <>
            {sumFields(
              <>
                {sumField(t('enrollment.core.row_invest'), f.invest)}
                {sumField(t('enrollment.core.ed.approach'), t(election.mode === 'own' ? 'enrollment.core.ed.mode_own' : election.mode === 'plan_selected' ? 'enrollment.core.ed.mode_plan' : 'enrollment.core.ed.mode_risk'))}
                {sumField(t('enrollment.core.sum_growth'), `${growthPct}%`)}
                {sumField(t('plan.inv.auto_rebalance'), yesNo(election.autoRebalance))}
                {sumField(t('plan.inv.sdb'), yesNo(election.sdb), true)}
              </>,
            )}
            {sumNote(t('enrollment.core.invest_tip'))}
            {/* The split across funds: one thin bar, then the funds named with their colours, so nothing relies on colour alone */}
            <div className="border-x border-b border-slate-300 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">{t('enrollment.core.sum_allocation')}</p>
              <div className="mt-2 flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`${t('enrollment.core.sum_allocation')}: ${f.rows.map((r) => `${fundMeta(r.ticker)?.name ?? r.ticker} ${r.pct}%`).join(', ')}`}>
                {f.rows.filter((r) => r.pct > 0).map((r) => (
                  <span
                    key={r.ticker}
                    data-print-fill
                    title={`${fundMeta(r.ticker)?.name ?? r.ticker}: ${r.pct}%`}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${r.pct}%`, backgroundColor: fundColor(f.rows.indexOf(r)), minWidth: 4 }}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
            <table className={sumTable}>
              <caption className="sr-only">{t('enrollment.core.ed.funds')}</caption>
              <thead>
                <tr>
                  <th scope="col" className={sumTh}>{t('enrollment.core.ed.funds')}</th>
                  <th scope="col" className={cn(sumTh, 'text-right')}>%</th>
                  <th scope="col" className={cn(sumTh, 'text-right')}>{t('enrollment.core.sum_per_month_all')}</th>
                </tr>
              </thead>
              <tbody>
                {f.rows.map((r, i) => {
                  const meta = fundMeta(r.ticker)
                  return (
                    <tr key={r.ticker}>
                      <th scope="row" className={cn(sumTd, 'font-normal')}>
                        <span className="flex items-start gap-2">
                          <span data-print-fill className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: fundColor(i) }} aria-hidden />
                          <span className="min-w-0">
                            <span className="block font-semibold">{meta?.name ?? r.ticker}</span>
                            <span className="block text-[11px] text-slate-600">{`${r.ticker}${meta ? ` · ${meta.assetClass}` : ''}`}</span>
                          </span>
                        </span>
                      </th>
                      <td className={cn(sumTd, 'text-right align-top font-semibold')}>{`${r.pct}%`}</td>
                      <td className={cn(sumTd, 'text-right align-top')}>{money(((monthlyIn + f.match / 12) * r.pct) / 100)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <table className={cn(sumTable, 'mt-2')}>
              <caption className="sr-only">{t('enrollment.core.sum_by_type')}</caption>
              <thead>
                <tr>
                  <th scope="col" className={sumTh}>{t('enrollment.core.sum_by_type')}</th>
                  <th scope="col" className={cn(sumTh, 'text-right')}>%</th>
                </tr>
              </thead>
              <tbody>
                {byAssetClass.map(([cls, pct]) => (
                  <tr key={cls}>
                    <th scope="row" className={cn(sumTd, 'font-semibold')}>{cls}</th>
                    <td className={cn(sumTd, 'text-right')}>{`${pct}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ))}

        {sumSection(7, t('enrollment.core.m_proj', { age: retireAge }), sumFields(
          <>
            {sumField(t('enrollment.core.m_proj', { age: retireAge }), money(f.projected))}
            {sumField(t('enrollment.core.sum_savings'), money(savings))}
            {sumField(t('enrollment.core.sum_years'), t('enrollment.core.sum_years_value', { count: years }))}
            {sumField(t('enrollment.core.sum_assumes'), `${t('enrollment.core.not_guaranteed')} · ${t('enrollment.core.proj_basis', { rate: growthPct })}`, true)}
          </>,
        ))}
      </div>

      <footer className="mt-8 border-t border-slate-300 pt-3 text-[11px] leading-[1.5] text-slate-600">
        <p>{t('enrollment.core.sum_footnote')}</p>
        <p className="mt-1">{`${planName} · ${PLAN_CONFIG.plan.planId} · ${t('enrollment.core.sum_prepared', { date: preparedOn })}`}</p>
      </footer>
    </article>
  )
  /** Prints only the summary: everything else on the page is hidden while the print dialog is open */
  const printSummary = () => {
    document.body.classList.add('print-summary')
    const done = () => {
      document.body.classList.remove('print-summary')
      window.removeEventListener('afterprint', done)
    }
    window.addEventListener('afterprint', done)
    window.print()
  }

  /** Edit on a row: opens that part's panel */
  const editButton = (kind: EditKind, what: string) =>
    canEdit ? (
      <button
        type="button"
        onClick={() => openEdit(kind)}
        aria-label={t('enrollment.core.edit_what', { what })}
        className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:ring-blue-400/30 dark:hover:bg-blue-500/10"
      >
        <Pencil className="h-3 w-3" aria-hidden />
        {t('enrollment.core.edit')}
      </button>
    ) : null
  /** Marks a row that no longer matches the suggested plan */
  const editedTag = (kind: EditKind) =>
    canEdit && edited[kind] ? (
      <span className="ml-1.5 inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{t('enrollment.core.edited')}</span>
    ) : null
  /** Panel footer: the step-by-step flow on the left, Cancel and Done on the right */
  const editFooter = (kind: EditKind, invalid: boolean) => (
    <>
      <button type="button" onClick={() => toCustomFlow(kind)} title={t('enrollment.core.more_options_title')} className="mr-auto inline-flex items-center gap-1 rounded-md text-[13px] font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:text-white">
        {t('enrollment.core.more_options')}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button type="button" onClick={cancelEdit} className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-slate-900 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-gray-900 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-800">
        {t('enrollment.core.cancel')}
      </button>
      <button type="button" disabled={invalid} onClick={() => doneEdit(kind)} className="inline-flex h-10 items-center rounded-full bg-blue-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
        {t('enrollment.core.done')}
      </button>
    </>
  )

  const card = 'rounded-[24px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 dark:bg-gray-900 dark:ring-gray-800'
  const label = 'text-[14px] font-medium text-slate-500 dark:text-gray-400'

  return (
    <div className="relative -mx-4 -my-6 sm:-mx-6">
      {/* Ambient light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(70%_70%_at_50%_0%,rgba(37,99,235,0.09),transparent_70%)]" aria-hidden />
      {stage === 'done' && <ConfettiField />}

      <main className="relative mx-auto max-w-[1040px] px-4 pb-6 pt-6 sm:px-6">
        {showPlan ? (
          <div ref={planRef} className="space-y-4">
            {/* Title */}
            <div className="flex items-center gap-4 px-1">
              <motion.span initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }} className="rounded-full shadow-[0_10px_24px_rgba(37,99,235,0.28)]">
                <AgentMark size={52} star working={stage === 'working' || stage === 'submitting'} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.03em] text-slate-900 sm:text-[30px] dark:text-white">
                  {ready || stage === 'submitting' ? (
                    <>
                      {t('enrollment.core.ready_lead')}{' '}
                      <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent dark:from-blue-300 dark:to-indigo-300">{t('enrollment.core.ready_word')}</span>
                      {t('enrollment.core.ready_tail')}
                    </>
                  ) : problem ? (
                    t('enrollment.core.st_attention')
                  ) : (
                    <Shimmer>{t('enrollment.core.building')}</Shimmer>
                  )}
                </h1>
                {/* While it's being built, what's happening; the plan's name now sits in the card */}
                {stage === 'working' && !problem && (
                  <div className="mt-0.5 text-[15px] text-slate-500 dark:text-gray-400">
                    <LiveLine steps={workSteps} />
                  </div>
                )}
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

                  {/* Which plan this is */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-slate-100 px-5 py-3.5 sm:px-6 dark:border-gray-800">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" aria-hidden>
                      <Landmark className="h-[18px] w-[18px]" />
                    </span>
                    <p className="min-w-0 flex-1 basis-[180px] truncate text-[17px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{planName}</p>
                    {/* Plan type: beside the name on wider screens, under it on narrow ones */}
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-gray-300">
                      <span className="text-slate-500 dark:text-gray-400">{t('enrollment.core.plan_type')}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{t(PLAN_CONFIG.plan.nameKey)}</span>
                    </span>
                    {/* Optional: every detail in one place, to check or print; enrolling doesn't need it */}
                    {ready && (
                      <button
                        type="button"
                        onClick={() => setSheet('summary')}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:ring-blue-400/30 dark:hover:bg-blue-500/10"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        {t('enrollment.core.summary_open')}
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-[1.05fr_1fr]">
                    {/* You save */}
                    <section className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(label, 'flex items-center')}>
                          {t('enrollment.core.m_save')}
                          {editedTag('contribution')}
                        </p>
                        {editButton('contribution', t('enrollment.core.m_save'))}
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
                          <hr className="my-4 border-slate-100 dark:border-gray-800" />
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{t('enrollment.core.sources_title', { total: f.total })}</p>
                          <ul className="mt-2.5 grid grid-cols-3 gap-2">
                            {sources.map((src) => (
                              <li
                                key={src.key}
                                onMouseEnter={() => setActiveSrc(src.key)}
                                onMouseLeave={() => setActiveSrc(null)}
                                className={cn('rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-transparent transition-shadow dark:bg-gray-800/60', activeSrc === src.key && 'ring-slate-200 dark:ring-gray-700')}
                              >
                                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 dark:text-gray-400">
                                  <span className={cn('h-2 w-2 shrink-0 rounded-full', src.bar)} aria-hidden />
                                  <span className="truncate">{src.label}</span>
                                </span>
                                <span className={cn('mt-0.5 block text-[16px] font-semibold tabular-nums', src.pct > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-500')}>{`${src.pct}%`}</span>
                              </li>
                            ))}
                          </ul>
                          {/* The whole contribution, split by source, right under the tiles it colours */}
                          <div className="relative mt-3">
                            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
                              {sources.map((src, i) => (
                                <motion.span
                                  key={src.key}
                                  tabIndex={src.pct > 0 ? 0 : -1}
                                  role="img"
                                  aria-label={`${src.label}: ${src.pct}%, ${money((salary * src.pct) / 100 / periods)} ${t('enrollment.core.per_paycheck')}. ${t(`enrollment.core.src_tip_${src.key}`)}`}
                                  onMouseEnter={() => setActiveSrc(src.key)}
                                  onMouseLeave={() => setActiveSrc(null)}
                                  onFocus={() => setActiveSrc(src.key)}
                                  onBlur={() => setActiveSrc(null)}
                                  initial={reduce ? false : { width: 0 }}
                                  animate={{ width: `${(src.pct / barMax) * 100}%` }}
                                  transition={{ delay: 0.35 + i * 0.1, duration: 0.7, ease }}
                                  className={cn('h-full cursor-default transition-opacity focus-visible:outline-none', src.bar, activeSrc && activeSrc !== src.key && 'opacity-40')}
                                />
                              ))}
                            </div>
                            {(() => {
                              const i = sources.findIndex((s) => s.key === activeSrc)
                              if (i < 0) return null
                              const src = sources[i]
                              const before = sources.slice(0, i).reduce((sum, s) => sum + s.pct, 0)
                              const center = ((before + src.pct / 2) / barMax) * 100
                              return (
                                <div
                                  className="pointer-events-none absolute top-full z-20 mt-2 w-max max-w-[220px] rounded-lg bg-slate-900 px-3 py-2 text-left text-[12px] leading-snug text-white shadow-lg dark:bg-white dark:text-slate-900"
                                  style={{ left: `${center}%`, transform: `translateX(${center > 70 ? '-85%' : center < 30 ? '-15%' : '-50%'})` }}
                                  aria-hidden
                                >
                                  <p className="font-semibold">{`${src.label} · ${src.pct}% · ${money((salary * src.pct) / 100 / periods)} ${t('enrollment.core.per_paycheck')}`}</p>
                                  <p className="mt-0.5 text-white/75 dark:text-slate-600">{t(`enrollment.core.src_tip_${src.key}`)}</p>
                                </div>
                              )
                            })()}
                          </div>
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
                    <section className="flex flex-col border-t border-slate-100 bg-gradient-to-b from-slate-50/70 to-white p-5 sm:p-6 md:border-l md:border-t-0 dark:border-gray-800 dark:from-gray-800/30 dark:to-gray-900">
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
                          </p>
                          <p className="text-[12px] leading-snug text-slate-500 dark:text-gray-400">
                            <span className="font-semibold text-amber-700 dark:text-amber-400">{t('enrollment.core.not_guaranteed')}</span>{' · '}
                            {t('enrollment.core.proj_basis', { rate: growthPct })}
                          </p>
                          {/* Balance (y) by age (x): round values on light gridlines, no heavy axis lines; the plot fills the rest of the section */}
                          <div className="mt-5 flex min-h-[150px] flex-1 flex-col">
                            <div className="relative min-h-0 flex-1 pl-10">
                              {yTicks.map((v) => (
                                <div key={v} className="pointer-events-none absolute inset-x-0" style={{ top: `${(1 - v / yMax) * 100}%` }} aria-hidden>
                                  <span className="absolute left-0 w-8 -translate-y-1/2 text-right text-[11px] leading-none tabular-nums text-slate-400 dark:text-gray-500">{tickLabel(v)}</span>
                                  <span className={cn('absolute left-10 right-0 border-t', v === 0 ? 'border-slate-200 dark:border-gray-700' : 'border-dashed border-slate-200/70 dark:border-gray-800')} />
                                </div>
                              ))}
                              <div className="relative h-full [&_svg]:!h-full">
                                <ProjectionChart
                                  key={`${f.total}-${election.risk}`}
                                  points={series}
                                  startAge={age}
                                  height={100}
                                  yMax={yMax}
                                  delay={0.6}
                                  format={compact}
                                  label={t('enrollment.core.chart_label')}
                                  pointLabel={(a, value) => t('enrollment.core.chart_point', { age: a, value })}
                                />
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between pl-10 text-[11px] tabular-nums text-slate-400 dark:text-gray-500" aria-hidden>
                              <span>{t('enrollment.core.today', { age })}</span>
                              <span>{t('enrollment.core.at_age', { age: midAge })}</span>
                              <span>{t('enrollment.core.at_age', { age: retireAge })}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <Bone className="h-10 w-40" />
                          <Bone className="h-[150px] w-full" />
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
                          wide
                          text={matchTip}
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
                            <p className="mt-1 flex items-center gap-1 text-[14px] font-medium text-emerald-800 dark:text-emerald-300">
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
                        <p className={cn(label, 'flex items-center gap-0.5')}>
                          {t('enrollment.core.row_auto')}
                          <InfoTip side="top" label={t('enrollment.core.row_auto')} text={t('enrollment.core.auto_tip')} />
                          {editedTag('auto')}
                        </p>
                        {editButton('auto', t('enrollment.core.row_auto'))}
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
                          {/* Status leads the detail line, so the figures above stay clean */}
                          {election.auto.enabled ? (
                            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[14px] text-slate-500 dark:text-gray-400">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden />
                                {t('enrollment.core.auto_enabled')}
                              </span>
                              <span aria-hidden>·</span>
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
                        <p className={cn(label, 'flex items-center gap-0.5')}>
                          {t('enrollment.core.row_invest')}
                          <InfoTip side="top" label={t('enrollment.core.row_invest')} text={t('enrollment.core.invest_tip')} />
                          {editedTag('invest')}
                        </p>
                        {editButton('invest', t('enrollment.core.row_invest'))}
                      </div>
                      {ready ? (
                        <>
                          <p className="mt-1.5 truncate text-[22px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">{f.invest}</p>
                          <p className="mt-1 text-[14px] text-slate-500 dark:text-gray-400">
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
                    {stage === 'review' && !submitError && changeCount > 0 && <span className="text-[13px] font-medium opacity-80">{`· ${t('enrollment.core.approve_changes', { count: changeCount })}`}</span>}
                  </motion.button>
                </motion.div>

                {/* Leave without enrolling */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button type="button" onClick={() => navigate(ROUTES.PRE_ENROLLMENT_DASHBOARD)} disabled={stage === 'submitting'} className="h-10 rounded-full bg-white px-5 text-[14px] font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-800 dark:hover:bg-gray-800">
                    {t('enrollment.core.cancel')}
                  </button>
                  {canEdit && changeCount > 0 && (
                    <button type="button" onClick={resetToSuggested} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white">
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      {t('enrollment.core.reset_suggested')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Enrolled */
          <div className="relative mx-auto flex max-w-[600px] flex-col items-center pt-8 text-center">
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
                <motion.div key={row.label} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 + i * 0.08 }} className="flex items-start justify-between gap-4 py-3.5">
                  <dt className="pt-px text-[15px] text-slate-500 dark:text-gray-400">{row.label}</dt>
                  <dd className="text-right">
                    <span className={cn('block text-[16px] font-semibold', row.good ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white')}>{row.value}</span>
                    {row.sub && <span className="mt-0.5 block text-[13px] text-slate-500 dark:text-gray-400">{row.sub}</span>}
                  </dd>
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
      <Sheet open={showFunds} stacked={sheet === 'invest'} onClose={() => setShowFunds(false)} title={t('enrollment.core.funds_title')} subtitle={f.invest}>
        <ul className="-mt-2 divide-y divide-slate-100 dark:divide-gray-800">
          {funds.map((r, i) => {
            const meta = fundMeta(r.ticker)
            return (
              <motion.li key={r.ticker} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease }} className="flex items-center gap-3 py-3.5">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: fundColor(i, isDark) }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-slate-900 dark:text-white">{meta?.name ?? r.ticker}</span>
                  <span className="block text-[13px] text-slate-500 dark:text-gray-400">{`${r.ticker}${meta ? ` · ${meta.assetClass}` : ''}`}</span>
                </span>
                <span className="shrink-0 text-[16px] font-semibold tabular-nums text-slate-900 dark:text-white">{`${r.pct}%`}</span>
              </motion.li>
            )
          })}
        </ul>
      </Sheet>

      {/* Full summary as a document preview: a sheet of paper on a dim backdrop, with Close and Print or save as PDF above it */}
      <AnimatePresence>
        {sheet === 'summary' && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col bg-slate-900/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
          >
            <div ref={summaryRef} role="dialog" aria-modal="true" aria-labelledby="sum-doc-title" className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 text-white sm:px-6">
                <p className="min-w-0 truncate text-[14px] font-semibold">{t('enrollment.core.summary_title')}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => setSheet(null)} className="inline-flex h-9 items-center rounded-full px-4 text-[14px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    {t('enrollment.core.close')}
                  </button>
                  <button type="button" onClick={printSummary} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                    <Printer className="h-4 w-4" aria-hidden />
                    {t('enrollment.core.summary_print')}
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-10" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="mx-auto w-full max-w-[816px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
                >
                  {summaryDoc}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {ready &&
        createPortal(
          <div data-print-summary className="hidden">
            {summaryDoc}
          </div>,
          document.body,
        )}

      {/* Edit panels: changes show on the card as they are made; Done keeps them, Cancel puts back what was there */}
      <Sheet preview open={sheet === 'contribution'} onClose={cancelEdit} title={t('enrollment.core.sheet_contribution')} subtitle={t('enrollment.core.sheet_sub')} footer={editFooter('contribution', rateError)}>
        <ContributionEditor value={election} onChange={setElection} ctx={editCtx} />
      </Sheet>
      <Sheet preview open={sheet === 'auto'} onClose={cancelEdit} title={t('enrollment.core.sheet_auto')} subtitle={t('enrollment.core.sheet_sub')} footer={editFooter('auto', false)}>
        <AutoIncreaseEditor value={election} onChange={setElection} ctx={editCtx} />
      </Sheet>
      <Sheet preview open={sheet === 'invest'} onClose={cancelEdit} title={t('enrollment.core.sheet_invest')} subtitle={t('enrollment.core.sheet_sub')} footer={editFooter('invest', fundsError)}>
        <InvestmentsEditor value={election} onChange={setElection} onViewAll={() => setShowFunds(true)} />
      </Sheet>

      {/* Leaving with edits that aren't approved yet */}
      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }} onClick={() => blocker.reset()} aria-hidden />
            <motion.div
              ref={discardRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="discard-title"
              aria-describedby="discard-body"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: reduce ? 0 : 0.25, ease }}
              className="relative w-full max-w-[420px] rounded-[24px] bg-white p-6 text-left shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/70 dark:bg-gray-900 dark:ring-gray-800"
            >
              <h2 id="discard-title" className="text-[19px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{t('enrollment.core.discard_title')}</h2>
              <p id="discard-body" className="mt-1.5 text-[15px] leading-[1.55] text-slate-600 dark:text-gray-300">{t('enrollment.core.discard_body', { count: changeCount })}</p>
              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => blocker.proceed()} className="h-11 rounded-xl px-4 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800">
                  {t('enrollment.core.discard_leave')}
                </button>
                <button type="button" onClick={() => blocker.reset()} className="h-11 rounded-xl bg-blue-600 px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  {t('enrollment.core.discard_keep')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sheet
        open={sheet === 'disclosures'}
        onClose={() => setSheet(null)}
        title={t('enrollment.core.terms_title')}
        subtitle={planName}
        footer={
          <>
            <button type="button" onClick={() => setSheet(null)} className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-slate-900 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-gray-900 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-800">
              {t('enrollment.core.cancel')}
            </button>
            {/* Agreeing here ticks the consent box on the page, the same as ticking it directly */}
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                setConsent(true)
                setSheet(null)
              }}
              className="inline-flex h-10 items-center rounded-full bg-blue-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('enrollment.core.agree')}
            </button>
          </>
        }
      >
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
