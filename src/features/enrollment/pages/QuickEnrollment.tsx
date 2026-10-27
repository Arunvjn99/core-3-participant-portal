import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Minus, Plus, MessageCircleQuestion, PieChart, TrendingUp, BadgeCheck, CheckCircle2, AlertTriangle, X, RotateCcw, PiggyBank, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useEnrollmentSave } from '@/core/hooks/useEnrollmentSave'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { DEFAULT_AUTO_INCREASE, PERIODS, PLAN_DEFAULT_ALLOCATION, PLAN_RULES, STYLE_TO_RISK, nextIncreaseDate, type InvestMode, type RiskStyle, type SourceKey, type Unit } from '@/features/plan/electionsData'
import { RiskQuestionnaire } from '@/features/plan/RiskQuestionnaire'
import { PlanFundsTable } from '@/features/plan/PlanFundsTable'
import { Modal } from '@/design-system/components/Modal'
import { useProfileStore } from '@/features/profile/profileStore'
import { useNow } from '@/lib/useNow'
import { TermInfo } from '@/features/learning/TermInfo'
import { isSdbTicker, sdbCatalog, sdbFundByTicker } from '@/features/plan/sdbFunds'
import { AutoIncreaseTiming, ExactAmounts, InvestExtras, InvestModePicker, type AutoTiming } from '../components/QuickOptions'
import { getAppDateLocale } from '@/lib/dateLocale'
import { fundCatalog, recommendedFunds, type RiskKey, type SourceFundAllocation } from '../investmentCatalog'
import { AgentMessage, Chips, Composer, PlanPanel, PlanTiles, QuickActions, Rich, PrepLog, TypeText, Typing, UserReply } from '../agent/AgentChat'
import { EnrollmentSummaryPanel, type SubmitPhase, type SummaryData } from '../agent/EnrollmentSummaryPanel'
import { EnrollmentConfirmed } from '../agent/EnrollmentConfirmed'
import { submitEnrollment, type EnrollmentConfirmation } from '../agent/enrollmentService'
import { usePreparation, PREP_STEPS } from '../agent/usePreparation'
import { clearSelections, loadSelections, useSaveSelections } from '../agent/sessionSelections'
import { parseAgentCommand, type AgentAction } from '../agent/intents'
import { interpretWithModel } from '../agent/interpret'
import type { EnrolPlanContext } from '../agent/enrolIntentPrompt'
import { GLOSSARY, termAnswer } from '@/features/learning/glossary'
import i18n from '@/core/i18n'
import { ChatQuestions } from '../agent/ChatQuestions'
import { ChatTopBar } from '../agent/ChatTopBar'
import { QUESTIONS, missingQuestions, type WizardQuestion } from '../agent/wizardQuestions'
import { ReviewDialog } from '../agent/ReviewDialog'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../agent/planConfig'
import { ProfileSummary } from '../agent/ProfileSummary'
import {
  buildQuickEnrollmentDefaults,
  hasProfile,
  projectBalance,
  EMPLOYER_MATCH_CAP_PERCENT,
} from '../quickEnrollmentDefaults'

const RISK_LEVELS: RiskKey[] = ['conservative', 'balanced', 'growth', 'aggressive']

/** Mix presets, from mostly pre-tax to mostly Roth. The full flow allows any split. */
const MIX_STOPS: { preTax: number; roth: number }[] = [
  { preTax: 75, roth: 25 },
  { preTax: 50, roth: 50 },
  { preTax: 25, roth: 75 },
]
const MIX_LABEL_KEYS = ['mix_mostly_pretax', 'mix_balanced', 'mix_mostly_roth'] as const

type TaxMode = 'pretax' | 'roth' | 'mix'
type Row = { ticker: string; pct: number }

/** Everything the participant can change, kept for the session (see sessionSelections.ts). */
interface Selections {
  rate: number
  split: { preTax: number; roth: number }
  auto: { enabled: boolean; amount: number; max: number }
  risk: RiskKey
  unit: Unit
  timing: AutoTiming
  mode: InvestMode
  riskStyle?: RiskStyle
  autoRebalance: boolean
  sdb: boolean
  sdbSeparate: boolean
  rowsBy: Record<SourceKey, Row[]>
  applyAll: boolean
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Ranges come from the plan configuration. */
const LIMITS = PLAN_LIMITS

const TAX_OPTIONS: { mode: TaxMode; Icon: typeof PiggyBank }[] = [
  { mode: 'pretax', Icon: PiggyBank },
  { mode: 'roth', Icon: ShieldCheck },
  { mode: 'mix', Icon: SlidersHorizontal },
]

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  suffix = '%',
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  label: string
  suffix?: string
}) {
  const { t } = useTranslation()
  const btn =
    'flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`${t('enrollment.quick.decrease')}: ${label}`}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[3.25rem] text-center text-[0.95rem] font-semibold tabular-nums text-gray-900 dark:text-white" aria-live="polite">
        {value}
        {suffix}
      </span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${t('enrollment.quick.increase')}: ${label}`}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function PctInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const { t } = useTranslation()
  const clamp = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? Math.round(n) : 0))
  const btn =
    'flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
  return (
    <div className="inline-flex items-center gap-1.5">
      <button type="button" className={btn} disabled={value <= 0} onClick={() => onChange(clamp(value - 1))} aria-label={`${t('enrollment.quick.decrease')}: ${label}`}>
        <Minus className="h-3 w-3" />
      </button>
      <span className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
          aria-label={label}
          className="h-7 w-16 rounded-md border border-gray-200 bg-transparent pl-2 pr-5 text-right text-[0.82rem] font-semibold tabular-nums text-gray-900 [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[0.72rem] text-gray-400">%</span>
      </span>
      <button type="button" className={btn} disabled={value >= 100} onClick={() => onChange(clamp(value + 1))} aria-label={`${t('enrollment.quick.increase')}: ${label}`}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}

/**
 * One-click enrolment as a conversation with the CORE AI assistant. It first asks the same questions as the
 * "Start my enrolment" popup (skipped when already answered), then proposes each part of the plan as a message:
 * contribution and tax treatment, auto-increase, and investments. Every field of the step-by-step flow is behind
 * that step's "Change" toggle. Enrolling is a single click; "Customise" opens the full flow with the same values.
 */
export default function QuickEnrollment() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { saveCompleteEnrollment } = useEnrollmentSave()

  const draft = useEnrollmentDraftStore((s) => s.draftData)
  const defaults = useMemo(() => buildQuickEnrollmentDefaults(draft), [draft])

  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<'profile' | 'plan'>(() => (hasProfile(draft) ? 'plan' : 'profile'))
  /** The "about you" questions open as a pop-up: straight away if they haven't been answered, or from "Edit answers". */
  /** The agent asks only for what it doesn't already know; "Edit answers" shows every question */
  const [missing] = useState<WizardQuestion[]>(() => missingQuestions(draft.personalization ?? {}, draft.savings?.salary ?? draft.personalization?.salary))
  const [chatQuestions, setChatQuestions] = useState<readonly WizardQuestion[]>(() => (missing.length ? missing : QUESTIONS))
  /** True while existing answers are being changed (the plan comes back if they keep them) */
  const [editing, setEditing] = useState(false)
  /** The questions were answered in this conversation, so their transcript stays on screen */
  const [answeredHere, setAnsweredHere] = useState(phase === 'profile')
  /** Restarts the inline questions at the first one with the latest answers */
  const [chatRound, setChatRound] = useState(0)
  /** "Edit answers": ask every question again in the chat, prefilled with the current answers */
  const editAnswers = () => {
    setChatQuestions(QUESTIONS)
    setChatRound((r) => r + 1)
    setEditing(true)
    setPhase('profile')
  }
  /** The agent's preparation (eligibility, plan rules, match, funds, projection) runs once the profile is known. */
  const { prep, retry } = usePreparation(defaults.currentAge, phase === 'plan', !!reduceMotion)
  /** The plan appears once preparation succeeds */
  const planReady = phase === 'plan' && prep.status === 'ready'
  const [summaryOpen, setSummaryOpen] = useState(false)
  /** Which plan tile's settings are open */
  const [openStep, setOpenStep] = useState<1 | 2 | 3 | null>(null)

  /** The conversation after the plan: what the participant asked and how the assistant responded. */
  const [events, setEvents] = useState<{ id: number; role: 'user' | 'agent'; text: string }[]>([])
  const [pending, setPending] = useState(false)
  const eventId = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (events.length) endRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' })
  }, [events.length, pending, reduceMotion])

  // Choices made earlier this session win over fresh defaults, so nothing is lost on reload or after an error
  const [saved] = useState(() => (hasProfile(draft) ? loadSelections<Selections>() : null))
  const [rate, setRate] = useState(saved?.rate ?? defaults.contributionPercent)
  const [split, setSplit] = useState(saved?.split ?? { preTax: defaults.sources.preTax, roth: defaults.sources.roth })
  const [auto, setAuto] = useState(saved?.auto ?? defaults.autoIncrease)
  const [risk, setRisk] = useState<RiskKey>(saved?.risk ?? defaults.riskLevel)

  const now = useNow()
  const frequency = useProfileStore((s) => s.employment.payrollFrequency)
  const periods = PERIODS[frequency] ?? 12
  const [unit, setUnit] = useState<Unit>(saved?.unit ?? 'percent')
  const [timing, setTiming] = useState<AutoTiming>(saved?.timing ?? {
    cycle: DEFAULT_AUTO_INCREASE.cycle,
    sourceWise: false,
    rothAmount: defaults.autoIncrease.amount,
    rothCap: defaults.autoIncrease.max,
  })
  const [mode, setMode] = useState<InvestMode>(saved?.mode ?? 'risk_style')
  const [riskStyle, setRiskStyle] = useState<RiskStyle | undefined>(saved?.riskStyle)
  const [questionnaire, setQuestionnaire] = useState(false)
  const [showFunds, setShowFunds] = useState(false)
  const [autoRebalance, setAutoRebalance] = useState(saved?.autoRebalance ?? false)
  const [sdb, setSdb] = useState(saved?.sdb ?? false)
  const [sdbSeparate, setSdbSeparate] = useState(saved?.sdbSeparate ?? false)
  /** Opting out of SDB takes its funds out of the allocation; the total then shows what's left to place. */
  const toggleSdb = (on: boolean) => {
    setSdb(on)
    if (!on) setRowsBy((b) => ({ preTax: b.preTax.filter((r) => !isSdbTicker(r.ticker)), roth: b.roth.filter((r) => !isSdbTicker(r.ticker)) }))
  }

  const [rowsBy, setRowsBy] = useState<Record<SourceKey, Row[]>>(() => {
    if (saved?.rowsBy) return saved.rowsBy
    const r = recommendedFunds(defaults.riskLevel).map((f) => ({ ticker: f.ticker, pct: f.allocation }))
    return { preTax: r, roth: r }
  })
  /** Same funds for every source, as in the full flow; unticked, Roth money gets its own mix. */
  const [applyAll, setApplyAll] = useState(saved?.applyAll ?? true)
  const [source, setSource] = useState<SourceKey>('preTax')

  const bothSources = split.preTax > 0 && split.roth > 0
  const perSource = !applyAll && bothSources
  const activeKey: SourceKey = perSource ? source : 'preTax'
  const rows = rowsBy[activeKey]
  const totalOf = (rs: Row[]) => rs.reduce((s, r) => s + r.pct, 0)
  /** Edit the source being shown; with one mix for all sources, both stay in step. */
  const updateRows = (fn: (rs: Row[]) => Row[]) =>
    setRowsBy((b) => (perSource ? { ...b, [activeKey]: fn(b[activeKey]) } : { preTax: fn(b.preTax), roth: fn(b.preTax) }))
  const setAllRows = (rs: Row[]) => setRowsBy({ preTax: rs, roth: rs })
  const toggleApplyAll = (on: boolean) => {
    setApplyAll(on)
    setSource('preTax')
    if (on) setRowsBy((b) => ({ preTax: b.preTax, roth: b.preTax }))
  }

  const catalog = sdb ? [...fundCatalog, ...sdbCatalog] : fundCatalog
  const funds: SourceFundAllocation[] = rows.flatMap((r) => {
    const meta = catalog.find((c) => c.ticker === r.ticker)
    return meta ? [{ ...meta, allocation: r.pct }] : []
  })
  const fundTotal = totalOf(rows)
  const otherKey: SourceKey = activeKey === 'preTax' ? 'roth' : 'preTax'
  const otherUnbalanced = perSource && totalOf(rowsBy[otherKey]) !== 100
  const blendedEr = funds.reduce((s, f) => s + (f.allocation * parseFloat(f.expense)) / 100, 0)
  const balanced = fundTotal === 100

  /** Explicit authorisation; the service records when it was given at the moment of submission. */
  const [consent, setConsent] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle')
  /** The review pop-up: a short list of every selection, the disclosures and consent, then submit */
  const [reviewOpen, setReviewOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<EnrollmentConfirmation | null>(null)
  const diff = fundTotal - 100

  const recommended = useMemo(() => recommendedFunds(risk), [risk])
  const isCustom =
    rows.length !== recommended.length ||
    rows.some((r) => recommended.find((f) => f.ticker === r.ticker)?.allocation !== r.pct)
  const addable = catalog.filter((c) => !rows.some((r) => r.ticker === c.ticker))
  const addableCore = addable.filter((c) => !isSdbTicker(c.ticker))
  const addableSdb = addable.filter((c) => isSdbTicker(c.ticker))

  /** Picking a risk profile resets the mix to that profile's recommendation, as the full flow does. */
  const selectRisk = (level: RiskKey) => {
    setRisk(level)
    setMode('risk_style')
    setAllRows(recommendedFunds(level).map((f) => ({ ticker: f.ticker, pct: f.allocation })))
  }
  const resetFunds = () => {
    setMode('risk_style')
    updateRows(() => recommended.map((f) => ({ ticker: f.ticker, pct: f.allocation })))
  }
  const setPct = (ticker: string, pct: number) => {
    setMode('own')
    updateRows((rs) => rs.map((r) => (r.ticker === ticker ? { ...r, pct } : r)))
  }
  const removeFund = (ticker: string) => {
    setMode('own')
    updateRows((rs) => rs.filter((r) => r.ticker !== ticker))
  }
  const addFund = (ticker: string) => {
    if (!ticker) return
    setMode('own')
    updateRows((rs) => [...rs, { ticker, pct: 0 }])
  }
  const chooseMode = (m: InvestMode) => {
    setMode(m)
    if (m === 'plan_selected') setAllRows(Object.entries(PLAN_DEFAULT_ALLOCATION).map(([ticker, pct]) => ({ ticker, pct })))
    if (m === 'risk_style') setAllRows(recommended.map((f) => ({ ticker: f.ticker, pct: f.allocation })))
  }
  /** Once the questions are answered, rebuild the recommendation from the new answers and present it. */
  const startPlan = () => {
    clearSelections()
    const d = buildQuickEnrollmentDefaults(useEnrollmentDraftStore.getState().draftData)
    setRate(d.contributionPercent)
    setAuto(d.autoIncrease)
    setRisk(d.riskLevel)
    setMode('risk_style')
    setAllRows(recommendedFunds(d.riskLevel).map((f) => ({ ticker: f.ticker, pct: f.allocation })))
    setOpenStep(null)
    setEvents([])
    setConsent(false)
    setEditing(false)
    setAnsweredHere(true)
    setPhase('plan')
  }

  const applyStyle = (style: RiskStyle) => {
    setRiskStyle(style)
    selectRisk(STYLE_TO_RISK[style])
  }

  /** Per-source rates in % of pay, as the full flow's "Deferral by source" collects them. */
  const sourceRates = { preTax: Math.round(((rate * split.preTax) / 100) * 100) / 100, roth: Math.round(((rate * split.roth) / 100) * 100) / 100 }
  const setSourceRate = (key: SourceKey, v: number) => {
    const next = { ...sourceRates, [key]: v }
    const total = Math.min(LIMITS.rate[1], next.preTax + next.roth)
    if (total <= 0) return
    if (next.preTax + next.roth > LIMITS.rate[1]) next[key] = Math.round((LIMITS.rate[1] - next[key === 'preTax' ? 'roth' : 'preTax']) * 100) / 100
    const sum = next.preTax + next.roth
    setRate(Math.max(LIMITS.rate[0], Math.round(sum * 100) / 100))
    setSplit({ preTax: Math.round((next.preTax / sum) * 10000) / 100, roth: Math.round((next.roth / sum) * 10000) / 100 })
  }
  const usePlanRate = () => {
    setRate(PLAN_RULES.defaultRate.preTax + PLAN_RULES.defaultRate.roth)
    const sum = PLAN_RULES.defaultRate.preTax + PLAN_RULES.defaultRate.roth
    setSplit({ preTax: (PLAN_RULES.defaultRate.preTax / sum) * 100, roth: (PLAN_RULES.defaultRate.roth / sum) * 100 })
  }

  const paycheckDollars = (defaults.salary * rate) / 100 / periods
  const current = { ...defaults, contributionPercent: rate, riskLevel: risk }
  const annualContribution = Math.round((defaults.salary * rate) / 100)
  const annualMatch = Math.round((defaults.salary * Math.min(rate, EMPLOYER_MATCH_CAP_PERCENT)) / 100)
  const fullMatch = rate >= EMPLOYER_MATCH_CAP_PERCENT
  const missedMatch = Math.round((defaults.salary * Math.max(EMPLOYER_MATCH_CAP_PERCENT - rate, 0)) / 100)
  const ratePos = ((rate - LIMITS.rate[0]) / (LIMITS.rate[1] - LIMITS.rate[0])) * 100
  const matchPos = ((EMPLOYER_MATCH_CAP_PERCENT - LIMITS.rate[0]) / (LIMITS.rate[1] - LIMITS.rate[0])) * 100
  const taxMode: TaxMode = split.preTax === 100 ? 'pretax' : split.roth === 100 ? 'roth' : 'mix'
  const mixIdx = MIX_STOPS.reduce((best, m, i) => (Math.abs(m.preTax - split.preTax) < Math.abs(MIX_STOPS[best].preTax - split.preTax) ? i : best), 0)
  const customMix = taxMode === 'mix' && !MIX_STOPS.some((m) => m.preTax === split.preTax)
  const chooseTaxMode = (m: TaxMode) => setSplit(m === 'pretax' ? { preTax: 100, roth: 0 } : m === 'roth' ? { preTax: 0, roth: 100 } : MIX_STOPS[1])
  const projected = projectBalance(current, draft.personalization?.savingsAmount ?? 0)

  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`
  const compact = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1_000).toLocaleString(locale)}K`

  /** Write every step's values to the draft store, exactly as the step pages would. */
  const applySelections = () => {
    const { mergeDraftSection } = useEnrollmentDraftStore.getState()
    const planType = split.roth > split.preTax ? 'roth' : 'traditional'
    mergeDraftSection('plan', {
      type: planType,
      planId: planType,
      planName: planType === 'roth' ? 'Roth 401(k)' : 'Traditional 401(k)',
    })
    mergeDraftSection('contribution', { percent: rate, rate, type: 'percentage' })
    mergeDraftSection('source', { preTax: split.preTax, roth: split.roth, afterTax: 0 })
    mergeDraftSection('autoIncrease', { ...auto })
    mergeDraftSection('investment', {
      riskLevel: risk,
      useRecommended: !isCustom,
      customAllocation: Object.fromEntries(rowsBy.preTax.map((r) => [r.ticker, r.pct])),
    })
    mergeDraftSection('savings', { salary: defaults.salary })
  }

  /** Records the elections in the app's stores once the (simulated) submission is confirmed. */
  const commitEnrollment = async (confirmedAt: number) => {
    applySelections()
    useEnrollmentDraftStore.setState((s) => ({
      currentStep: 8,
      highestCompletedStep: Math.max(s.highestCompletedStep, 7),
      draftData: { ...s.draftData, review: { confirmedAt, agreed: true } },
      enrollmentStatus: 'complete',
    }))
    const inUnit = (pct: number) => Math.round((unit === 'dollar' ? (pct / 100) * (defaults.salary / periods) : pct) * 100) / 100
    useElectionsStore.getState().applyEnrollment({
      preTaxRate: inUnit((rate * split.preTax) / 100),
      rothRate: inUnit((rate * split.roth) / 100),
      unit,
      autoIncrease: auto,
      autoIncreaseFull: {
        enabled: auto.enabled,
        cycle: timing.cycle,
        sourceWise: timing.sourceWise,
        amount: { preTax: auto.amount, roth: timing.sourceWise ? timing.rothAmount : auto.amount },
        cap: { preTax: auto.max, roth: timing.sourceWise ? timing.rothCap : auto.max },
      },
      mode,
      autoRebalance,
      sdbOptedIn: sdb,
      sdbTrackSeparately: sdb && bothSources ? sdbSeparate : undefined,
      risk,
      allocation: Object.fromEntries(rowsBy.preTax.map((r) => [r.ticker, r.pct])),
      allocationRoth: perSource ? Object.fromEntries(rowsBy.roth.map((r) => [r.ticker, r.pct])) : undefined,
      riskStyle,
    })
    const result = await saveCompleteEnrollment()
    if (!result.ok) console.warn('[QuickEnrollment] Save failed, continuing with the local record:', result.error)
  }

  /**
   * The single "Confirm and enrol" action. Runs only with consent and valid choices: checks the choices again,
   * sends the (simulated) submission, then shows the confirmation. On failure the choices stay as they are.
   */
  const handleConfirm = async () => {
    if (!consent || issues.length > 0 || submitPhase === 'validating' || submitPhase === 'sending' || submitPhase === 'confirming') return
    setSubmitPhase('validating')
    await pause(reduceMotion ? 0 : 600)
    setSubmitPhase('sending')
    try {
      const conf = await submitEnrollment({
        planId: PLAN_CONFIG.plan.planId,
        ratePercent: rate,
        preTaxPercent: split.preTax,
        rothPercent: split.roth,
        autoIncrease: auto,
        allocation: Object.fromEntries(rowsBy.preTax.map((r) => [r.ticker, r.pct])),
        consented: consent,
      })
      setSubmitPhase('confirming')
      await commitEnrollment(conf.submittedAt)
      clearSelections()
      setReviewOpen(false)
      setConfirmation(conf)
      setSubmitPhase('idle')
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    } catch {
      setSubmitPhase('error')
      setEvents((e) => [...e, { id: ++eventId.current, role: 'agent', text: t('enrollment.agent.submit_failed_msg') }])
    }
  }

  const handleCustomise = () => {
    applySelections()
    navigate('/enrollment/plan')
  }

  const fundFee = blendedEr.toFixed(2)
  /** Each plan step is a short headline plus one supporting line, so it can be read at a glance. */
  const contributionSummary = t('enrollment.agent.head_contribution', { rate, paycheck: `$${Math.round(paycheckDollars).toLocaleString(locale)}` })
  const contributionDetail = fullMatch
    ? t('enrollment.agent.detail_contribution', { tax: t(`enrollment.quick.opt_${taxMode}_title`), amount: money(annualMatch) })
    : t('enrollment.agent.detail_contribution_gap', { tax: t(`enrollment.quick.opt_${taxMode}_title`), amount: money(missedMatch) })
  const autoSummary = auto.enabled ? t('enrollment.agent.head_auto', { amount: auto.amount, max: auto.max }) : t('enrollment.agent.head_auto_off')
  const autoDetail = auto.enabled
    ? t('enrollment.agent.detail_auto', { date: nextIncreaseDate(timing.cycle, now, now).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' }) })
    : t('enrollment.agent.detail_auto_off')
  const investSummary =
    mode === 'risk_style'
      ? t('enrollment.agent.head_invest_risk', { level: t(`enrollment.investment.level_${risk}`), count: rows.length })
      : t(`enrollment.agent.head_invest_${mode}`, { count: rows.length })
  const investDetail = [
    t('enrollment.agent.detail_invest', { fee: fundFee }),
    perSource ? t('enrollment.agent.detail_per_source') : '',
    autoRebalance ? t('enrollment.agent.detail_rebalance') : '',
    sdb ? t('enrollment.agent.detail_sdb') : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const money2 = (v: number) => `$${v.toLocaleString(locale, { maximumFractionDigits: 0 })}`
  const perPaycheck = (r: number) => money2((defaults.salary * r) / 100 / periods)
  const matchLine = (r: number) =>
    r >= EMPLOYER_MATCH_CAP_PERCENT
      ? t('enrollment.agent.sum_match_full', { amount: money((defaults.salary * EMPLOYER_MATCH_CAP_PERCENT) / 100) })
      : t('enrollment.agent.sum_match_gap', { amount: money((defaults.salary * (EMPLOYER_MATCH_CAP_PERCENT - r)) / 100), cap: EMPLOYER_MATCH_CAP_PERCENT })
  const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v))

  /** Carries out a request and returns the assistant's reply. */
  const act = (a: AgentAction): string => {
    switch (a.type) {
      case 'rate':
      case 'rate_delta': {
        const want = a.type === 'rate' ? a.value : rate + a.delta
        const v = clamp(Math.round(want * 100) / 100, LIMITS.rate)
        setRate(v)
        const note = v !== want ? `${t('enrollment.agent.did_limit', { min: LIMITS.rate[0], max: LIMITS.rate[1] })} ` : ''
        return `${note}${t('enrollment.agent.did_rate', { rate: v, paycheck: perPaycheck(v) })} ${matchLine(v)}`
      }
      case 'tax':
        chooseTaxMode(a.mode)
        return t('enrollment.agent.did_tax', { tax: t(`enrollment.agent.tax_${a.mode}`) })
      case 'auto':
        setAuto((x) => ({ ...x, enabled: a.on }))
        return a.on ? t('enrollment.agent.did_auto_on', { amount: auto.amount, max: auto.max }) : t('enrollment.agent.did_auto_off')
      case 'auto_amount': {
        const v = clamp(Math.round(a.value), LIMITS.autoAmount)
        setAuto((x) => ({ ...x, enabled: true, amount: v }))
        const note = v !== a.value ? `${t('enrollment.agent.did_limit', { min: LIMITS.autoAmount[0], max: LIMITS.autoAmount[1] })} ` : ''
        return `${note}${t('enrollment.agent.did_auto_amount', { amount: v, max: auto.max })}`
      }
      case 'auto_cap': {
        const v = clamp(Math.round(a.value), LIMITS.autoCap)
        setAuto((x) => ({ ...x, enabled: true, max: v }))
        const note = v !== a.value ? `${t('enrollment.agent.did_limit', { min: LIMITS.autoCap[0], max: LIMITS.autoCap[1] })} ` : ''
        return `${note}${t('enrollment.agent.did_auto_cap', { max: v })}`
      }
      case 'risk':
      case 'risk_delta': {
        const idx = RISK_LEVELS.indexOf(risk)
        const level = a.type === 'risk' ? a.level : RISK_LEVELS[Math.min(RISK_LEVELS.length - 1, Math.max(0, idx + a.delta))]!
        if (a.type === 'risk_delta' && level === risk) return t(a.delta < 0 ? 'enrollment.agent.did_risk_min' : 'enrollment.agent.did_risk_max', { level: t(`enrollment.investment.level_${risk}`) })
        selectRisk(level)
        const recs = recommendedFunds(level)
        const fee = recs.reduce((x, f) => x + (f.allocation * parseFloat(f.expense)) / 100, 0)
        return t('enrollment.agent.did_risk', { level: t(`enrollment.investment.level_${level}`), count: recs.length, fee: fee.toFixed(2) })
      }
      case 'mode':
        chooseMode(a.mode)
        if (a.mode === 'own') setOpenStep(3)
        return t(`enrollment.agent.did_mode_${a.mode}`)
      case 'rebalance':
        setAutoRebalance(a.on)
        return t(a.on ? 'enrollment.agent.did_rebalance_on' : 'enrollment.agent.did_rebalance_off')
      case 'sdb':
        toggleSdb(a.on)
        if (a.on) setOpenStep(3)
        return t(a.on ? 'enrollment.agent.did_sdb_on' : 'enrollment.agent.did_sdb_off')
      case 'open':
        setOpenStep(a.step)
        return t('enrollment.agent.did_open')
      case 'enrol':
        if (issues.length) return t('enrollment.agent.did_enrol_fix')
        setReviewOpen(true)
        return t('enrollment.agent.did_enrol')
      case 'explain':
        return termAnswer(a.term).content
    }
  }

  /** Shows the request as the participant's message, then the assistant's reply after a short pause. */
  /** What the model needs to understand relative requests ("a bit more") against the current plan. */
  const planContext = (): EnrolPlanContext => ({
    rate,
    tax: taxMode,
    autoIncrease: { enabled: auto.enabled, amount: auto.amount, max: auto.max },
    risk,
    investMode: mode,
    autoRebalance,
    sdb,
    limits: LIMITS,
    terms: Object.keys(GLOSSARY),
    language: i18n.language?.startsWith('es') ? 'es' : 'en',
  })

  /**
   * Shows the request as the participant's message, then the assistant's reply. Suggestion chips carry their
   * action. Typed text goes to the language model first; if it's unavailable or unsure, the built-in rules decide.
   */
  const say = async (text: string, action?: AgentAction) => {
    setEvents((e) => [...e, { id: ++eventId.current, role: 'user', text }])
    setPending(true)
    // A short "typing" pause runs alongside the work, so instant replies don't feel abrupt
    const pause = new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : 650))

    let replies: string[]
    if (action) {
      replies = [act(action)]
    } else {
      const model = await interpretWithModel(text, planContext())
      if (model) {
        replies = [...model.actions.map(act), ...(model.answer ? [model.answer] : [])]
      } else {
        const rule = parseAgentCommand(text)
        replies = [rule ? act(rule) : t('enrollment.agent.did_unknown')]
      }
    }

    await pause
    setEvents((e) => [...e, ...replies.map((r) => ({ id: ++eventId.current, role: 'agent' as const, text: r }))])
    setPending(false)
  }
  const chip = (label: string, action: AgentAction) => ({ label, onClick: () => void say(label, action) })
  const chipAction = (label: string, Icon: typeof Sparkles, action: AgentAction) => ({ ...chip(label, action), Icon })
  const busySubmitting = submitPhase === 'validating' || submitPhase === 'sending' || submitPhase === 'confirming'
  const thinking = pending || busySubmitting || (phase === 'plan' && prep.status === 'running')
  const planName = t(PLAN_CONFIG.plan.nameKey)
  const years = Math.max(defaults.retirementAge - defaults.currentAge, 0)

  useSaveSelections(
    { rate, split, auto, risk, unit, timing, mode, riskStyle, autoRebalance, sdb, sdbSeparate, rowsBy, applyAll } satisfies Selections,
    phase === 'plan' && !confirmation,
  )

  /** Each preparation step's line, worded for where it has got to. */
  const prepLabel = (k: (typeof PREP_STEPS)[number]): string => {
    const st = prep.steps[k]
    switch (k) {
      case 'eligibility':
        return st === 'done'
          ? t('enrollment.agent.prep_eligible', { plan: planName })
          : st === 'error'
            ? t('enrollment.agent.prep_not_eligible', { age: prep.eligibility?.minAge ?? PLAN_CONFIG.eligibility.minAge })
            : t('enrollment.agent.prep_eligibility', { plan: planName })
      case 'rules':
        return st === 'done' ? t('enrollment.agent.prep_rules_done') : st === 'error' ? t('enrollment.agent.prep_rules_failed') : t('enrollment.agent.prep_rules')
      case 'match':
        return t('enrollment.agent.prep_match', { rate: PLAN_CONFIG.match.ratePercent, cap: PLAN_CONFIG.match.capPercent })
      case 'funds':
        return t('enrollment.agent.prep_funds', { level: t(`enrollment.investment.level_${risk}`), fee: fundFee })
      case 'projection':
        return t('enrollment.agent.prep_projection', { years })
    }
  }
  const prepError =
    prep.status === 'ineligible'
      ? t('enrollment.agent.prep_ineligible_msg', { age: prep.eligibility?.minAge ?? PLAN_CONFIG.eligibility.minAge })
      : prep.status === 'error'
        ? t('enrollment.agent.prep_error_msg')
        : undefined

  /** Problems that must be fixed before submitting. */
  const issues = [
    ...(!balanced ? [t('enrollment.agent.issue_alloc', { source: perSource ? t(`plan.src_${activeKey}`) : t('enrollment.agent.your_funds'), total: fundTotal })] : []),
    ...(otherUnbalanced ? [t('enrollment.agent.issue_alloc', { source: t(`plan.src_${otherKey}`), total: totalOf(rowsBy[otherKey]) })] : []),
  ]

  const summaryData: SummaryData = {
    planName,
    planId: PLAN_CONFIG.plan.planId,
    isSample: PLAN_CONFIG.isSample,
    rate,
    perPaycheck: perPaycheck(rate),
    youPerYear: money(annualContribution),
    employerPerYear: money(employerMatch(defaults.salary, rate)),
    matchNote: fullMatch
      ? t('enrollment.agent.summary.match_full', { cap: PLAN_CONFIG.match.capPercent })
      : t('enrollment.agent.summary.match_gap', { amount: money(missedMatch), cap: PLAN_CONFIG.match.capPercent }),
    fullMatch,
    taxLabel: t(`enrollment.quick.opt_${taxMode}_title`),
    autoText: auto.enabled ? t('enrollment.agent.summary.auto_on', { amount: auto.amount, max: auto.max }) : t('enrollment.agent.summary.auto_off'),
    investLabel:
      mode === 'risk_style'
        ? t('enrollment.agent.summary.invest_risk', { level: t(`enrollment.investment.level_${risk}`), count: rows.length })
        : t(`enrollment.agent.summary.invest_${mode}`, { count: rows.length }),
    funds: funds.map((f) => ({ name: f.name, pct: f.allocation, color: f.color })),
    fee: fundFee,
    projected: compact(projected),
    retireAge: defaults.retirementAge,
  }

  const openAndShow = (n: 1 | 2 | 3) => {
    setOpenStep(n)
    setSummaryOpen(false)
    requestAnimationFrame(() => document.getElementById(`plan-panel-${n}`)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }))
  }
  const openReview = () => {
    if (issues.length) {
      setSummaryOpen(true)
      return
    }
    setSummaryOpen(false)
    setReviewOpen(true)
  }
  const focusComposer = () => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Message CORE AI"]')
    input?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
    input?.focus({ preventScroll: true })
  }

  if (confirmation) {
    return (
      <AnimatedPage>
        <EnrollmentConfirmed
          confirmation={confirmation}
          data={summaryData}
          onDashboard={() => navigate('/dashboard')}
          onManage={() => navigate('/enrollment/manage')}
        />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <ChatTopBar
        thinking={thinking}
        pill={planReady ? t('enrollment.agent.pill', { rate, amount: perPaycheck(rate) }) : undefined}
        summaryOpen={summaryOpen}
        onSummaryOpen={setSummaryOpen}
        summary={planReady ? <EnrollmentSummaryPanel data={summaryData} issues={issues} onReview={openReview} onEdit={openAndShow} /> : undefined}
      />

      <div className="mx-auto max-w-3xl space-y-4 pb-6 pt-6" style={{ fontSize: '1rem' }}>
        <AgentMessage>
          <Rich
            text={
              editing
                ? t('enrollment.agent.chat_hello_edit')
                : phase === 'plan' && !answeredHere
                  ? t('enrollment.agent.chat_hello_known')
                  : missing.length && missing.length < QUESTIONS.length
                    ? t('enrollment.agent.chat_hello_partial', { count: missing.length })
                    : t('enrollment.agent.chat_hello_new')
            }
          />
        </AgentMessage>

        {phase === 'profile' || answeredHere ? (
          <ChatQuestions
            key={chatRound}
            questions={chatQuestions}
            done={phase === 'plan'}
            onDone={startPlan}
            onCancel={
              editing
                ? () => {
                    setEditing(false)
                    setPhase('plan')
                  }
                : undefined
            }
          />
        ) : (
          <ProfileSummary profile={draft.personalization ?? {}} age={defaults.currentAge} salary={defaults.salary} onEdit={editAnswers} />
        )}

        {phase === 'plan' && (
        <>

        <PrepLog
          items={PREP_STEPS.map((k) => ({ key: k, label: prepLabel(k), status: prep.steps[k] }))}
          status={prep.status}
          errorText={prepError}
          onRetry={prep.status === 'error' ? retry : undefined}
        />

        {planReady && (
        <AgentMessage card>
          <p className="mb-3 text-slate-800 dark:text-gray-100">{t('enrollment.agent.plan_intro')}</p>
          <PlanTiles
            open={openStep}
            onToggle={(n) => (openStep === n ? setOpenStep(null) : openAndShow(n))}
            tiles={[
              { step: 1, title: t('enrollment.quick.contribution_title'), headline: contributionSummary, detail: contributionDetail },
              { step: 2, title: t('enrollment.quick.auto_title'), headline: autoSummary, detail: autoDetail },
              { step: 3, title: t('enrollment.quick.invest_title'), headline: investSummary, detail: investDetail },
            ]}
          />

        {openStep === 1 && (
        <PlanPanel step={1} title={t('enrollment.quick.contribution_title')} onClose={() => setOpenStep(null)}>
          {/* Rate: one control, one number. Slider for feel, buttons for precision. */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1">
              <label htmlFor="quick-rate" className="text-gray-900 dark:text-white" style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                {t('enrollment.quick.rate_label')}
              </label>
              <TermInfo term="contribution_rate" />
            </span>
            <Stepper value={rate} min={LIMITS.rate[0]} max={LIMITS.rate[1]} onChange={setRate} label={t('enrollment.quick.rate_label')} />
          </div>

          <div className="relative mt-3 pb-6">
            <div className="relative h-4">
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-blue-600"
                style={{ width: `calc(${ratePos}% + ${8 - ratePos * 0.16}px)` }}
              />
              <input
                id="quick-rate"
                type="range"
                min={LIMITS.rate[0]}
                max={LIMITS.rate[1]}
                step={1}
                value={rate}
                onChange={(e) => setRate(parseInt(e.target.value, 10))}
                aria-valuetext={`${rate}%`}
                className="absolute inset-0 h-4 w-full text-blue-600"
              />
            </div>
            <span
              className="pointer-events-none absolute top-[18px] -translate-x-1/2 text-center text-gray-400"
              style={{ left: `calc(${matchPos}% + ${8 - matchPos * 0.16}px)`, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'nowrap' }}
            >
              <span className="mx-auto mb-0.5 block h-1.5 w-px bg-gray-300 dark:bg-gray-600" aria-hidden />
              {t('enrollment.quick.match_cap_marker', { cap: EMPLOYER_MATCH_CAP_PERCENT })}
            </span>
          </div>

          <p className="mb-3 mt-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>
            {t('enrollment.quick.approx_paycheck', { amount: `$${paycheckDollars.toFixed(2)}` })}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
              <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem', fontWeight: 500 }}>{t('enrollment.quick.you_contribute')}</p>
              <p className="mt-0.5 tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {money(annualContribution)}
                <span className="ml-1 text-gray-400" style={{ fontSize: '0.72rem', fontWeight: 400 }}>{t('enrollment.quick.per_year')}</span>
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
              <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem', fontWeight: 500 }}>{t('enrollment.quick.employer_adds')} <TermInfo term="employer_match" /></p>
              <p className="mt-0.5 tabular-nums text-gray-900 dark:text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {money(annualMatch)}
                <span className="ml-1 text-gray-400" style={{ fontSize: '0.72rem', fontWeight: 400 }}>{t('enrollment.quick.per_year')}</span>
              </p>
            </div>
          </div>

          <p
            className={cn(
              'mt-2.5 flex items-center gap-1.5',
              fullMatch ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-300',
            )}
            style={{ fontSize: '0.78rem', fontWeight: 500 }}
            role="status"
          >
            {fullMatch ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
            {fullMatch
              ? t('enrollment.quick.match_full', { cap: EMPLOYER_MATCH_CAP_PERCENT })
              : t('enrollment.quick.match_gap', { amount: money(missedMatch), cap: EMPLOYER_MATCH_CAP_PERCENT })}
          </p>

          {/* Tax treatment: choose by what it means, not by percentages. */}
          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="text-gray-900 dark:text-white" style={{ fontSize: '0.88rem', fontWeight: 500 }}>
              {t('enrollment.quick.tax_title')} <TermInfo term="tax_treatment" />
            </p>
            <p className="mb-3 mt-0.5 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>
              {t('enrollment.quick.tax_sub')}
            </p>

            <div role="radiogroup" aria-label={t('enrollment.quick.tax_title')} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TAX_OPTIONS.map(({ mode: m, Icon }) => {
                const active = taxMode === m
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => chooseTaxMode(m)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors sm:flex-col sm:gap-2',
                      active
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block', active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white')} style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                        {t(`enrollment.quick.opt_${m}_title`)}
                      </span>
                      <span className="mt-0.5 block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.74rem', lineHeight: 1.35 }}>
                        {t(`enrollment.quick.opt_${m}_desc`)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {taxMode === 'mix' && (
              <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                <label htmlFor="quick-mix" className="mb-2 block text-gray-600 dark:text-gray-300" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  {t('enrollment.quick.mix_label')}
                </label>
                <div className="relative h-4">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-blue-600"
                    style={{ width: `calc(${mixIdx * 50}% + ${8 - mixIdx * 8}px)` }}
                  />
                  <input
                    id="quick-mix"
                    type="range"
                    min={0}
                    max={MIX_STOPS.length - 1}
                    step={1}
                    value={mixIdx}
                    onChange={(e) => setSplit(MIX_STOPS[parseInt(e.target.value, 10)])}
                    aria-valuetext={t(`enrollment.quick.${MIX_LABEL_KEYS[mixIdx]}`)}
                    className="absolute inset-0 h-4 w-full text-blue-600"
                  />
                </div>
                {customMix && (
                  <p className="mt-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>{t('enrollment.quick.custom_mix_note')}</p>
                )}
                <div className={cn('mt-1.5 flex justify-between text-gray-500 dark:text-gray-400', customMix && 'hidden')} style={{ fontSize: '0.7rem' }} aria-hidden>
                  {MIX_LABEL_KEYS.map((k, i) => (
                    <span key={k} className={cn(i === mixIdx && 'font-semibold text-blue-700 dark:text-blue-300')}>
                      {t(`enrollment.quick.${k}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ul className="mt-3 space-y-1.5" style={{ fontSize: '0.78rem' }}>
              {split.preTax > 0 && (
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden />
                  <span>
                    <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{money((annualContribution * split.preTax) / 100)}</span>
                    {t('enrollment.quick.per_year')} · {t('enrollment.quick.pretax_effect')}
                  </span>
                </li>
              )}
              {split.roth > 0 && (
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" aria-hidden />
                  <span>
                    <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{money((annualContribution * split.roth) / 100)}</span>
                    {t('enrollment.quick.per_year')} · {t('enrollment.quick.roth_effect')}
                  </span>
                </li>
              )}
            </ul>
          </div>

          <ExactAmounts
            unit={unit}
            onUnit={setUnit}
            paycheckPerPct={defaults.salary / periods / 100}
            sourceRates={sourceRates}
            onSourceRate={setSourceRate}
            planRate={PLAN_RULES.defaultRate}
            onUsePlanRate={usePlanRate}
            maxRate={LIMITS.rate[1]}
          />
        </PlanPanel>
        )}

        {openStep === 2 && (
        <PlanPanel step={2} title={t('enrollment.quick.auto_title')} onClose={() => setOpenStep(null)}>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={auto.enabled}
              onChange={(e) => setAuto((a) => ({ ...a, enabled: e.target.checked }))}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 accent-blue-600"
            />
            <span>
              <span className="block text-gray-900 dark:text-white" style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                {t('enrollment.quick.auto_toggle')} <TermInfo term="auto_increase" />
              </span>
              <span className="block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>
                {auto.enabled ? t('enrollment.review_page.auto_enabled', { amt: auto.amount, max: auto.max }) : t('enrollment.review_page.auto_disabled')}
              </span>
              {auto.enabled && (
                <span className="block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>
                  {t('plan.def.now_next', { now: rate, next: Math.min(rate + auto.amount, Math.max(auto.max, rate)), date: nextIncreaseDate(timing.cycle, now, now).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) })}
                </span>
              )}
            </span>
          </label>
          {auto.enabled && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
                <span className="text-gray-600 dark:text-gray-300" style={{ fontSize: '0.8rem' }}>{t('enrollment.quick.auto_amount')}</span>
                <Stepper value={auto.amount} min={LIMITS.autoAmount[0]} max={LIMITS.autoAmount[1]} onChange={(v) => setAuto((a) => ({ ...a, amount: v }))} label={t('enrollment.quick.auto_amount')} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
                <span className="text-gray-600 dark:text-gray-300" style={{ fontSize: '0.8rem' }}>{t('enrollment.quick.auto_cap')}</span>
                <Stepper value={auto.max} min={LIMITS.autoCap[0]} max={LIMITS.autoCap[1]} onChange={(v) => setAuto((a) => ({ ...a, max: v }))} label={t('enrollment.quick.auto_cap')} />
              </div>
            </div>
          )}
          {auto.enabled && (
            <AutoIncreaseTiming
              now={now}
              timing={timing}
              onTiming={(patch) => setTiming((x) => ({ ...x, ...patch }))}
              auto={{ amount: auto.amount, max: auto.max }}
              onAuto={(patch) => setAuto((a) => ({ ...a, ...patch }))}
              bothSources={bothSources}
              capRange={LIMITS.autoCap}
            />
          )}
        </PlanPanel>
        )}

        {openStep === 3 && (
        <PlanPanel step={3} title={t('enrollment.quick.invest_title')} onClose={() => setOpenStep(null)}>
          <InvestModePicker mode={mode} onMode={chooseMode} />

          {mode === 'risk_style' && (
            <div className="mt-4">
              <p className="mb-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {t('enrollment.quick.risk_label')} <TermInfo term="risk_profile" />
              </p>
              <div role="radiogroup" aria-label={t('enrollment.quick.risk_label')} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RISK_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={risk === level}
                    onClick={() => selectRisk(level)}
                    className={cn(
                      'rounded-xl border-2 px-2 py-2.5 text-center text-[0.82rem] font-semibold transition-all',
                      risk === level
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                        : 'border-gray-200 text-gray-900 hover:border-gray-300 dark:border-gray-700 dark:text-white',
                    )}
                  >
                    {t(`enrollment.investment.level_${level}`)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>
                {t(`enrollment.investment.profile_desc_${risk}`)}
              </p>
              <p className="mt-1.5 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>
                {riskStyle ? t('plan.inv.style_result', { style: t(`plan.risk.style_${riskStyle}`) }) : t('enrollment.quick.not_sure')}{' '}
                <button type="button" onClick={() => setQuestionnaire(true)} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                  {riskStyle ? t('plan.risk.retake') : t('plan.inv.take_questionnaire')}
                </button>
              </p>
            </div>
          )}
          {mode !== 'risk_style' && (
            <p className="mt-3 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>{t(`enrollment.quick.mode_${mode}_hint`)}</p>
          )}

          {bothSources && (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-gray-800 dark:text-gray-200" style={{ fontSize: '0.82rem' }}>
              <input type="checkbox" checked={applyAll} onChange={(e) => toggleApplyAll(e.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
              {t('plan.inv.apply_all')}
              <TermInfo term="sources" />
            </label>
          )}
          {perSource && (
            <div role="tablist" aria-label={t('plan.inv.by_source')} className="mt-2 flex gap-1.5">
              {(['preTax', 'roth'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={source === k}
                  onClick={() => setSource(k)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[0.8rem] font-medium',
                    source === k ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300',
                  )}
                >
                  {t(`plan.src_${k}`)} · {totalOf(rowsBy[k])}%
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              {addable.length > 0 ? (
                <select
                  value=""
                  onChange={(e) => addFund(e.target.value)}
                  aria-label={t('enrollment.quick.add_fund')}
                  className="h-8 rounded-md border border-gray-200 bg-transparent px-2 text-[0.8rem] text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:text-gray-300"
                >
                  <option value="">+ {t('enrollment.quick.add_fund')}</option>
                  {addableCore.map((c) => (
                    <option key={c.ticker} value={c.ticker}>
                      {c.name} ({c.ticker}) · {c.expense}
                    </option>
                  ))}
                  {addableSdb.length > 0 && (
                    <optgroup label={t('plan.inv.sdb')}>
                      {addableSdb.map((c) => (
                        <option key={c.ticker} value={c.ticker}>
                          {c.name} · {c.expense}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              ) : (
                <span />
              )}
              <span className="flex items-center gap-3">
              <button type="button" onClick={() => setShowFunds(true)} className="text-[0.8rem] font-medium text-blue-600 hover:underline dark:text-blue-400">
                {t('plan.inv.view_funds')}
              </button>
              {isCustom && (
                <button type="button" onClick={resetFunds} className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-blue-600 hover:underline dark:text-blue-400">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {t('enrollment.quick.reset_funds')}
                </button>
              )}
            </span>
          </div>

          <div className="mt-2 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
            <table className="w-full text-left" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr className="bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th className="px-3 py-2 font-semibold">{t('enrollment.quick.col_fund')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('enrollment.quick.col_er')} <TermInfo term="expense_ratio" /></th>
                  <th className="px-3 py-2 text-right font-semibold">{t('enrollment.quick.col_alloc')} <TermInfo term="allocation" /></th>
                  <th className="w-8 px-1 py-2" aria-hidden />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {funds.map((f) => (
                  <tr key={f.ticker}>
                    <td className="px-3 py-2">
                      <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: f.color }} aria-hidden />
                      <span className="text-gray-900 dark:text-white">{f.name}</span>
                      {isSdbTicker(f.ticker) ? (
                        <>
                          <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" style={{ fontSize: '0.62rem', fontWeight: 700 }}>
                            {t('plan.sdb_funds.tag')}
                          </span>
                          <span className="mt-0.5 block pl-4 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.7rem' }}>
                            {(() => {
                              const acct = sdbFundByTicker(f.ticker)?.account
                              return acct?.status === 'active' ? t('plan.sdb_funds.account', { numbers: acct.numbers.join(', ') }) : t('plan.sdb_funds.not_activated')
                            })()}
                          </span>
                        </>
                      ) : (
                        <span className="ml-1.5 text-gray-400">{f.ticker}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">{f.expense}</td>
                    <td className="px-3 py-2 text-right">
                      <PctInput value={f.allocation} onChange={(v) => setPct(f.ticker, v)} label={`${f.name} ${t('enrollment.quick.col_alloc')}`} />
                    </td>
                    <td className="px-1 py-2 text-center">
                      {funds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFund(f.ticker)}
                          aria-label={`${t('enrollment.quick.remove_fund')}: ${f.name}`}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-800/60">
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{t('enrollment.quick.total_alloc')}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500 dark:text-gray-400" title={t('enrollment.quick.blended_er')}>
                    {blendedEr.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-white">{fundTotal}%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div
            role="status"
            className={cn(
              'mt-3 flex items-center justify-between rounded-lg px-3 py-2',
              balanced ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
            )}
            style={{ fontSize: '0.78rem', fontWeight: 500 }}
          >
            <span className="flex items-center gap-2">
              {balanced ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
              {balanced
                ? t('enrollment.investment.alloc_balanced')
                : diff > 0
                  ? t('enrollment.investment.alloc_over', { n: diff })
                  : t('enrollment.investment.alloc_remaining', { n: Math.abs(diff) })}
            </span>
            <span className="tabular-nums" style={{ fontWeight: 700 }}>{fundTotal}%</span>
          </div>

          <InvestExtras
            autoRebalance={autoRebalance}
            onAutoRebalance={setAutoRebalance}
            sdb={sdb}
            onSdb={toggleSdb}
            selected={rows.map((r) => r.ticker)}
            onAddSdbFund={addFund}
            trackSeparately={sdbSeparate}
            onTrackSeparately={setSdbSeparate}
            bothSources={bothSources}
          />
        </PlanPanel>
        )}

          <Chips
            disabled={pending || busySubmitting}
            items={[
              chip(t('enrollment.agent.chip_save_more'), { type: 'rate_delta', delta: 1 }),
              taxMode === 'roth' ? chip(t('enrollment.agent.chip_pretax'), { type: 'tax', mode: 'pretax' }) : chip(t('enrollment.agent.chip_roth'), { type: 'tax', mode: 'roth' }),
              chip(t('enrollment.agent.chip_less_risk'), { type: 'risk_delta', delta: -1 }),
              chip(t('enrollment.agent.chip_more_growth'), { type: 'risk_delta', delta: 1 }),
            ]}
          />

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-600 dark:text-gray-400" style={{ fontSize: '0.92rem' }}>
              {t('enrollment.agent.summary.projection')}: <strong className="text-slate-900 dark:text-white">{t('enrollment.agent.summary.projection_value', { amount: compact(projected), age: defaults.retirementAge })}</strong> <TermInfo term="projected_balance" />
            </p>
            <button
              type="button"
              onClick={openReview}
              disabled={busySubmitting}
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:opacity-50"
              style={{ fontSize: '1rem', fontWeight: 700 }}
            >
              <BadgeCheck className="h-5 w-5" aria-hidden />
              {t('enrollment.agent.summary.review_enrol')}
            </button>
          </div>
          {issues.length > 0 && (
            <p role="alert" className="mt-2 text-amber-800 dark:text-amber-300" style={{ fontSize: '0.88rem' }}>{issues[0]}</p>
          )}
          <button type="button" onClick={handleCustomise} disabled={busySubmitting} className="mt-2 min-h-[44px] text-blue-700 hover:underline disabled:opacity-50 dark:text-blue-300" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            {t('enrollment.agent.full_setup_link')}
          </button>
        </AgentMessage>
        )}

        {events.map((e) =>
          e.role === 'user' ? (
            <UserReply key={e.id}>{e.text}</UserReply>
          ) : (
            <AgentMessage key={e.id}>
              <TypeText text={e.text} />
            </AgentMessage>
          ),
        )}
        {pending && <Typing />}
        <div ref={endRef} />

        </>
        )}
      </div>

      {planReady && (
        <div className="sticky bottom-0 z-20 -mx-4 -mb-6 border-t border-slate-200/70 bg-[#f5f6f8]/90 px-4 pb-4 pt-3 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90 sm:-mx-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-2.5">
            <QuickActions
              label={t('enrollment.agent.quick_actions')}
              disabled={pending || busySubmitting}
              items={[
                { label: t('enrollment.agent.qa_enrol'), Icon: BadgeCheck, onClick: openReview, primary: true },
                chipAction(t('enrollment.agent.qa_increase'), TrendingUp, { type: 'rate_delta', delta: 1 }),
                { label: t('enrollment.agent.qa_invest'), Icon: PieChart, onClick: () => openAndShow(3) },
                { label: t('enrollment.agent.qa_ask'), Icon: MessageCircleQuestion, onClick: focusComposer },
              ]}
            />
            <Composer onSend={(text) => void say(text)} disabled={pending || busySubmitting} />
          </div>
        </div>
      )}

      <ReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        data={summaryData}
        disclosures={PLAN_CONFIG.disclosures}
        disclosureVars={{ fee: fundFee, cap: PLAN_CONFIG.match.capPercent, amount: auto.amount, max: auto.max, vesting: PLAN_CONFIG.vestingYears }}
        consent={consent}
        onConsent={setConsent}
        phase={submitPhase}
        onSubmit={() => void handleConfirm()}
      />
      <RiskQuestionnaire open={questionnaire} onClose={() => setQuestionnaire(false)} onComplete={applyStyle} />
      <Modal open={showFunds} onClose={() => setShowFunds(false)} size="2xl" title={t('plan.inv.plan_investments')}>
        <PlanFundsTable includeSdb={sdb} />
      </Modal>
    </AnimatedPage>
  )
}
