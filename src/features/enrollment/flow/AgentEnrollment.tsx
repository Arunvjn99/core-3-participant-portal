import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, Loader2, Lock, RotateCw, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { LEGAL } from '@/lib/constants'
import { getAppDateLocale } from '@/lib/dateLocale'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'
import { TermInfo } from '@/features/learning/TermInfo'
import { termAnswer } from '@/features/learning/glossary'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useEnrollmentSave } from '@/core/hooks/useEnrollmentSave'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PERIODS } from '@/features/plan/electionsData'
import { useProfileStore } from '@/features/profile/profileStore'
import { recommendedFunds } from '../investmentCatalog'
import { ageFromBirth, buildQuickEnrollmentDefaults, projectBalance } from '../quickEnrollmentDefaults'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../agent/planConfig'
import { checkEligibility, getPlanRules, submitEnrollment, type EnrollmentConfirmation } from '../agent/enrollmentService'
import { missingQuestions } from '../agent/wizardQuestions'
import { parseAgentCommand } from '../agent/intents'
import { Rich } from '../agent/AgentChat'
import { QuestionModal } from './QuestionModal'
import { EditModal } from './EditModal'
import { SummaryCard } from './SummaryCard'
import type { Answers, EditTarget, PlanChoice, QuestionId, TaxMode } from './flowTypes'

/**
 * One-click enrolment as a conversation with the AI assistant. After "Enrol now" the assistant does the routine work
 * in the background (profile, eligibility, plan rules), asks in a pop-up only for facts it doesn't have, and then
 * walks the participant through the decisions one at a time in the chat: contribution, tax treatment, auto-increase
 * and investments. Decisions already known are skipped with a short note. A concise review and the disclosures with
 * an unchecked consent box come last; "Confirm enrolment" submits, and success is shown only after the (simulated)
 * system confirms it.
 */

type Stage = 'welcome' | 'chat'
type Turn = 'preparing' | 'contribution' | 'tax' | 'auto' | 'invest' | 'review' | 'consent' | 'done' | 'ineligible' | 'rules_error'
type Msg = { id: number; from: 'agent' | 'user'; text: string }
type SubmitPhase = 'idle' | 'sending' | 'error'

/** The decisions the participant makes, in order. Review and consent always follow. */
const DECISIONS = ['contribution', 'tax', 'auto', 'invest'] as const
type Decision = (typeof DECISIONS)[number]

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The assistant's small, professional orb. */
function Orb({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.25)] ring-2 ring-white dark:ring-gray-900"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="absolute left-[28%] top-[22%] h-[28%] w-[28%] rounded-full bg-white/50" />
    </span>
  )
}

function AnswerButtons({ items, disabled }: { items: { label: string; onClick: () => void; primary?: boolean }[]; disabled?: boolean }) {
  return (
    <div className="mt-3.5 flex flex-wrap gap-2">
      {items.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={b.onClick}
          disabled={disabled}
          className={cn(
            'min-h-[44px] rounded-xl px-4 text-[0.95rem] font-semibold transition-colors disabled:opacity-50',
            b.primary
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700'
              : 'border border-slate-200 bg-white text-[#0f2a4a] hover:border-blue-300 hover:bg-blue-50/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
          )}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}

/** The current question, shown as a card beside the assistant with its answer buttons. */
function QuestionCard({ children, onBack, label }: { children: React.ReactNode; onBack?: () => void; label: string }) {
  const { t } = useTranslation()
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-label={label} className="flex items-start gap-3">
      <span className="mt-1 hidden sm:block">
        <Orb />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,42,74,0.06)] dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        {children}
        {onBack && (
          <button type="button" onClick={onBack} className="mt-3 inline-flex min-h-[36px] items-center gap-1 text-slate-500 hover:text-[#0f2a4a] dark:text-gray-400 dark:hover:text-white" style={{ fontSize: '0.86rem', fontWeight: 600 }}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('enrollment.agent.back')}
          </button>
        )}
      </div>
    </motion.section>
  )
}

export default function AgentEnrollment() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { saveCompleteEnrollment } = useEnrollmentSave()
  const draft = useEnrollmentDraftStore((s) => s.draftData)
  const frequency = useProfileStore((s) => s.employment.payrollFrequency)
  const periods = PERIODS[frequency] ?? 12

  const p = draft.personalization ?? {}
  const knownSalary = draft.savings?.salary ?? p.salary
  // Decisions already on record (e.g. from an earlier enrolment session) are not asked again
  const [knownTax] = useState<TaxMode | null>(() => (draft.source ? (draft.source.roth && draft.source.preTax ? 'mix' : draft.source.roth ? 'roth' : 'pretax') : null))
  const [knownAuto] = useState<boolean | null>(() => (typeof draft.autoIncrease?.enabled === 'boolean' ? draft.autoIncrease.enabled : null))
  const [knownRisk] = useState<PlanChoice['risk'] | null>(() => draft.investment?.riskLevel ?? null)

  const [answers, setAnswers] = useState<Answers>(() => ({
    birthMonth: p.birthMonth ?? 'January',
    birthYear: p.birthYear ?? (p.currentAge ? new Date().getFullYear() - p.currentAge : 1975),
    retirementAge: p.retirementAge ?? 65,
    location: p.selectedLocation ?? '',
    salary: knownSalary ?? 0,
    savings: p.savingsAmount ?? 0,
    risk: p.riskTolerance ?? 'balanced',
    tax: knownTax ?? 'pretax',
  }))
  const answersRef = useRef(answers)

  const [stage, setStage] = useState<Stage>('welcome')
  const [turn, setTurn] = useState<Turn>('preparing')
  const [status, setStatus] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const msgId = useRef(0)
  /** Where each decision began in the transcript, so Back can rewind to it */
  const [history, setHistory] = useState<{ turn: Turn; at: number; decided: Record<Decision, boolean> }[]>([])
  const [plan, setPlan] = useState<PlanChoice | null>(null)
  const [decided, setDecided] = useState<Record<Decision, boolean>>({ contribution: false, tax: false, auto: false, invest: false })

  const [queue, setQueue] = useState<QuestionId[]>([])
  const [askOpen, setAskOpen] = useState(false)
  /** The agent is paused until the participant answers the pop-up */
  const [waiting, setWaiting] = useState(false)
  const [askRound, setAskRound] = useState(0)
  const resolveAnswers = useRef<((a: Answers) => void) | null>(null)
  const rulesAttempt = useRef(0)

  const [edit, setEdit] = useState<EditTarget | null>(null)
  const [editRound, setEditRound] = useState(0)
  const [consent, setConsent] = useState(false)
  const [phase, setPhase] = useState<SubmitPhase>('idle')
  const [confirmation, setConfirmation] = useState<EnrollmentConfirmation | null>(null)
  const [input, setInput] = useState('')

  const wait = (ms: number) => pause(reduce ? 0 : ms)
  const add = (from: Msg['from'], text: string) => setMsgs((m) => [...m, { id: ++msgId.current, from, text }])

  const threadRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
  }, [msgs.length, turn, status, reduce])

  // ── Derived values ──
  const salary = answers.salary || 85_000
  const age = ageFromBirth(answers.birthYear, answers.birthMonth)
  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`
  const paycheckFor = (r: number) => money((salary * r) / 100 / periods)
  const cap = PLAN_CONFIG.match.capPercent
  const funds = plan ? recommendedFunds(plan.risk) : []
  const fee = funds.reduce((s, f) => s + (f.allocation * parseFloat(f.expense)) / 100, 0).toFixed(2)
  const projected = plan
    ? projectBalance({ ...buildQuickEnrollmentDefaults(draft), contributionPercent: plan.rate, riskLevel: plan.risk, salary, currentAge: age, retirementAge: answers.retirementAge }, answers.savings)
    : 0
  const compact = (v: number) => (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1_000).toLocaleString(locale)}K`)
  const planName = t(PLAN_CONFIG.plan.nameKey)
  const autoText = (on: boolean) => (on && plan ? t('enrollment.chat.auto_on_short', { amount: plan.auto.amount, max: plan.auto.max }) : t('enrollment.chat.auto_off_short'))
  const level = (r: PlanChoice['risk']) => t(`enrollment.investment.level_${r}`)

  // ── Background work ──
  const ask = (q: QuestionId[]) =>
    new Promise<Answers>((resolve) => {
      resolveAnswers.current = resolve
      setWaiting(true)
      setQueue(q)
      setAskRound((r) => r + 1)
      setAskOpen(true)
    })

  const onAnswered = (a: Answers) => {
    setAskOpen(false)
    setWaiting(false)
    setAnswers(a)
    answersRef.current = a
    const { mergeDraftSection } = useEnrollmentDraftStore.getState()
    mergeDraftSection('personalization', {
      birthMonth: a.birthMonth,
      birthYear: a.birthYear,
      birthDay: p.birthDay ?? 1,
      currentAge: ageFromBirth(a.birthYear, a.birthMonth),
      retirementAge: a.retirementAge,
      selectedLocation: a.location,
      salary: a.salary,
      savingsAmount: a.savings,
      riskTolerance: a.risk,
    })
    mergeDraftSection('savings', { salary: a.salary })
    resolveAnswers.current?.(a)
    resolveAnswers.current = null
  }

  /** Gets everything ready: missing facts (pop-up), eligibility, plan rules, then the prepared enrolment. */
  const prepare = async (fromRules = false) => {
    setStage('chat')
    setTurn('preparing')
    let a = answersRef.current
    if (!fromRules) {
      setStatus(t('enrollment.chat.status_profile'))
      await wait(600)
      const d = useEnrollmentDraftStore.getState().draftData
      const missing = missingQuestions(d.personalization ?? {}, d.savings?.salary ?? d.personalization?.salary)
      if (missing.length) {
        setStatus(t('enrollment.chat.status_waiting'))
        a = await ask(missing)
      }
      setStatus(t('enrollment.chat.status_eligibility'))
      const eligibility = await checkEligibility(ageFromBirth(a.birthYear, a.birthMonth))
      if (!eligibility.eligible) {
        setStatus(null)
        add('agent', t('enrollment.chat.ineligible', { age: eligibility.minAge }))
        setTurn('ineligible')
        return
      }
    }
    setStatus(t('enrollment.chat.status_rules'))
    try {
      await getPlanRules(rulesAttempt.current++)
    } catch {
      setStatus(null)
      setTurn('rules_error')
      return
    }
    const d = buildQuickEnrollmentDefaults(useEnrollmentDraftStore.getState().draftData)
    setPlan({ rate: d.contributionPercent, tax: knownTax ?? a.tax, auto: knownAuto === null ? d.autoIncrease : { ...d.autoIncrease, enabled: knownAuto }, risk: knownRisk ?? a.risk })
    setStatus(null)
    add('agent', t('enrollment.chat.intro'))
    advance('contribution', { contribution: false, tax: false, auto: false, invest: false })
  }

  /**
   * Moves to the next decision that still needs the participant. Decisions already on record are skipped with a
   * short note, so only essential questions are asked.
   */
  const advance = (from: Turn, done: Record<Decision, boolean>) => {
    let next: Turn = from
    const nowDone = { ...done }
    if (next === 'tax' && knownTax) {
      add('agent', t('enrollment.chat.skip_tax', { tax: t(`enrollment.quick.opt_${knownTax}_title`) }))
      nowDone.tax = true
      next = 'auto'
    }
    if (next === 'auto' && knownAuto !== null) {
      add('agent', knownAuto ? t('enrollment.chat.skip_auto_on') : t('enrollment.chat.skip_auto_off'))
      nowDone.auto = true
      next = 'invest'
    }
    if (next === 'invest' && knownRisk) {
      add('agent', t('enrollment.chat.skip_invest', { level: t(`enrollment.investment.level_${knownRisk}`) }))
      add('agent', t('enrollment.chat.review_intro'))
      nowDone.invest = true
      next = 'review'
    }
    setDecided(nowDone)
    setTurn(next)
  }

  /** Records an answer: remember where this question started (for Back), show the reply, move on. */
  const answer = (decision: Decision, reply: string, next: Turn, agentNote?: string) => {
    const entry = { turn, at: msgId.current, decided }
    setHistory((h) => [...h, entry])
    add('user', reply)
    if (agentNote) add('agent', agentNote)
    const done = { ...decided, [decision]: true }
    advance(next, done)
  }

  const back = () => {
    const prev = history[history.length - 1]
    if (!prev) return
    setHistory((h) => h.slice(0, -1))
    setMsgs((m) => m.filter((x) => x.id <= prev.at))
    setDecided(prev.decided)
    setConsent(false)
    setTurn(prev.turn)
  }

  // ── Submission ──
  const commit = async (conf: EnrollmentConfirmation) => {
    if (!plan) return
    const split = plan.tax === 'pretax' ? { preTax: 100, roth: 0 } : plan.tax === 'roth' ? { preTax: 0, roth: 100 } : { preTax: 50, roth: 50 }
    const allocation = Object.fromEntries(funds.map((f) => [f.ticker, f.allocation]))
    const { mergeDraftSection } = useEnrollmentDraftStore.getState()
    const planType = split.roth > split.preTax ? 'roth' : 'traditional'
    mergeDraftSection('plan', { type: planType, planId: planType, planName: planType === 'roth' ? 'Roth 401(k)' : 'Traditional 401(k)' })
    mergeDraftSection('contribution', { percent: plan.rate, rate: plan.rate, type: 'percentage' })
    mergeDraftSection('source', { ...split, afterTax: 0 })
    mergeDraftSection('autoIncrease', { ...plan.auto })
    mergeDraftSection('investment', { riskLevel: plan.risk, useRecommended: true, customAllocation: allocation })
    useEnrollmentDraftStore.setState((s) => ({
      currentStep: 8,
      highestCompletedStep: Math.max(s.highestCompletedStep, 7),
      draftData: { ...s.draftData, review: { confirmedAt: conf.submittedAt, agreed: true } },
      enrollmentStatus: 'complete',
    }))
    useElectionsStore.getState().applyEnrollment({
      preTaxRate: Math.round(plan.rate * split.preTax) / 100,
      rothRate: Math.round(plan.rate * split.roth) / 100,
      autoIncrease: plan.auto,
      risk: plan.risk,
      mode: 'risk_style',
      allocation,
    })
    const result = await saveCompleteEnrollment()
    if (!result.ok) console.warn('[AgentEnrollment] Save failed, continuing with the local record:', result.error)
  }

  const allDecided = DECISIONS.every((d) => decided[d])
  const busy = phase === 'sending'

  /** "Confirm enrolment": requires every decision and consent; success waits for the system's confirmation. */
  const confirm = async () => {
    if (!plan || !consent || !allDecided || busy) return
    setPhase('sending')
    setStatus(t('enrollment.chat.status_submitting'))
    try {
      const conf = await submitEnrollment({
        planId: PLAN_CONFIG.plan.planId,
        ratePercent: plan.rate,
        preTaxPercent: plan.tax === 'pretax' ? 100 : plan.tax === 'roth' ? 0 : 50,
        rothPercent: plan.tax === 'roth' ? 100 : plan.tax === 'pretax' ? 0 : 50,
        autoIncrease: plan.auto,
        allocation: Object.fromEntries(funds.map((f) => [f.ticker, f.allocation])),
        consented: consent,
      })
      await commit(conf)
      setStatus(null)
      setPhase('idle')
      setConfirmation(conf)
      add('user', t('enrollment.chat.reply_confirm'))
      add('agent', t('enrollment.chat.done_msg'))
      setTurn('done')
    } catch {
      setStatus(null)
      setPhase('error')
    }
  }

  // ── Typed messages ──
  const send = async () => {
    const text = input.trim()
    if (!text || !plan) return
    setInput('')
    add('user', text)
    await wait(400)
    const action = parseAgentCommand(text)
    if (action?.type === 'explain') {
      add('agent', termAnswer(action.term).content)
    } else if ((action?.type === 'rate' || action?.type === 'rate_delta') && turn !== 'done') {
      const want = action.type === 'rate' ? action.value : plan.rate + action.delta
      const v = Math.min(PLAN_LIMITS.rate[1], Math.max(PLAN_LIMITS.rate[0], Math.round(want)))
      setPlan({ ...plan, rate: v })
      add('agent', t('enrollment.chat.typed_rate', { rate: v, amount: paycheckFor(v) }))
      if (turn === 'contribution') answer('contribution', t('enrollment.chat.reply_rate', { rate: v }), 'tax')
    } else if (action?.type === 'enrol') {
      add('agent', allDecided ? t('enrollment.chat.typed_enrol_ready') : t('enrollment.chat.typed_enrol_more'))
    } else {
      add('agent', t('enrollment.chat.typed_help'))
    }
  }

  // ── Success ──
  const summaryRows = [
    { key: 'rate', label: t('enrollment.flow.row_rate'), value: plan && decided.contribution ? t('enrollment.flow.rate_short', { rate: plan.rate, amount: paycheckFor(plan.rate) }) : undefined },
    { key: 'match', label: t('enrollment.flow.row_match'), value: plan && decided.contribution ? t('enrollment.flow.per_year', { amount: money(employerMatch(salary, plan.rate)) }) : undefined },
    { key: 'tax', label: t('enrollment.flow.row_tax'), value: plan && decided.tax ? t(`enrollment.quick.opt_${plan.tax}_title`) : undefined, secondary: true },
    { key: 'auto', label: t('enrollment.flow.row_auto'), value: plan && decided.auto ? autoText(plan.auto.enabled) : undefined, secondary: true },
    { key: 'invest', label: t('enrollment.flow.row_invest'), value: plan && decided.invest ? t('enrollment.chat.mix', { level: level(plan.risk) }) : undefined, secondary: true },
    { key: 'proj', label: t('enrollment.flow.row_projection'), value: plan && allDecided ? compact(projected) : undefined },
  ]
  const doneCount = DECISIONS.filter((d) => decided[d]).length + (turn === 'done' ? 1 : 0)

  if (stage === 'welcome') {
    return (
      <div className="relative mx-auto flex min-h-[calc(100vh-11rem)] max-w-5xl flex-col">
        <motion.section initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="m-auto flex max-w-xl flex-col items-center px-2 py-10 text-center">
          <Orb size={56} />
          <p className="mt-6 text-blue-700 dark:text-blue-300" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.04em' }}>{t('enrollment.flow.eyebrow')}</p>
          <h1 className="mt-2 text-[#0f2a4a] dark:text-white" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.5rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {t('enrollment.flow.welcome_title')}
          </h1>
          <p className="mt-4 max-w-md text-slate-600 dark:text-gray-300" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{t('enrollment.chat.welcome_body')}</p>
          <button
            type="button"
            onClick={() => void prepare()}
            className="mt-8 inline-flex min-h-[54px] items-center gap-2.5 rounded-xl bg-blue-600 px-8 text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            style={{ fontSize: '1.08rem', fontWeight: 700 }}
          >
            {t('enrollment.flow.enrol_now')}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
          <p className="mt-4 text-slate-400" style={{ fontSize: '0.82rem' }}>{t('enrollment.flow.welcome_note')}</p>
        </motion.section>
        <QuestionModal key={askRound} open={askOpen} queue={queue} initial={answers} onFinish={onAnswered} onClose={() => setAskOpen(false)} />
      </div>
    )
  }

  return (
    <div className="relative -mx-4 -my-6 bg-gradient-to-b from-blue-50/60 via-white to-white px-4 py-6 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 sm:-mx-6 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:h-[calc(100vh-9.5rem)] lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Conversation */}
        <section className="order-2 flex min-h-0 flex-col lg:order-1" aria-label={t('enrollment.chat.conversation')}>
          <div ref={threadRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-3 pr-1">
            {msgs.map((m) =>
              m.from === 'agent' ? (
                <motion.div key={m.id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                  <span className="mt-1">
                    <Orb />
                  </span>
                  <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[#0f2a4a] shadow-[0_1px_3px_rgba(15,42,74,0.08)] ring-1 ring-slate-200/70 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-800" style={{ fontSize: '0.98rem', lineHeight: 1.55 }}>
                    <Rich text={m.text} />
                  </p>
                </motion.div>
              ) : (
                <motion.div key={m.id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-tr-md bg-blue-600 px-4 py-2.5 text-white" style={{ fontSize: '0.98rem' }}>
                    {m.text}
                  </p>
                </motion.div>
              ),
            )}

            {status && !(waiting && !askOpen) && (
              <p className="flex items-center gap-2 text-slate-500 dark:text-gray-400 sm:pl-10" style={{ fontSize: '0.9rem' }} role="status">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden />
                {status}
              </p>
            )}

            {turn === 'preparing' && waiting && !askOpen && (
              <QuestionCard label={t('enrollment.chat.status_waiting')}>
                <p className="text-[#0f2a4a] dark:text-white" style={{ fontSize: '1rem' }}>{t('enrollment.chat.waiting_paused')}</p>
                <AnswerButtons items={[{ label: t('enrollment.flow.answer_now'), primary: true, onClick: () => setAskOpen(true) }]} />
              </QuestionCard>
            )}

            {turn === 'rules_error' && (
              <QuestionCard label={t('enrollment.flow.rules_error_title')}>
                <p role="alert" className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4" aria-hidden />
                  {t('enrollment.flow.rules_error_title')}
                </p>
                <p className="mt-1 text-slate-600 dark:text-gray-300">{t('enrollment.flow.rules_error_body')}</p>
                <AnswerButtons items={[{ label: t('enrollment.agent.retry'), primary: true, onClick: () => void prepare(true) }]} />
              </QuestionCard>
            )}

            {plan && turn === 'contribution' && (
              <QuestionCard label={t('enrollment.flow.row_rate')}>
                <p className="text-[#0f2a4a] dark:text-white" style={{ fontSize: '1.02rem', lineHeight: 1.55 }}>
                  <Rich text={t('enrollment.chat.q_contribution', { rate: plan.rate, amount: paycheckFor(plan.rate) })} />
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-slate-600 dark:text-gray-300" style={{ fontSize: '0.92rem' }}>
                  {plan.rate >= cap
                    ? t('enrollment.chat.match_note', { amount: money(employerMatch(salary, plan.rate)), cap })
                    : t('enrollment.chat.match_gap', { cap, amount: money(employerMatch(salary, cap) - employerMatch(salary, plan.rate)) })}
                  <TermInfo term="employer_match" />
                </p>
                <AnswerButtons
                  items={[
                    { label: t('enrollment.chat.keep_rate', { rate: plan.rate }), primary: true, onClick: () => answer('contribution', t('enrollment.chat.reply_keep', { rate: plan.rate }), 'tax') },
                    { label: t('enrollment.chat.change_rate'), onClick: () => { setEditRound((n) => n + 1); setEdit('rate') } },
                  ]}
                />
              </QuestionCard>
            )}

            {plan && turn === 'tax' && (
              <QuestionCard label={t('enrollment.flow.row_tax')} onBack={back}>
                <p className="text-[#0f2a4a] dark:text-white" style={{ fontSize: '1.02rem' }}>{t('enrollment.chat.q_tax')}</p>
                <ul className="mt-2 space-y-1.5 text-slate-600 dark:text-gray-300" style={{ fontSize: '0.92rem' }}>
                  <li><strong className="text-[#0f2a4a] dark:text-white">{t('enrollment.quick.opt_pretax_title')}:</strong> {t('enrollment.chat.tax_pretax_plain')}</li>
                  <li><strong className="text-[#0f2a4a] dark:text-white">{t('enrollment.quick.opt_roth_title')}:</strong> {t('enrollment.chat.tax_roth_plain')}</li>
                </ul>
                <AnswerButtons
                  items={(['pretax', 'roth', 'mix'] as const).map((m) => ({
                    label: t(`enrollment.quick.opt_${m}_title`),
                    primary: m === 'pretax',
                    onClick: () => {
                      setPlan({ ...plan, tax: m })
                      answer('tax', t(`enrollment.quick.opt_${m}_title`), 'auto')
                    },
                  }))}
                />
              </QuestionCard>
            )}

            {plan && turn === 'auto' && (
              <QuestionCard label={t('enrollment.flow.row_auto')} onBack={back}>
                <p className="text-[#0f2a4a] dark:text-white" style={{ fontSize: '1.02rem' }}>{t('enrollment.chat.q_auto')}</p>
                <p className="mt-1.5 text-slate-600 dark:text-gray-300" style={{ fontSize: '0.92rem' }}>
                  {t('enrollment.chat.auto_explain', { amount: plan.auto.amount, max: plan.auto.max })}
                </p>
                <AnswerButtons
                  items={[
                    { label: t('enrollment.chat.yes'), primary: true, onClick: () => { setPlan({ ...plan, auto: { ...plan.auto, enabled: true } }); answer('auto', t('enrollment.chat.reply_auto_yes'), 'invest') } },
                    { label: t('enrollment.chat.no'), onClick: () => { setPlan({ ...plan, auto: { ...plan.auto, enabled: false } }); answer('auto', t('enrollment.chat.reply_auto_no'), 'invest') } },
                  ]}
                />
              </QuestionCard>
            )}

            {plan && turn === 'invest' && (
              <QuestionCard label={t('enrollment.flow.row_invest')} onBack={back}>
                <p className="text-[#0f2a4a] dark:text-white" style={{ fontSize: '1.02rem', lineHeight: 1.55 }}>
                  <Rich text={t('enrollment.chat.q_invest', { level: level(plan.risk), count: funds.length, fee })} />
                </p>
                <p className="mt-1.5 text-slate-600 dark:text-gray-300" style={{ fontSize: '0.92rem' }}>{t('enrollment.chat.invest_note')}</p>
                <AnswerButtons
                  items={[
                    { label: t('enrollment.chat.use_mix', { level: level(plan.risk) }), primary: true, onClick: () => answer('invest', t('enrollment.chat.mix', { level: level(plan.risk) }), 'review', t('enrollment.chat.review_intro')) },
                    { label: t('enrollment.chat.see_options'), onClick: () => { setEditRound((n) => n + 1); setEdit('risk') } },
                  ]}
                />
              </QuestionCard>
            )}

            {plan && turn === 'review' && (
              <QuestionCard label={t('enrollment.chat.review_title')} onBack={back}>
                <p className="text-[#0f2a4a] dark:text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('enrollment.chat.review_title')}</p>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {[
                    [t('enrollment.flow.row_rate'), t('enrollment.flow.rate_value', { rate: plan.rate, amount: paycheckFor(plan.rate) })],
                    [t('enrollment.flow.row_match'), t('enrollment.flow.per_year', { amount: money(employerMatch(salary, plan.rate)) })],
                    [t('enrollment.flow.row_tax'), t(`enrollment.quick.opt_${plan.tax}_title`)],
                    [t('enrollment.flow.row_auto'), autoText(plan.auto.enabled)],
                    [t('enrollment.flow.row_invest'), `${t('enrollment.chat.mix', { level: level(plan.risk) })} · ${t('enrollment.flow.fee', { fee })}`],
                    [t('enrollment.flow.row_projection'), t('enrollment.chat.projection_value', { amount: compact(projected), age: answers.retirementAge })],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-slate-500 dark:text-gray-400" style={{ fontSize: '0.84rem' }}>{k}</dt>
                      <dd className="mt-0.5 text-[#0f2a4a] dark:text-white" style={{ fontSize: '0.98rem', fontWeight: 600 }}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <AnswerButtons
                  items={[
                    { label: t('enrollment.chat.looks_right'), primary: true, onClick: () => { const entry = { turn, at: msgId.current, decided }; setHistory((h) => [...h, entry]); add('user', t('enrollment.chat.reply_review')); add('agent', t('enrollment.chat.consent_intro')); setTurn('consent') } },
                    { label: t('enrollment.chat.change_rate'), onClick: () => { setEditRound((n) => n + 1); setEdit('rate') } },
                    { label: t('enrollment.chat.see_options'), onClick: () => { setEditRound((n) => n + 1); setEdit('risk') } },
                  ]}
                />
              </QuestionCard>
            )}

            {plan && turn === 'consent' && (
              <QuestionCard label={t('enrollment.chat.consent_title')} onBack={busy ? undefined : back}>
                <p className="text-[#0f2a4a] dark:text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('enrollment.chat.consent_title')}</p>
                <details className="group mt-3 rounded-xl border border-slate-200 dark:border-gray-700">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-3 text-[#0f2a4a] marker:hidden dark:text-white" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {t('enrollment.agent.summary.disclosures_group', { n: PLAN_CONFIG.disclosures.length })}
                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="space-y-3 px-3 pb-3 text-slate-600 dark:text-gray-300" style={{ fontSize: '0.9rem', lineHeight: 1.55 }}>
                    {PLAN_CONFIG.disclosures.map((id) => (
                      <div key={id}>
                        <h3 className="font-semibold text-[#0f2a4a] dark:text-white">{t(`enrollment.agent.disclosures.${id}.title`)}</h3>
                        <p>
                          <Rich text={t(`enrollment.agent.disclosures.${id}.body`, { fee, cap, amount: plan.auto.amount, max: plan.auto.max })} />
                          {id === 'plan_terms' && (
                            <>
                              {' '}
                              <LegalHrefLink href={LEGAL.termsOfServiceHref} className="font-semibold text-blue-700 hover:underline dark:text-blue-300">
                                {t('enrollment.review_page.view_terms')}
                              </LegalHrefLink>
                            </>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
                <label className={cn('mt-3 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5', consent ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30' : 'border-slate-200 dark:border-gray-700')}>
                  <input type="checkbox" checked={consent} disabled={busy} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-blue-600" />
                  <span className="text-[#0f2a4a] dark:text-gray-100" style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                    <Rich text={t('enrollment.agent.summary.consent', { plan: planName })} />
                  </span>
                </label>
                {phase === 'error' && (
                  <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-red-800 dark:bg-red-950/30 dark:text-red-200" style={{ fontSize: '0.92rem' }}>
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <strong className="block">{t('enrollment.agent.summary.submit_error_title')}</strong>
                      {t('enrollment.agent.summary.submit_error_body')}
                    </span>
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void confirm()}
                    disabled={!consent || !allDecided || busy}
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-blue-600 px-6 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                    style={{ fontSize: '1rem', fontWeight: 700 }}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : phase === 'error' ? <RotateCw className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                    {busy ? t('enrollment.chat.submitting') : phase === 'error' ? t('enrollment.agent.summary.try_again') : t('enrollment.flow.confirm')}
                  </button>
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400" style={{ fontSize: '0.85rem' }}>
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    {!consent ? t('enrollment.agent.summary.needs_consent') : t('enrollment.agent.summary.sim_short')}
                  </span>
                </div>
              </QuestionCard>
            )}

            {turn === 'done' && confirmation && (
              <QuestionCard label={t('enrollment.chat.done_title')}>
                <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  <Check className="h-5 w-5" aria-hidden />
                  {t('enrollment.chat.done_title')}
                </p>
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-600 dark:bg-gray-800 dark:text-gray-300" style={{ fontSize: '0.86rem' }}>{t('enrollment.chat.sim_note')}</p>
                <AnswerButtons
                  items={[
                    { label: t('enrollment.agent.confirmed.dashboard'), primary: true, onClick: () => navigate('/dashboard') },
                    { label: t('enrollment.agent.confirmed.manage'), onClick: () => navigate('/enrollment/manage') },
                  ]}
                />
              </QuestionCard>
            )}
          </div>

          {/* Chat input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
            className="mt-2 flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-4 shadow-[0_4px_16px_rgba(15,42,74,0.06)] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-blue-900/40"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!plan || busy}
              placeholder={t('enrollment.chat.input_placeholder')}
              aria-label={t('enrollment.chat.input_label')}
              className="min-h-[40px] min-w-0 flex-1 bg-transparent text-base text-[#0f2a4a] placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:text-white"
            />
            <button type="submit" disabled={!input.trim()} aria-label={t('enrollment.agent.send')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400">
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </section>

        {/* Compact summary */}
        <div className="order-1 lg:order-2">
          <SummaryCard rows={summaryRows} sample={PLAN_CONFIG.isSample} progress={plan ? { done: doneCount, total: DECISIONS.length + 1 } : undefined} />
        </div>
      </div>

      <QuestionModal key={askRound} open={askOpen} queue={queue} initial={answers} onFinish={onAnswered} onClose={() => setAskOpen(false)} />
      {plan && (
        <EditModal
          key={editRound}
          target={edit}
          plan={plan}
          salary={salary}
          periods={periods}
          onClose={() => setEdit(null)}
          onSave={(next) => {
            const target = edit
            setPlan(next)
            setEdit(null)
            setConsent(false)
            // A change made from a question answers it; a change from the review just updates the plan
            if (target === 'rate' && turn === 'contribution') answer('contribution', t('enrollment.chat.reply_rate', { rate: next.rate }), 'tax')
            else if (target === 'risk' && turn === 'invest') answer('invest', t('enrollment.chat.mix', { level: level(next.risk) }), 'review', t('enrollment.chat.review_intro'))
            else if (turn === 'review') add('agent', t('enrollment.chat.updated'))
          }}
        />
      )}
    </div>
  )
}
