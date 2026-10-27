import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  Flag,
  Gift,
  Loader2,
  Lock,
  MapPin,
  PieChart,
  Pencil,
  RotateCw,
  Search,
  Settings2,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { LEGAL } from '@/lib/constants'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { ALL_US_STATES, POPULAR_LOCATIONS } from '@/lib/usStates'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useEnrollmentSave } from '@/core/hooks/useEnrollmentSave'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PERIODS, nextIncreaseDate } from '@/features/plan/electionsData'
import { PlanFundsTable } from '@/features/plan/PlanFundsTable'
import { useProfileStore } from '@/features/profile/profileStore'
import { recommendedFunds, type RiskKey } from '../../investmentCatalog'
import { ageFromBirth, buildQuickEnrollmentDefaults, projectBalance } from '../../quickEnrollmentDefaults'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../../agent/planConfig'
import { checkEligibility, getPlanRules, submitEnrollment } from '../../agent/enrollmentService'
import { AutoIncreaseEditor, ContributionEditor, InvestmentsEditor } from './editors'
import { FUND_COLORS, blendedFee, pause, round2, rowsFor, sameElection, type Election } from './model'
import { AgentMark, AnimatedNumber, Confetti, DrawnCheck, EdgeGlow, InfoTip, Sheet, Shimmer, Sparkline, StatusPill, StreamText, Switch } from './ui'

/**
 * Core AI enrollment: the participant gives the agent the two things their record doesn't hold, watches it do the work,
 * reviews one living draft, and approves it once. Edits happen in focused side panels and come back into the
 * conversation as short updates. Plan data and submission are simulated (see agent/enrollmentService.ts).
 */

type Stage = 'ask' | 'working' | 'review' | 'submitting' | 'done'
type StepState = 'pending' | 'active' | 'done' | 'error'
type SheetKind = 'contribution' | 'auto' | 'invest' | 'disclosures' | null
type Update = { id: number; changes: { label: string; from: string; to: string }[]; reapprove: boolean }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WORK_STEPS = 6
const SUBMIT_STEPS = 3
const SAVINGS_PRESETS = [0, 10_000, 50_000, 100_000]
const ease = [0.22, 1, 0.36, 1] as const

// ── Conversation pieces ──

function AgentTurn({ children, working = false, delay = 0 }: { children: React.ReactNode; working?: boolean; delay?: number }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  return (
    <motion.section initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay }} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3">
      <AgentMark size={28} working={working} />
      <div className="min-w-0">
        <p className="flex h-7 items-center text-[13px] font-semibold text-slate-900 dark:text-white">{t('enrollment.core.agent')}</p>
        <div className="mt-1 space-y-3">{children}</div>
      </div>
    </motion.section>
  )
}

function UserTurn({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="flex justify-end">
      <div className="max-w-[85%] rounded-[18px] rounded-tr-md bg-white px-4 py-2.5 text-[14px] leading-[1.5] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/80 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-800">{children}</div>
    </motion.div>
  )
}

/**
 * The agent's work log. While it works it's a single live line: the current step slides in and replaces the last one.
 * Once finished it folds into a summary ("Worked for 4s") that expands to every step.
 */
function WorkLog({ title, doneTitle, steps, open, onToggle }: { title: string; doneTitle: string; steps: { state: StepState; label: string; activeLabel?: string; detail?: string }[]; open: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const active = steps.findIndex((s) => s.state === 'active')
  const failed = steps.find((s) => s.state === 'error')
  const finished = steps.filter((s) => s.state === 'done' || s.state === 'error')

  if (active >= 0) {
    const s = steps[active]
    return (
      <div className="flex h-6 items-center gap-2.5" role="status" aria-label={title}>
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" aria-hidden />
        <div className="relative h-5 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.p
              key={s.activeLabel ?? s.label}
              initial={reduce ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: -16, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="absolute inset-0 truncate text-[13px] font-medium leading-5"
            >
              <Shimmer>{s.activeLabel ?? s.label}</Shimmer>
            </motion.p>
          </AnimatePresence>
        </div>
        <span className="shrink-0 text-[12px] tabular-nums text-slate-400">{t('enrollment.core.step_of', { n: active + 1, total: steps.length })}</span>
      </div>
    )
  }

  return (
    <div>
      <button type="button" onClick={onToggle} aria-expanded={open} className="group inline-flex items-center gap-2 text-[13px] text-slate-500 transition-colors hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200">
        {failed ? <X className="h-3.5 w-3.5 text-red-600" strokeWidth={3} aria-hidden /> : <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} aria-hidden />}
        <span className={cn('font-medium', failed && 'text-red-600')}>{failed ? `${doneTitle} · ${failed.label}` : doneTitle}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {failed?.detail && !open && <p className="mt-1 pl-[22px] text-[12px] text-slate-500 dark:text-gray-400">{failed.detail}</p>}
      <AnimatePresence initial={false}>
        {open && (
          <motion.ol initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease }} className="relative mt-3 overflow-hidden pl-1">
            {finished.map((s, i) => (
              <li key={s.label} className="relative flex gap-3 pb-3 last:pb-0">
                {i < finished.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%-12px)] w-px bg-slate-200 dark:bg-gray-700" aria-hidden />}
                <span className="relative mt-[3px] flex h-[15px] w-[15px] shrink-0 items-center justify-center">
                  {s.state === 'done' ? (
                    <span className="flex h-[15px] w-[15px] items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />
                    </span>
                  ) : (
                    <span className="flex h-[15px] w-[15px] items-center justify-center rounded-full bg-red-600 text-white">
                      <X className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-[1.4] text-slate-800 dark:text-gray-100">{s.label}</span>
                  {s.detail && <span className="mt-0.5 block text-[12px] leading-[1.5] text-slate-500 dark:text-gray-400">{s.detail}</span>}
                </span>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  )
}

/** One line of the draft: what it is, what Core AI chose, why, and a way to change it. */
function DraftRow({ icon: Icon, label, value, reason, onEdit, editLabel, aside, children, index = 0 }: { icon: typeof Gift; label: string; value: React.ReactNode; reason?: React.ReactNode; onEdit?: () => void; editLabel: string; aside?: React.ReactNode; children?: React.ReactNode; index?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 + index * 0.1, duration: 0.4, ease }} className="group relative flex gap-3 px-4 py-1.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-gray-800/30">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-0.5 text-[11px] font-medium leading-4 text-slate-500 dark:text-gray-400">
              {label}
              {typeof reason === 'string' && <InfoTip label={label} text={reason} />}
            </p>
            <p className="truncate text-[14px] font-semibold leading-5 text-slate-900 dark:text-white">{value}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {aside}
            {onEdit && (
              <button type="button" onClick={onEdit} aria-label={editLabel} className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-slate-500 opacity-80 transition-all hover:bg-white hover:text-slate-900 hover:opacity-100 hover:shadow-[0_0_0_1px_rgba(15,23,42,0.08)] group-hover:opacity-100 dark:hover:bg-gray-900 dark:hover:text-white">
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{editLabel}</span>
              </button>
            )}
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  )
}

export default function CoreEnrollment() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const now = useNow()
  const { saveCompleteEnrollment } = useEnrollmentSave()
  const draft = useEnrollmentDraftStore((s) => s.draftData)
  const personal = useProfileStore((s) => s.personal)
  const employment = useProfileStore((s) => s.employment)
  const periods = PERIODS[employment.payrollFrequency] ?? 12

  // ── What the record already holds ──
  const p = draft.personalization ?? {}
  const dob = personal.dob ? new Date(`${personal.dob}T00:00:00`) : null
  const birthYear = dob?.getFullYear() ?? p.birthYear ?? 1975
  const birthMonth = dob ? MONTHS[dob.getMonth()] : (p.birthMonth ?? 'January')
  const birthDay = dob?.getDate() ?? p.birthDay ?? 1
  const age = ageFromBirth(birthYear, birthMonth, birthDay)
  const knownSalary = draft.savings?.salary ?? p.salary
  const salary = knownSalary || 85_000
  const retireAge = Math.max(p.retirementAge ?? 65, age + 1)
  const years = retireAge - age
  const firstName = personal.firstName || t('enrollment.core.there')
  const planName = `${employment.employer} ${t('enrollment.rw.plan_name')}`

  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`
  const compact = (v: number) => (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1_000).toLocaleString(locale)}K`)
  const level = (r: RiskKey) => t(`enrollment.investment.level_${r}`)
  const dateLong = (d: Date) => d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })

  // ── Conversation state ──
  const [stage, setStage] = useState<Stage>('ask')
  const [location, setLocation] = useState<string | null>(null)
  const [locQuery, setLocQuery] = useState('')
  const [savings, setSavings] = useState<number | null>(null)
  const [otherAmount, setOtherAmount] = useState(false)
  const [steps, setSteps] = useState<StepState[]>(Array(WORK_STEPS).fill('pending'))
  const [problem, setProblem] = useState<'ineligible' | 'rules' | null>(null)
  const [logOpen, setLogOpen] = useState(true)
  const [timing, setTiming] = useState({ start: 0, end: 0, submitStart: 0, submitEnd: 0 })
  const [submitSteps, setSubmitSteps] = useState<StepState[]>(Array(SUBMIT_STEPS).fill('pending'))
  const [submitLogOpen, setSubmitLogOpen] = useState(true)
  const [submitError, setSubmitError] = useState(false)
  const [effective, setEffective] = useState<Date | null>(null)
  const rulesAttempt = useRef(0)
  const bottom = useRef<HTMLDivElement>(null)
  const draftRef = useRef<HTMLElement>(null)
  /** How much the draft is scaled so the whole card fits the window (1 = natural size) */
  const [fit, setFit] = useState(1)
  const main = useRef<HTMLElement>(null)

  // ── The draft ──
  const initialElection = (): Election => ({
    unit: 'percent',
    preTax: 6,
    roth: 0,
    auto: { enabled: true, cycle: 'calendar_year', sourceWise: false, amount: { preTax: 1, roth: 1 }, cap: { preTax: 10, roth: 10 } },
    mode: 'risk_style',
    risk: 'balanced',
    ownRows: [],
    autoRebalance: false,
    sdb: false,
  })
  const [election, setElection] = useState<Election>(initialElection)
  /** What Core AI first proposed, so its report keeps describing its own work after the participant edits */
  const [baseline, setBaseline] = useState<Election>(initialElection)
  const [updates, setUpdates] = useState<Update[]>([])
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [staged, setStaged] = useState<Election>(initialElection)
  const [showFunds, setShowFunds] = useState(false)
  const [consent, setConsent] = useState(false)

  const wait = (ms: number) => pause(reduce ? 0 : ms)

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
      projected: projectBalance({ ...buildQuickEnrollmentDefaults(draft), contributionPercent: total, riskLevel: e.risk, salary, currentAge: age, retirementAge: retireAge }, savings ?? 0),
      tax: e.preTax > 0 && e.roth > 0 ? t('enrollment.core.tax_mix', { pre: e.preTax, roth: e.roth }) : e.roth > 0 ? t('enrollment.core.tax_roth') : t('enrollment.core.tax_pre'),
      invest: e.mode === 'plan_selected' ? t('enrollment.core.inv_plan') : e.mode === 'own' ? t('enrollment.core.inv_own') : t('enrollment.core.inv_risk', { level: level(e.risk) }),
      auto: e.auto.enabled ? t('enrollment.core.auto_short', { amount: e.auto.amount.preTax, max: e.auto.cap.preTax }) : t('enrollment.core.auto_off_short'),
      options: [e.autoRebalance ? t('plan.inv.auto_rebalance') : null, e.sdb ? t('plan.inv.sdb') : null].filter(Boolean).join(' · ') || t('enrollment.core.options_none'),
    }
  }
  const f = facts(election)
  const fb = facts(baseline)
  const cap = PLAN_CONFIG.match.capPercent
  const fullMatch = employerMatch(salary, cap)
  const rateError = f.total < PLAN_LIMITS.rate[0] || f.total > PLAN_LIMITS.rate[1]
  const fundsError = f.rowsTotal !== 100
  const canApprove = consent && !rateError && !fundsError && stage === 'review'
  const nextAuto = nextIncreaseDate(election.auto.cycle, now, now)
  const series = Array.from({ length: years + 1 }, (_, i) =>
    i === 0 ? (savings ?? 0) : projectBalance({ ...buildQuickEnrollmentDefaults(draft), contributionPercent: f.total, riskLevel: election.risk, salary, currentAge: age, retirementAge: age + i }, savings ?? 0),
  )

  // Keep the newest turn in view: follow the conversation as it grows, unless the participant scrolls up to reread
  const follow = useRef(true)
  const autoAt = useRef(0)
  const toLatest = (smooth: boolean) => {
    autoAt.current = Date.now()
    bottom.current?.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'end' })
  }
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() - autoAt.current < 700) return
      follow.current = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 240
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (stage === 'ask' || !main.current) return
    const ro = new ResizeObserver(() => {
      if (follow.current) toLatest(true)
    })
    ro.observe(main.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, reduce])
  // A new turn always brings the view back to the latest message
  useEffect(() => {
    if (stage === 'ask') return
    follow.current = true
    const id = window.setTimeout(() => toLatest(true), 60)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, updates.length, submitError, problem])

  // Keep the whole draft on one screen: if its natural height is taller than the window, scale it down a little
  const showDraft = stage === 'review' || stage === 'submitting' || stage === 'done'
  useLayoutEffect(() => {
    const el = draftRef.current
    if (!showDraft || !el) return
    let current = parseFloat(getComputedStyle(el).zoom) || 1
    const measure = () => {
      // The visible height divided by the zoom in effect gives the card's natural height
      const natural = el.getBoundingClientRect().height / (parseFloat(getComputedStyle(el).zoom) || 1)
      const top = document.querySelector('header.sticky')?.getBoundingClientRect().bottom ?? 0
      const available = window.innerHeight - Math.max(top, 0) - 24
      const next = Math.round(Math.max(0.82, Math.min(1, available / natural)) * 100) / 100
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
  }, [showDraft])

  // ── The work ──
  const markStep = (i: number, s: StepState) => setSteps((all) => all.map((x, j) => (j === i ? s : x)))

  const run = async () => {
    setProblem(null)
    setStage('working')
    setLogOpen(true)
    setSteps(['active', ...Array(WORK_STEPS - 1).fill('pending')])
    setTiming((x) => ({ ...x, start: Date.now() }))
    await wait(500)
    const eligibility = await checkEligibility(age)
    if (!eligibility.eligible) {
      markStep(0, 'error')
      setProblem('ineligible')
      return
    }
    markStep(0, 'done')
    markStep(1, 'active')
    await wait(400)
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
      preTax: d.contributionPercent,
      roth: 0,
      risk,
      ownRows: recommendedFunds(risk).map((x) => ({ ticker: x.ticker, pct: x.allocation })),
      auto: { enabled: d.autoIncrease.enabled, cycle: 'calendar_year', sourceWise: false, amount: { preTax: d.autoIncrease.amount, roth: d.autoIncrease.amount }, cap: { preTax: d.autoIncrease.max, roth: d.autoIncrease.max } },
    }
    setElection(proposed)
    setBaseline(proposed)
    for (let i = 2; i < WORK_STEPS; i++) {
      markStep(i, 'active')
      await wait(i === WORK_STEPS - 1 ? 400 : 560)
      markStep(i, 'done')
    }
    setTiming((x) => ({ ...x, end: Date.now() }))
    await wait(250)
    setLogOpen(false)
    setStage('review')
  }

  const start = () => {
    const { mergeDraftSection } = useEnrollmentDraftStore.getState()
    mergeDraftSection('personalization', {
      birthMonth,
      birthYear,
      birthDay,
      currentAge: age,
      retirementAge: retireAge,
      selectedLocation: location ?? '',
      savingsAmount: savings ?? 0,
      ...(knownSalary ? { salary: knownSalary } : {}),
    })
    void run()
  }

  // ── Edits ──
  const openSheet = (k: Exclude<SheetKind, null>) => {
    setStaged(election)
    setSheet(k)
  }
  const describe = (e: Election) => {
    const x = facts(e)
    return [
      { key: 'rate', label: t('enrollment.core.row_contribution'), text: `${x.total}% · ${x.tax}` },
      { key: 'auto', label: t('enrollment.core.row_auto'), text: x.auto },
      { key: 'invest', label: t('enrollment.core.row_invest'), text: `${x.invest} · ${t('enrollment.core.funds_n', { count: x.rows.length })}` },
      { key: 'options', label: t('enrollment.core.row_options'), text: x.options },
    ]
  }
  const commit = (next: Election) => {
    if (sameElection(next, election)) return
    const before = describe(election)
    const after = describe(next)
    const changes = after.filter((a, i) => a.text !== before[i].text).map((a, i) => ({ label: a.label, from: before.find((b) => b.key === a.key)?.text ?? '', to: a.text, i }))
    setElection(next)
    setUpdates((u) => [...u, { id: Date.now(), changes: changes.map(({ label, from, to }) => ({ label, from, to })), reapprove: consent }])
    setConsent(false)
    setSubmitError(false)
  }
  const applySheet = () => {
    commit(staged)
    setSheet(null)
  }
  const stagedFacts = facts(staged)
  const stagedInvalid = sheet === 'contribution' ? stagedFacts.total < PLAN_LIMITS.rate[0] || stagedFacts.total > PLAN_LIMITS.rate[1] : sheet === 'invest' ? stagedFacts.rowsTotal !== 100 : false

  // ── Approval ──
  const markSubmit = (i: number, s: StepState) => setSubmitSteps((all) => all.map((x, j) => (j === i ? s : x)))
  const approve = async () => {
    if (!canApprove) return
    setSubmitError(false)
    setStage('submitting')
    setSubmitLogOpen(true)
    setSubmitSteps(['active', 'pending', 'pending'])
    setTiming((x) => ({ ...x, submitStart: Date.now() }))
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
      setTiming((x) => ({ ...x, submitEnd: Date.now() }))
      await wait(250)
      setSubmitLogOpen(false)
      setStage('done')
    } catch {
      markSubmit(1, 'error')
      setSubmitError(true)
      setStage('review')
    }
  }

  // ── Status ──
  const status: { tone: 'blue' | 'amber' | 'green' | 'red'; label: string } = problem
    ? { tone: 'red', label: t('enrollment.core.st_attention') }
    : stage === 'ask'
      ? { tone: 'amber', label: t('enrollment.core.st_input') }
      : stage === 'working'
        ? { tone: 'blue', label: t('enrollment.core.st_working') }
        : stage === 'submitting'
          ? { tone: 'blue', label: t('enrollment.core.st_submitting') }
          : stage === 'done'
            ? { tone: 'green', label: t('enrollment.core.st_done') }
            : { tone: 'blue', label: t('enrollment.core.st_review') }

  const secs = (a: number, b: number) => Math.max(1, Math.round((b - a) / 1000))
  const workSteps = [
    { label: t('enrollment.core.s1'), activeLabel: t('enrollment.core.s1_ing'), detail: problem === 'ineligible' ? t('enrollment.core.s1_fail', { min: PLAN_CONFIG.eligibility.minAge }) : t('enrollment.core.s1_d', { age, min: PLAN_CONFIG.eligibility.minAge }) },
    { label: t('enrollment.core.s2'), activeLabel: t('enrollment.core.s2_ing'), detail: problem === 'rules' ? t('enrollment.core.s2_fail') : t('enrollment.core.s2_d', { rate: PLAN_CONFIG.match.ratePercent, cap, min: PLAN_LIMITS.rate[0], max: PLAN_LIMITS.rate[1] }) },
    { label: t('enrollment.core.s3'), activeLabel: t('enrollment.core.s3_ing'), detail: t('enrollment.core.s3_d', { rate: fb.total, amount: money(fb.match) }) },
    { label: t('enrollment.core.s4'), activeLabel: t('enrollment.core.s4_ing'), detail: t('enrollment.core.s4_d', { level: level(baseline.risk).toLowerCase(), years, count: fb.rows.length, fee: fb.fee.toFixed(2) }) },
    { label: t('enrollment.core.s5'), activeLabel: t('enrollment.core.s5_ing'), detail: t('enrollment.core.s5_d', { amount: compact(fb.projected), age: retireAge }) },
    { label: t('enrollment.core.s6'), activeLabel: t('enrollment.core.s6_ing'), detail: t('enrollment.core.s6_d') },
  ].map((s, i) => ({ ...s, state: steps[i] }))
  const submitLog = [
    { label: t('enrollment.core.u1'), activeLabel: t('enrollment.core.u1_ing'), detail: t('enrollment.core.u1_d') },
    { label: t('enrollment.core.u2'), activeLabel: t('enrollment.core.u2_ing'), detail: submitSteps[1] === 'error' ? t('enrollment.core.u2_fail') : t('enrollment.core.u2_d', { plan: planName }) },
    { label: t('enrollment.core.u3'), activeLabel: t('enrollment.core.u3_ing'), detail: t('enrollment.core.u3_d') },
  ].map((s, i) => ({ ...s, state: submitSteps[i] }))

  const popular = POPULAR_LOCATIONS.slice(0, 4)
  const matches = locQuery.trim() ? ALL_US_STATES.filter((st) => st.toLowerCase().includes(locQuery.trim().toLowerCase())).slice(0, 6) : []
  const answered = location !== null && savings !== null

  const record = [
    { icon: CalendarClock, label: t('enrollment.core.rec_dob'), value: t('enrollment.core.rec_dob_v', { date: new Date(birthYear, MONTHS.indexOf(birthMonth), birthDay).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }), age }) },
    { icon: Briefcase, label: t('enrollment.core.rec_salary'), value: money(salary) },
    { icon: CircleDollarSign, label: t('enrollment.core.rec_pay'), value: t(`enrollment.core.pay_${employment.payrollFrequency}`) },
    { icon: Flag, label: t('enrollment.core.rec_retire'), value: String(retireAge) },
  ]

  return (
    <div className="relative -mx-4 -my-6 min-h-[calc(100vh-3rem)] sm:-mx-6">
      {/* Ambient light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" aria-hidden />

      {/* Task header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f5f6f8]/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex h-14 max-w-[760px] items-center gap-3 px-4 sm:px-6">
          <AgentMark size={24} working={stage === 'working' || stage === 'submitting'} />
          <h1 className="flex min-w-0 flex-1 items-center gap-2 text-[14px]">
            <span className="whitespace-nowrap font-semibold text-slate-900 dark:text-white">{t('enrollment.core.agent')}</span>
            <span className="hidden text-slate-300 sm:inline dark:text-gray-600" aria-hidden>/</span>
            <span className="hidden truncate text-slate-500 sm:inline dark:text-gray-400">{t('enrollment.core.task')}</span>
          </h1>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={status.label} className="shrink-0" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.18 }}>
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </motion.span>
          </AnimatePresence>
        </div>
      </header>

      <main ref={main} className={cn('relative mx-auto max-w-[760px] space-y-6 px-4 pt-6 sm:px-6', 'pb-16')}>
        {/* 1 · Core AI opens with what it knows and the two things it needs */}
        <AgentTurn>
          <StreamText className="text-[15px] leading-[1.65] text-slate-700 dark:text-gray-200" text={t('enrollment.core.hello', { name: firstName, plan: planName })} />
          <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35, ease }} className="rounded-[16px] bg-slate-100/70 p-1 ring-1 ring-inset ring-slate-200/70 dark:bg-gray-900/60 dark:ring-gray-800">
            <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-1.5">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 dark:text-gray-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                {t('enrollment.core.rec_title')}
              </p>
              <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400">
                <Lock className="h-3 w-3" aria-hidden />
                {t('enrollment.core.rec_readonly')}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[12px] bg-slate-200/70 ring-1 ring-slate-200/70 sm:grid-cols-4 dark:bg-gray-800 dark:ring-gray-800">
              {record.map(({ icon: Icon, label, value }, i) => (
                <motion.div key={label} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.07 }} className="bg-white px-3 py-2 dark:bg-gray-900">
                  <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-gray-400">
                    <Icon className="h-3 w-3" aria-hidden />
                    {label}
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-slate-800 dark:text-gray-100">
                    <span className="truncate">{value}</span>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </motion.div>

          {stage === 'ask' && (
            <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4, ease }} className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 dark:bg-gray-900 dark:ring-gray-800">
              <div className="px-4 pb-3.5 pt-3.5">
                <p className="text-[15px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{t('enrollment.core.need_title')}</p>
                <p className="mt-0.5 text-[13px] text-slate-500 dark:text-gray-400">{t('enrollment.core.need_sub')}</p>

                <fieldset className="mt-3">
                  <legend className="flex items-center gap-2 text-[13px] font-medium text-slate-900 dark:text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500 dark:bg-gray-800">1</span>
                    {t('enrollment.core.q_location')}
                  </legend>
                  <div role="radiogroup" aria-label={t('enrollment.core.q_location')} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {popular.map((loc) => {
                      const on = location === loc.name
                      return (
                        <motion.button
                          key={loc.name}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setLocation(on ? null : loc.name)}
                          title={t(`enrollment.flow.loc_${loc.name.toLowerCase().replace(/\s+/g, '_')}`)}
                          className={cn('relative rounded-xl border px-2.5 py-2 text-left transition-all', on ? 'border-blue-600 bg-blue-50/50 shadow-[0_0_0_3px_rgba(37,99,235,0.12)] dark:bg-blue-950/30' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 dark:border-gray-700')}
                        >
                          <span className="flex flex-col gap-0.5">
                            <span className="mb-1 flex items-start justify-between">
                              <motion.span
                                key={on ? 'on' : 'off'}
                                initial={on && !reduce ? { scale: 0.7, rotate: -10 } : false}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                                className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-[18px] leading-none transition-colors', on ? 'bg-white shadow-[0_1px_2px_rgba(37,99,235,0.15)] ring-1 ring-blue-100' : 'bg-slate-50 dark:bg-gray-800')}
                                aria-hidden
                              >
                                {loc.icon}
                              </motion.span>
                              {on && (
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                  <DrawnCheck className="h-3 w-3" />
                                </span>
                              )}
                            </span>
                            <span className="truncate text-[14px] font-medium text-slate-900 dark:text-white">{loc.name}</span>
                            <span className={cn('text-[11px] font-medium', loc.cost === 'Low' ? 'text-emerald-700' : 'text-amber-700')}>{t(`enrollment.flow.cost_${loc.cost.toLowerCase()}`)}</span>
                          </span>

                        </motion.button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                      <input
                        value={location && !popular.some((x) => x.name === location) && !locQuery ? location : locQuery}
                        onChange={(e) => setLocQuery(e.target.value)}
                        placeholder={t('enrollment.core.search_state')}
                        aria-label={t('enrollment.core.search_state')}
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                      <AnimatePresence>
                        {matches.length > 0 && (
                          <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-slate-200 dark:bg-gray-900 dark:ring-gray-700">
                            {matches.map((st) => (
                              <li key={st}>
                                <button type="button" onClick={() => { setLocation(st); setLocQuery('') }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-slate-800 hover:bg-slate-50 dark:text-gray-100 dark:hover:bg-gray-800">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                                  {st}
                                </button>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                    <button type="button" role="radio" aria-checked={location === ''} onClick={() => setLocation(location === '' ? null : '')} className={cn('h-9 rounded-xl border px-4 text-[14px] font-medium transition-colors', location === '' ? 'border-blue-600 bg-blue-50/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-gray-700 dark:text-gray-300')}>
                      {t('enrollment.core.not_sure')}
                    </button>
                  </div>
                </fieldset>

                <fieldset className="mt-3">
                  <legend className="flex items-center gap-2 text-[13px] font-medium text-slate-900 dark:text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500 dark:bg-gray-800">2</span>
                    {t('enrollment.core.q_savings')}
                  </legend>
                  <div role="radiogroup" aria-label={t('enrollment.core.q_savings')} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {[
                      ...SAVINGS_PRESETS.map((v, i) => ({ key: String(v), icon: ['🌱', '🪴', '🌳', '🏦'][i], label: v === 0 ? t('enrollment.core.none') : v === 100_000 ? `${compact(v)}+` : compact(v), sub: t(`enrollment.core.sv_${i}`), on: !otherAmount && savings === v, pick: () => { setOtherAmount(false); setSavings(!otherAmount && savings === v ? null : v) } })),
                      { key: 'other', icon: '✏️', label: t('enrollment.core.other_amount'), sub: t('enrollment.core.sv_other'), on: otherAmount, pick: () => { setOtherAmount(!otherAmount); setSavings(null) } },
                    ].map((o) => (
                      <motion.button
                        key={o.key}
                        type="button"
                        role="radio"
                        aria-checked={o.on}
                        whileTap={{ scale: 0.98 }}
                        onClick={o.pick}
                        className={cn('relative rounded-xl border px-2.5 py-2 text-left transition-all', o.on ? 'border-blue-600 bg-blue-50/50 shadow-[0_0_0_3px_rgba(37,99,235,0.12)] dark:bg-blue-950/30' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 dark:border-gray-700')}
                      >
                        <span className="flex flex-col gap-0.5">
                          <span className="mb-1 flex items-start justify-between">
                            <motion.span
                              key={o.on ? 'on' : 'off'}
                              initial={o.on && !reduce ? { scale: 0.7, rotate: -10 } : false}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                              className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-[18px] leading-none transition-colors', o.on ? 'bg-white shadow-[0_1px_2px_rgba(37,99,235,0.15)] ring-1 ring-blue-100' : 'bg-slate-50 dark:bg-gray-800')}
                              aria-hidden
                            >
                              {o.icon}
                            </motion.span>
                            {o.on && (
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                <DrawnCheck className="h-3 w-3" />
                              </span>
                            )}
                          </span>
                          <span className="truncate text-[14px] font-medium text-slate-900 dark:text-white">{o.label}</span>
                          <span className="truncate text-[11px] font-medium text-slate-500 dark:text-gray-400">{o.sub}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>
                  <AnimatePresence initial={false}>
                    {otherAmount && (
                      <motion.label initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="relative mt-2 block max-w-[240px]">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">$</span>
                        <input
                          inputMode="numeric"
                          autoFocus
                          value={savings ? savings.toLocaleString(locale) : ''}
                          onChange={(e) => {
                            const n = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10)
                            setSavings(Number.isFinite(n) && n > 0 ? n : null)
                          }}
                          placeholder="25,000"
                          aria-label={t('enrollment.core.other_amount')}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-[14px] font-medium tabular-nums text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </motion.label>
                    )}
                  </AnimatePresence>
                </fieldset>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/30">
                <p className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-gray-400">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden />
                  {t('enrollment.core.takes')}
                </p>
                <motion.button type="button" whileTap={answered ? { scale: 0.97 } : undefined} onClick={start} disabled={!answered} className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-4 text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(15,23,42,0.2)] transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:bg-white dark:text-slate-900">
                  {t('enrollment.core.start')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AgentTurn>

        {stage !== 'ask' && (
          <>
            {/* 2 · The participant's answer */}
            <UserTurn>
              {[location ? t('enrollment.core.me_location', { place: location }) : t('enrollment.core.me_location_unsure'), savings ? t('enrollment.core.me_savings', { amount: money(savings) }) : t('enrollment.core.me_savings_none')].join(' ')}{' '}
              {t('enrollment.core.me_go')}
            </UserTurn>

            {/* 3 · Core AI does the work and reports back */}
            <AgentTurn working={stage === 'working'}>
              <WorkLog
                title={t('enrollment.core.working')}
                doneTitle={problem ? t('enrollment.core.stopped') : t('enrollment.core.worked', { s: secs(timing.start, timing.end) })}
                steps={workSteps}
                open={logOpen}
                onToggle={() => setLogOpen((o) => !o)}
              />

              {stage === 'working' && !problem && (
                <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4, ease }} className="relative overflow-hidden rounded-[20px] bg-white p-5 ring-1 ring-slate-200/80 dark:bg-gray-900 dark:ring-gray-800" aria-hidden>
                  {!reduce && <motion.span className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-blue-50/90 to-transparent dark:via-blue-950/30" initial={{ x: '-100%' }} animate={{ x: '400%' }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />}
                  <div className="relative flex items-center gap-3">
                    <span className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-gray-800" />
                    <span className="space-y-2">
                      <span className="block h-3 w-36 rounded-full bg-slate-100 dark:bg-gray-800" />
                      <span className="block h-2.5 w-52 rounded-full bg-slate-100 dark:bg-gray-800" />
                    </span>
                  </div>
                  <div className="relative mt-5 grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-gray-800" animate={{ opacity: steps[2 + i] === 'done' ? 1 : 0.45 }} />
                    ))}
                  </div>
                  <div className="relative mt-4 space-y-2.5">
                    {[0.9, 0.75, 0.82].map((w, i) => (
                      <motion.span key={i} className="block h-2.5 rounded-full bg-slate-100 dark:bg-gray-800" style={{ width: `${w * 100}%` }} animate={{ opacity: steps[3 + Math.min(i, 2)] === 'done' ? 1 : 0.45 }} />
                    ))}
                  </div>
                  <p className="relative mt-4 flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                    <Pencil className="h-3 w-3" />
                    {t('enrollment.core.drafting')}
                  </p>
                </motion.div>
              )}

              {problem === 'ineligible' && (
                <div className="rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200/80 dark:bg-gray-900 dark:ring-gray-800">
                  <p className="text-[15px] leading-[1.6] text-slate-700 dark:text-gray-200">{t('enrollment.core.ineligible', { min: PLAN_CONFIG.eligibility.minAge })}</p>
                  <button type="button" onClick={() => navigate('/dashboard')} className="mt-3 inline-flex h-9 items-center rounded-lg bg-slate-900 px-3.5 text-[13px] font-medium text-white hover:bg-slate-800">{t('enrollment.core.to_dashboard')}</button>
                </div>
              )}
              {problem === 'rules' && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200/80 dark:bg-gray-900 dark:ring-gray-800">
                  <p className="text-[14px] leading-[1.6] text-slate-700 dark:text-gray-200">{t('enrollment.core.rules_error')}</p>
                  <button type="button" onClick={() => void run()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-[13px] font-medium text-white hover:bg-slate-800">
                    <RotateCw className="h-3.5 w-3.5" aria-hidden />
                    {t('enrollment.core.retry')}
                  </button>
                </div>
              )}

              {(stage === 'review' || stage === 'submitting' || stage === 'done') && (
                <>
                  <StreamText
                    className="text-[15px] leading-[1.65] text-slate-700 dark:text-gray-200"
                    text={t(fb.match >= fullMatch ? 'enrollment.core.report' : 'enrollment.core.report_gap', {
                      rate: fb.total,
                      amount: money(fb.perCheck),
                      match: money(fb.match),
                      level: level(baseline.risk).toLowerCase(),
                      count: fb.rows.length,
                      step: baseline.auto.amount.preTax,
                      max: baseline.auto.cap.preTax,
                    })}
                  />

                  {/* The draft */}
                  <motion.article ref={draftRef} style={fit < 1 ? { zoom: fit } : undefined} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.45, ease }} aria-labelledby="draft-title" className="overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 dark:bg-gray-900 dark:ring-gray-800">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <motion.span initial={reduce ? false : { scale: 0.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ delay: 0.35, type: 'spring', stiffness: 380, damping: 18 }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
                        <ShieldCheck className="h-4 w-4" aria-hidden />
                      </motion.span>
                      <div className="min-w-0 flex-1">
                        <h2 id="draft-title" className="text-[15px] font-semibold leading-5 tracking-[-0.01em] text-slate-900 dark:text-white">{t('enrollment.core.doc_title')}</h2>
                        <p className="truncate text-[12px] leading-4 text-slate-500 dark:text-gray-400" title={PLAN_CONFIG.plan.planId}>{planName}</p>
                      </div>
                      <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium', stage === 'done' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300')}>
                        {stage === 'done' ? <Check className="h-3 w-3" aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                        {stage === 'done' ? t('enrollment.core.doc_active') : t('enrollment.core.doc_draft')}
                      </span>
                    </div>

                    {/* Outcome */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 dark:divide-gray-800 dark:border-gray-800">
                      {[
                        { label: t('enrollment.core.m_save'), value: <AnimatedNumber countUp delay={0.5} value={f.total} format={(v) => `${round2(v)}%`} />, sub: t('enrollment.core.per_check', { amount: money(f.perCheck) }) },
                        { label: t('enrollment.core.m_match'), value: <AnimatedNumber countUp delay={0.6} value={f.match} format={money} />, sub: f.match >= fullMatch ? t('enrollment.core.m_match_full') : t('enrollment.core.m_match_gap', { amount: money(fullMatch - f.match) }), good: f.match >= fullMatch },
                        { label: t('enrollment.core.m_proj', { age: retireAge }), value: <AnimatedNumber countUp delay={0.7} value={f.projected} format={compact} />, sub: '', tip: t('enrollment.core.growth_tip') },
                      ].map((m, i) => (
                        <motion.div key={m.label} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.1, duration: 0.45, ease }} className="min-w-0 px-3 py-1.5 sm:px-4">
                          <p className="flex items-center gap-0.5 text-[11px] leading-4 text-slate-500 dark:text-gray-400">
                            <span className="sm:truncate">{m.label}</span>
                            {'tip' in m && m.tip && <InfoTip side="bottom" label={m.label} text={m.tip} />}
                          </p>
                          <p className="text-[20px] font-semibold leading-7 tracking-[-0.02em] text-slate-900 sm:text-[22px] dark:text-white">{m.value}</p>
                          {m.sub && <p className={cn('text-[11px] leading-4 sm:truncate', m.good === true ? 'text-emerald-700 dark:text-emerald-400' : m.good === false ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-gray-400')}>{m.sub}</p>}
                        </motion.div>
                      ))}
                    </div>
                    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.4 }} className="px-4 pb-1 pt-1.5">
                      <div className="mt-1 h-8 [&_svg]:h-8">
                        <Sparkline key={`${f.total}-${election.risk}`} points={series} height={32} delay={updates.length ? 0 : 0.9} />
                      </div>
                      <div className="mt-0.5 flex justify-between text-[11px] leading-4 text-slate-400">
                        <span>{t('enrollment.core.today', { age })}</span>
                        <span>{t('enrollment.core.at_age', { age: retireAge })}</span>
                      </div>
                    </motion.div>

                    {/* Decisions */}
                    <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-gray-800 dark:border-gray-800">
                      <DraftRow
                        icon={Gift}
                        index={0}
                        label={t('enrollment.core.row_contribution')}
                        value={`${f.total}% · ${f.tax}`}
                        onEdit={stage === 'done' ? undefined : () => openSheet('contribution')}
                        editLabel={t('enrollment.core.edit')}
                      />
                      <DraftRow
                        icon={TrendingUp}
                        index={1}
                        label={t('enrollment.core.row_auto')}
                        value={f.auto}
                        onEdit={stage === 'done' ? undefined : () => openSheet('auto')}
                        editLabel={t('enrollment.core.edit')}
                        aside={stage === 'done' ? undefined : <Switch checked={election.auto.enabled} onChange={(v) => commit({ ...election, auto: { ...election.auto, enabled: v } })} label={t('enrollment.core.row_auto')} />}
                      />
                      <DraftRow
                        icon={PieChart}
                        index={2}
                        label={t('enrollment.core.row_invest')}
                        value={`${f.invest} · ${t('enrollment.core.funds_n', { count: f.rows.length })}`}
                        onEdit={stage === 'done' ? undefined : () => openSheet('invest')}
                        editLabel={t('enrollment.core.edit')}
                      >
                        <div className="mt-1.5 flex h-1.5 gap-[3px] overflow-hidden rounded-full" aria-hidden>
                          {f.rows.map((r, i) => (
                            <motion.span key={r.ticker} initial={reduce ? false : { flexGrow: 0.001 }} animate={{ flexGrow: r.pct }} transition={{ delay: updates.length ? 0 : 1.45 + i * 0.07, duration: 0.6, ease }} className="h-full min-w-[3px] first:rounded-l-full last:rounded-r-full" style={{ flexBasis: 0, background: FUND_COLORS[i % FUND_COLORS.length] }} />
                          ))}
                        </div>
                        {fundsError && <p role="alert" className="mt-2 text-[12px] font-medium text-red-600">{t('enrollment.feed.err_funds', { total: f.rowsTotal })}</p>}
                      </DraftRow>
                      <DraftRow icon={Settings2} index={3} label={t('enrollment.core.row_options')} value={f.options} onEdit={stage === 'done' ? undefined : () => openSheet('invest')} editLabel={t('enrollment.core.edit')} />
                    </div>

                    {stage !== 'done' && election.mode === 'risk_style' && (
                      <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="relative mx-4 mb-2 mt-0.5 overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 px-3 py-1.5 ring-1 ring-blue-100 dark:from-blue-950/40 dark:to-indigo-950/20 dark:ring-blue-900">
                        {!reduce && <motion.span className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent" initial={{ x: '-30%' }} animate={{ x: '900%' }} transition={{ delay: 1.2, duration: 1.4, ease: 'easeInOut' }} aria-hidden />}
                        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-[0_1px_2px_rgba(37,99,235,0.15)] ring-1 ring-blue-100 dark:bg-gray-900 dark:ring-blue-900">
                            <Sparkles className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold leading-5 text-slate-900 dark:text-white">{t('enrollment.core.assume_title', { level: level(election.risk) })}</p>
                          </div>
                          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => openSheet('invest')} className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold text-blue-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-blue-200 transition-colors hover:bg-blue-600 hover:text-white hover:ring-blue-600 dark:bg-gray-900 dark:text-blue-300">
                            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                            {t('enrollment.core.adjust_risk')}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Approval: Core AI asks for permission before it submits anything */}
                    {(stage === 'review' || stage === 'submitting') && (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-1.5 dark:border-gray-800 dark:bg-gray-800/30">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                          <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                            <input type="checkbox" checked={consent} disabled={stage === 'submitting'} onChange={(e) => setConsent(e.target.checked)} className="peer sr-only" />
                            <span className={cn('mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2', consent ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white dark:border-gray-600 dark:bg-gray-900')} aria-hidden>
                              {consent && <DrawnCheck className="h-3 w-3" />}
                            </span>
                            <span className="text-[12px] leading-[1.45] text-slate-600 dark:text-gray-300">
                              {t('enrollment.core.consent', { plan: planName })}{' '}
                              <button type="button" onClick={(e) => { e.preventDefault(); setSheet('disclosures') }} className="font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-300">
                                {t('enrollment.core.read_disclosures', { n: PLAN_CONFIG.disclosures.length })}
                              </button>
                            </span>
                          </label>
                          <motion.button
                            type="button"
                            whileTap={canApprove ? { scale: 0.97 } : undefined}
                            onClick={() => void approve()}
                            disabled={!canApprove}
                            className="relative inline-flex h-9 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-4 text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                          >
                            {canApprove && !reduce && <motion.span className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent" initial={{ x: '-120%' }} animate={{ x: '400%' }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }} aria-hidden />}
                            {stage === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : submitError ? <RotateCw className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                            {stage === 'submitting' ? t('enrollment.core.approving') : submitError ? t('enrollment.core.try_again') : t('enrollment.core.approve')}
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.article>
                </>
              )}
            </AgentTurn>

            {/* 4 · Changes the participant made, reported back */}
            {updates.map((u) => (
              <AgentTurn key={u.id}>
                <p className="text-[15px] leading-[1.65] text-slate-700 dark:text-gray-200">{t('enrollment.core.updated')}</p>
                <ul className="space-y-1.5">
                  {u.changes.map((c) => (
                    <li key={c.label} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                      <span className="text-slate-500 dark:text-gray-400">{c.label}</span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-500 line-through decoration-slate-400 dark:bg-gray-800">{c.from}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" aria-hidden />
                      <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">{c.to}</span>
                    </li>
                  ))}
                </ul>
                {u.reapprove && <p className="text-[13px] text-slate-500 dark:text-gray-400">{t('enrollment.core.reapprove')}</p>}
              </AgentTurn>
            ))}

            {submitError && stage === 'review' && (
              <AgentTurn>
                <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-4 py-3 text-[14px] leading-[1.55] text-red-800 ring-1 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {t('enrollment.core.submit_error')}
                </div>
              </AgentTurn>
            )}

            {/* 5 · Approval and the result */}
            {(stage === 'submitting' || stage === 'done') && (
              <>
                <UserTurn>{t('enrollment.core.me_approve')}</UserTurn>
                <AgentTurn working={stage === 'submitting'}>
                  <WorkLog title={t('enrollment.core.submitting')} doneTitle={t('enrollment.core.submitted', { s: secs(timing.submitStart, timing.submitEnd) })} steps={submitLog} open={submitLogOpen} onToggle={() => setSubmitLogOpen((o) => !o)} />
                  {stage === 'done' && (
                    <motion.div initial={reduce ? false : { opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55, ease }} className="relative overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 dark:bg-gray-900 dark:ring-gray-800">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.16),transparent_70%)]" aria-hidden />
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]" aria-hidden />
                      <div className="relative px-6 pb-4 pt-6 text-center">
                        <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
                          {!reduce && <motion.span className="absolute inset-0 rounded-full bg-emerald-400/40" initial={{ scale: 0.8, opacity: 0.8 }} animate={{ scale: 2.1, opacity: 0 }} transition={{ duration: 1.4, delay: 0.2, ease: 'easeOut' }} />}
                          <Confetti />
                          <motion.span initial={reduce ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.35)]">
                            <DrawnCheck className="h-8 w-8" delay={0.25} />
                          </motion.span>
                        </span>
                        <motion.p initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
                          {t('enrollment.core.done_eyebrow')}
                        </motion.p>
                        <motion.h2 tabIndex={-1} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
                          {t('enrollment.core.done_title', { name: firstName })}
                        </motion.h2>
                        <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mx-auto mt-1.5 max-w-md text-[14px] leading-[1.6] text-slate-500 dark:text-gray-400">
                          {t('enrollment.core.done_sub2', { plan: planName })}
                        </motion.p>
                      </div>
                      <dl className="relative mx-5 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl ring-1 ring-slate-200/80 dark:divide-gray-800 dark:ring-gray-800">
                        {[
                          { label: t('enrollment.core.m_save'), value: `${f.total}%`, sub: t('enrollment.core.per_check', { amount: money(f.perCheck) }) },
                          { label: t('enrollment.core.m_match'), value: money(f.match), sub: f.match >= fullMatch ? t('enrollment.core.m_match_full') : '' },
                          { label: t('enrollment.core.m_proj', { age: retireAge }), value: compact(f.projected), sub: t('enrollment.core.m_proj_sub') },
                        ].map((m, i) => (
                          <motion.div key={m.label} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.08 }} className="min-w-0 px-3 py-3 text-center sm:px-4">
                            <dt className="text-[12px] leading-[1.35] text-slate-500 dark:text-gray-400">{m.label}</dt>
                            <dd className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">{m.value}</dd>
                            {m.sub && <dd className="text-[12px] text-slate-500 dark:text-gray-400">{m.sub}</dd>}
                          </motion.div>
                        ))}
                      </dl>
                      <div className="relative mx-5 mb-4 mt-3">
                        <p className="mb-2.5 text-[12px] font-medium text-slate-500 dark:text-gray-400">{t('enrollment.core.whats_next')}</p>
                        <ol className="space-y-2">
                          {[
                            effective ? { icon: CalendarClock, text: t('enrollment.core.next_1', { date: dateLong(effective) }) } : null,
                            election.auto.enabled ? { icon: TrendingUp, text: t('enrollment.core.next_2', { amount: election.auto.amount.preTax, date: dateLong(nextAuto) }) } : null,
                            { icon: Settings2, text: t('enrollment.core.next_3') },
                          ]
                            .filter((x): x is { icon: typeof CalendarClock; text: string } => !!x)
                            .map(({ icon: Icon, text }, i) => (
                              <motion.li key={text} initial={reduce ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 + i * 0.1 }} className="flex items-center gap-3 text-[13px] leading-[1.5] text-slate-700 dark:text-gray-200">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-gray-800">
                                  <Icon className="h-3.5 w-3.5" aria-hidden />
                                </span>
                                {text}
                              </motion.li>
                            ))}
                        </ol>
                      </div>
                      <div className="relative flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-gray-800/30">
                        <button type="button" onClick={() => navigate('/enrollment/manage')} className="h-10 rounded-xl bg-white px-4 text-[14px] font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800">{t('enrollment.core.manage')}</button>
                        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => navigate('/dashboard')} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-[14px] font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                          {t('enrollment.core.to_dashboard')}
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AgentTurn>
              </>
            )}
          </>
        )}
        <div ref={bottom} />
      </main>


      <EdgeGlow active={stage === 'working' || stage === 'submitting'} />

      {/* Focused editors */}
      <Sheet
        open={sheet === 'contribution' || sheet === 'auto' || sheet === 'invest'}
        onClose={() => setSheet(null)}
        title={sheet === 'contribution' ? t('enrollment.core.sh_rate') : sheet === 'auto' ? t('enrollment.core.sh_auto') : t('enrollment.core.sh_invest')}
        subtitle={t('enrollment.core.sh_sub')}
        footer={
          <>
            <button type="button" onClick={() => setSheet(null)} className="h-9 rounded-lg px-3.5 text-[14px] font-medium text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800">{t('enrollment.core.cancel')}</button>
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={applySheet} disabled={stagedInvalid} className="h-9 rounded-lg bg-slate-900 px-4 text-[14px] font-medium text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 dark:bg-white dark:text-slate-900">{t('enrollment.core.apply')}</motion.button>
          </>
        }
      >
        {sheet === 'contribution' && <ContributionEditor value={staged} onChange={setStaged} ctx={{ salary, periods, locale, now }} />}
        {sheet === 'auto' && <AutoIncreaseEditor value={staged} onChange={setStaged} ctx={{ salary, periods, locale, now }} />}
        {sheet === 'invest' && <InvestmentsEditor value={staged} onChange={setStaged} onViewAll={() => setShowFunds(true)} />}
      </Sheet>

      <Sheet open={sheet === 'disclosures'} onClose={() => setSheet(null)} title={t('enrollment.core.disclosures')} subtitle={planName}>
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

      {/* The plan's full fund list, on top of whichever editor opened it */}
      <Sheet open={showFunds} onClose={() => setShowFunds(false)} wide stacked title={t('plan.inv.plan_investments')} subtitle={t('enrollment.core.funds_sub')}>
        <div className="-mx-6 overflow-x-auto px-6">
          <PlanFundsTable showHeading={false} includeSdb={staged.sdb || election.sdb} />
        </div>
      </Sheet>
    </div>
  )
}
