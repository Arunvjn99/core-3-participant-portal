import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowUp, ChevronRight, Pause, Play, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { useAIStore } from '@/core/store/aiStore'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { EnrollmentPersonalizationModal } from '../components/EnrollmentPersonalizationModal'
import { HeroRideScene } from '../components/HeroRideScene'
import AdvisorModal from '@/features/advisors/AdvisorModal'
import { PLAN_CONFIG } from '@/features/enrollment/agent/planConfig'
import { formatFirstNameForDisplay, getAuthenticatedFirstName } from '@/lib/userDisplayName'

/**
 * The dashboard before enrollment. A first-time user has no data worth charting, so the banner carries one message and one
 * action, with the reasons and the ways to get help below it.
 */

const ease = [0.22, 1, 0.36, 1] as const

type DayPeriod = 'morning' | 'afternoon' | 'evening'

function getLocalDayPeriod(): DayPeriod {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  return 'evening'
}

const HERO_TIME_GREETING_KEYS: Record<DayPeriod, { generic: string; withName: string }> = {
  morning: { generic: 'hero.greeting_morning', withName: 'hero.greeting_morning_with_name' },
  afternoon: { generic: 'hero.greeting_afternoon', withName: 'hero.greeting_afternoon_with_name' },
  evening: { generic: 'hero.greeting_evening', withName: 'hero.greeting_evening_with_name' },
}

const ADVISORS = [
  { name: 'Sarah Jenkins', initials: 'SJ', from: '#2563eb', to: '#1d4ed8' },
  { name: 'Marcus Chen', initials: 'MC', from: '#047857', to: '#065f46' },
  { name: 'Priya Patel', initials: 'PP', from: '#b45309', to: '#92400e' },
]

/** Makes a whole card respond to its one real button, so it stays one stop for keyboards and screen readers. */
const stretchedAction =
  "after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary"
/** Visible on the sky, the scene and the brand color alike. */
const bannerFocus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B1533] dark:focus-visible:outline-white'

/** Reveals a card the first time it scrolls into view. */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Plays while a card is on screen, holds while it's hovered or focused, and stays still for people who prefer less motion. */
function useCardMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { margin: '-60px' })
  const [held, setHeld] = useState(false)
  return {
    ref,
    reduce,
    running: inView && !reduce && !held,
    hold: { onMouseEnter: () => setHeld(true), onMouseLeave: () => setHeld(false), onFocus: () => setHeld(true), onBlur: () => setHeld(false) },
  }
}

// ─── Ask Core AI ─────────────────────────────────────────────────────────────
interface ChatTurn {
  q: string
  a: string
}

type ExchangePhase = 'arriving' | 'typing' | 'thinking' | 'answering' | 'reading'
interface Exchange {
  turn: number
  phase: ExchangePhase
  count: number
}

const EXCHANGE_DELAY: Record<ExchangePhase, number> = { arriving: 350, typing: 26, thinking: 650, answering: 45, reading: 2200 }

function nextExchange(e: Exchange, turns: ChatTurn[]): Exchange {
  const { q, a } = turns[e.turn % turns.length]
  if (e.phase === 'arriving') return { ...e, phase: 'typing', count: 0 }
  if (e.phase === 'typing') return e.count < q.length ? { ...e, count: e.count + 1 } : { ...e, phase: 'thinking', count: 0 }
  if (e.phase === 'thinking') return { ...e, phase: 'answering', count: 1 }
  if (e.phase === 'answering') return e.count < a.split(' ').length ? { ...e, count: e.count + 1 } : { ...e, phase: 'reading', count: 0 }
  return { turn: e.turn + 1, phase: 'arriving', count: 0 }
}

/** One question and its answer. The answer's words are all in place from the start and fade in, so nothing reflows as they arrive. */
function ChatMessages({ turn, state, running }: { turn: ChatTurn; state: Exchange; running: boolean }) {
  const reduce = useReducedMotion()
  const { phase, count } = state
  const sent = phase === 'thinking' || phase === 'answering' || phase === 'reading'
  const words = turn.a.split(' ')
  const shown = phase === 'thinking' ? 0 : phase === 'answering' ? count : words.length
  const bubbleIn = reduce ? false : { opacity: 0, y: 8 }

  return (
    <motion.div
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -10, transition: { duration: 0.25, ease } }}
      className="absolute inset-x-0 top-0 flex flex-col gap-2"
    >
      {sent && (
        <>
          <motion.p
            initial={bubbleIn}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease }}
            className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13px] font-semibold leading-snug text-white dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
          >
            {turn.q}
          </motion.p>
          <motion.div
            initial={bubbleIn}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease, delay: reduce ? 0 : 0.12 }}
            className="flex w-[94%] items-start gap-2 self-start rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5 text-left dark:bg-slate-800"
          >
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
            <motion.div
              initial={false}
              animate={{ height: phase === 'thinking' ? 18 : 'auto' }}
              transition={reduce ? { duration: 0 } : { duration: 0.25, ease }}
              className="relative min-w-0 flex-1 overflow-hidden"
            >
              <p className="text-[13px] leading-snug text-slate-700 dark:text-slate-200">
                {words.map((word, i) => (
                  <span key={i} className={`transition-opacity duration-200 motion-reduce:transition-none ${i < shown ? 'opacity-100' : 'opacity-0'}`}>
                    {word}{i < words.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </p>
              {phase === 'thinking' && (
                <span className="absolute left-0 top-0 flex h-[18px] items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-slate-300"
                      animate={running ? { opacity: [0.3, 1, 0.3], y: [0, -2, 0] } : { opacity: 0.5, y: 0 }}
                      transition={running ? { duration: 0.7, repeat: Infinity, delay: i * 0.12 } : { duration: 0.2 }}
                    />
                  ))}
                </span>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

function AskCoreAiCard({ turns, onStart }: { turns: ChatTurn[]; onStart: () => void }) {
  const { t } = useTranslation()
  const { ref, running, hold } = useCardMotion<HTMLDivElement>()
  const [state, tick] = useReducer((e: Exchange) => nextExchange(e, turns), { turn: 0, phase: 'reading', count: 0 })

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(tick, EXCHANGE_DELAY[state.phase])
    return () => window.clearTimeout(id)
  }, [running, state])

  const turn = turns[state.turn % turns.length]
  const typing = state.phase === 'typing' && state.count > 0

  return (
    <div ref={ref} {...hold} className="group relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#EAF2FF_0%,#F6F9FF_100%)] p-5 xl:min-h-0 text-left ring-1 ring-blue-100 dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.16)_0%,rgba(15,23,42,1)_100%)] dark:ring-blue-400/20">
      <div className="flex flex-col items-start">
        <h3 className="text-[16px] font-bold text-text-primary">{t('core_ai.title')}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{t('pre_dashboard.ask_note')}</p>
      </div>

      {/* The chat window stays still; only the conversation inside it changes */}
      <div className="pointer-events-none mt-3 flex min-h-[220px] flex-1 flex-col gap-2.5 rounded-2xl bg-surface-card p-2.5 xl:min-h-0 shadow-[0_12px_28px_-18px_rgba(30,64,175,0.35)] ring-1 ring-blue-100 dark:ring-white/10" aria-hidden>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence initial={false}>
            <ChatMessages key={state.turn} turn={turn} state={state} running={running} />
          </AnimatePresence>
        </div>

        {/* One line tall whatever is typed: a long question scrolls left, as it does in a real box */}
        <div className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-slate-100 pl-4 pr-1.5 text-left text-[13px] dark:bg-slate-800">
          {state.phase === 'typing' ? (
            <span className={`flex min-w-0 flex-1 justify-end overflow-hidden ${typing ? 'font-semibold text-text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
              <span className="min-w-full shrink-0 whitespace-nowrap">
                {typing ? turn.q.slice(0, state.count) : t('core_ai.placeholder')}
                {typing && <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-current" />}
              </span>
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{t('core_ai.placeholder')}</span>
          )}
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-200 motion-reduce:transition-none ${typing ? 'bg-primary' : 'bg-slate-400 dark:bg-slate-600'}`}>
            <ArrowUp className="h-4 w-4" />
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={`mt-4 inline-flex self-start h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] ${stretchedAction}`}
      >
        {t('core_ai.start_chatting')}
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </button>
    </div>
  )
}

// ─── Talk to an Advisor ──────────────────────────────────────────────────────
/** A slim strip: the advisors take turns stepping forward while the promise and the button stay put. */
function AdvisorCard({ onMeet }: { onMeet: () => void }) {
  const { t } = useTranslation()
  const { ref, reduce, running, hold } = useCardMotion<HTMLDivElement>()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % ADVISORS.length), 2400)
    return () => window.clearInterval(id)
  }, [running])

  return (
    <div ref={ref} {...hold} className="group relative flex h-full flex-col rounded-[20px] bg-slate-100 px-5 py-3.5 text-left dark:bg-slate-900 dark:ring-1 dark:ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-bold text-text-primary">{t('advisor.title')}</h3>
        <div className="flex shrink-0 -space-x-2.5" aria-hidden>
          {ADVISORS.map((a, i) => (
            <motion.span
              key={a.name}
              initial={false}
              animate={{ scale: i === active ? 1 : 0.86, opacity: i === active ? 1 : 0.7 }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, ease }}
              style={{ background: `linear-gradient(135deg,${a.from},${a.to})`, zIndex: i === active ? 2 : 1 }}
              className="relative flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-slate-100 dark:ring-slate-900"
            >
              {a.initials}
            </motion.span>
          ))}
        </div>
      </div>
      <p className="mt-1 text-[13px] leading-snug text-slate-600 dark:text-slate-300">{t('pre_dashboard.advisor_note')}</p>
      <button
        type="button"
        onClick={onMeet}
        className={`mt-auto inline-flex h-10 shrink-0 items-center gap-1 self-start rounded-full bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_-12px_rgba(11,21,51,0.35)] ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-white/15 ${stretchedAction}`}
      >
        {t('advisor.meet_expert')}
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
export function PreEnrollmentDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false)
  const [heroPaused, setHeroPaused] = useState(false)
  const [heroEnded, setHeroEnded] = useState(false)
  const [heroRun, setHeroRun] = useState(0)
  const handleHeroEnded = useCallback(() => setHeroEnded(true), [])
  const { ref: heroRef, running: heroRunning } = useCardMotion<HTMLElement>()
  const { openChat } = useAIStore()
  const { user, loading: authLoading } = useAuth()
  const { profile } = useUser()

  const firstNameRaw = getAuthenticatedFirstName(profile, user)
  const displayFirstName = formatFirstNameForDisplay(firstNameRaw)
  /** Prefer profile/meta/email from getAuthenticatedFirstName; if still generic, use email local-part when session exists. */
  const emailLocal =
    user?.email?.split('@')[0] ?? (profile?.email?.includes('@') ? profile.email.split('@')[0] : undefined)
  const heroPillName =
    displayFirstName !== 'there'
      ? displayFirstName
      : emailLocal
        ? formatFirstNameForDisplay(emailLocal)
        : 'there'
  /** Time-based greeting + first name when session is ready and we have a usable name (see getAuthenticatedFirstName). */
  const heroGreetingName = !authLoading && heroPillName !== 'there' ? heroPillName : null
  const heroGreetingKeys = HERO_TIME_GREETING_KEYS[getLocalDayPeriod()]

  const cap = PLAN_CONFIG.match.capPercent
  const matchRate = PLAN_CONFIG.match.ratePercent
  const chatTurns = [
    { q: t('pre_dashboard.chat_q2'), a: t('pre_dashboard.chat_a2', { rate: matchRate, cap }) },
    { q: t('pre_dashboard.chat_q1'), a: t('pre_dashboard.chat_a1') },
    { q: t('pre_dashboard.chat_q3'), a: t('pre_dashboard.chat_a3') },
  ]
  const dollarsPerDollar = matchRate % 100 === 0 ? `$${matchRate / 100}` : `$${(matchRate / 100).toFixed(2)}`

  return (
    <AnimatedPage className="min-h-full">
      <EnrollmentPersonalizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => navigate('/enrollment/plan')}
        userName={authLoading ? 'there' : heroPillName}
      />

      <div className="min-h-screen bg-surface-page font-sans text-text-primary">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 py-6 sm:px-6 lg:gap-6 lg:px-8 lg:pt-5">
          {/* Banner: one message and one action, beside the story of bills paid and the road ahead */}
          <motion.section
            ref={heroRef}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            aria-labelledby="pre-dashboard-title"
            className="relative isolate flex min-h-[340px] overflow-hidden rounded-[24px] lg:min-h-[280px] xl:min-h-[236px] bg-[radial-gradient(90%_120%_at_0%_0%,#D9F3FF_0%,rgba(217,243,255,0)_60%),radial-gradient(80%_120%_at_100%_100%,#DDF9E3_0%,rgba(221,249,227,0)_60%),linear-gradient(#FFFFFF,#FFFFFF)] ring-1 ring-slate-200/70 lg:items-center dark:bg-[radial-gradient(90%_120%_at_0%_0%,#12305C_0%,rgba(18,48,92,0)_60%),radial-gradient(80%_120%_at_100%_100%,#123F46_0%,rgba(18,63,70,0)_60%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10"
          >
            <div className="pointer-events-none absolute inset-x-3 bottom-3 -z-10 h-[170px] sm:h-[220px] lg:inset-y-3 lg:left-auto lg:right-4 lg:h-auto lg:w-[calc(100%-570px)]">
              <HeroRideScene key={heroRun} running={heroRunning && !heroPaused} onEnded={handleHeroEnded} />
            </div>

            <div className="relative w-full min-w-0 p-5 pb-[190px] sm:p-10 sm:pb-[240px] lg:max-w-[560px] lg:py-6 xl:py-5">
              <p className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                {heroGreetingName ? t(heroGreetingKeys.withName, { name: heroGreetingName }) : t(heroGreetingKeys.generic)}
              </p>
              <h1 id="pre-dashboard-title" className="mt-2 max-w-[560px] text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">
                {t('pre_dashboard.title')}
                {' '}
                <span className="text-primary dark:text-blue-300">{t('pre_dashboard.title_accent')}</span>
              </h1>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Primary: one-click enrollment */}
                <button
                  type="button"
                  onClick={() => navigate('/enrollment/quick')}
                  className={`group inline-flex items-center justify-between gap-3 rounded-full bg-primary text-left text-white dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] sm:gap-5 sm:whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-10px_18px_rgba(11,21,51,0.2),0_0_0_4px_rgba(255,255,255,0.4),0_16px_32px_-12px_rgba(37,99,235,0.8)] transition-transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${bannerFocus} dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-10px_18px_rgba(11,21,51,0.25),0_0_0_4px_rgba(255,255,255,0.12),0_16px_32px_-12px_rgba(37,99,235,0.8)] min-h-14 py-2 pl-5 pr-2 sm:pl-6`}
                >
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <Zap className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span>
                      <span className="block text-sm font-semibold leading-tight">{t('hero.one_click')}</span>
                      <span className="block text-[12px] leading-tight text-white">{t('hero.one_click_note')}</span>
                    </span>
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary transition-transform group-hover:translate-x-0.5" aria-hidden>
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </button>
                {/* Secondary: guided enrollment */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className={`min-h-14 rounded-full bg-white px-5 py-2 text-center text-slate-900 sm:whitespace-nowrap sm:px-6 shadow-[0_8px_20px_-10px_rgba(11,21,51,0.3)] ring-1 ring-slate-200 transition-transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${bannerFocus} dark:bg-slate-900 dark:text-white dark:ring-1 dark:ring-white/15`}
                >
                  <span className="block text-sm font-semibold leading-tight">{t('hero.start_enrollment')}</span>
                  <span className="block text-[12px] leading-tight text-slate-600 dark:text-slate-300">{t('hero.time_note')}</span>
                </button>
              </div>
              {/* Tertiary: learn about the plan */}
              <Link to="/enrollment/plan" className={`mt-1.5 inline-flex min-h-11 items-center gap-0.5 rounded text-[13px] font-semibold text-slate-800 hover:underline ${bannerFocus} dark:text-slate-200`}>
                {t('hero.learn_plan')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {!reduce && (
              <button
                type="button"
                onClick={() => {
                  if (heroEnded) {
                    setHeroEnded(false)
                    setHeroPaused(false)
                    setHeroRun((run) => run + 1)
                  } else {
                    setHeroPaused((paused) => !paused)
                  }
                }}
                aria-label={t(heroEnded ? 'pre_dashboard.replay_animation' : heroPaused ? 'pre_dashboard.play_animation' : 'pre_dashboard.pause_animation')}
                className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-[0_6px_14px_-8px_rgba(11,21,51,0.4)] ring-1 ring-slate-200 transition-colors hover:bg-white ${bannerFocus} dark:bg-slate-900/85 dark:text-slate-100 dark:ring-white/15 dark:hover:bg-slate-900`}
              >
                {heroEnded ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : heroPaused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
              </button>
            )}
          </motion.section>

          {/* Why enroll now, ranked: the one-click setup leads, Ask Core AI sits beside it, two quick lessons follow, then an advisor */}
          <section aria-labelledby="pre-dashboard-why">
            <div className="mb-3 xl:flex xl:items-baseline xl:gap-4">
              <h2 id="pre-dashboard-why" className="text-[22px] font-bold leading-tight text-text-primary">{t('pre_dashboard.why_title')}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-text-secondary md:whitespace-nowrap xl:mt-0">{t('pre_dashboard.why_sub')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
              {/* Core AI does the setup: the lead card */}
              <Reveal className="relative flex min-h-[180px] flex-col overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#0B1533_0%,#122B6B_100%)] p-5 text-left ring-1 ring-white/10 md:col-span-2 xl:col-span-3">
                <span className="pointer-events-none absolute -bottom-24 right-10 h-56 w-80 rounded-full bg-primary opacity-50 blur-[80px]" aria-hidden />
                <div className="relative flex items-start justify-between gap-3">
                  <h3 className="text-[16px] font-bold text-white">{t('pre_dashboard.ai_title')}</h3>
                  <span className="flex h-10 w-10 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 via-slate-800 to-slate-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-5px_10px_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.5)] ring-1 ring-white/15" aria-hidden>
                    <Sparkles className="h-5 w-5" />
                  </span>
                </div>
                <div className="relative mt-auto flex flex-col gap-3 pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                  <span className="block" aria-hidden>
                    <span className="block text-[48px] font-bold leading-none tracking-tight text-white">{t('pre_dashboard.ai_big')}</span>
                    <span className="block h-[30px] -scale-y-100 overflow-hidden text-[48px] font-bold leading-none tracking-tight text-white opacity-25 [mask-image:linear-gradient(to_top,black,transparent_80%)]">{t('pre_dashboard.ai_big')}</span>
                  </span>
                  <span className="max-w-[280px] pb-2 text-[13px] leading-relaxed text-white/90">{t('pre_dashboard.ai_desc')}</span>
                </div>
              </Reveal>

              {/* Ask Core AI: the second feature, a tall column so the chat is always in view */}
              <Reveal delay={0.06} className="md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-span-3 lg:row-start-1 xl:col-start-4 xl:row-span-2">
                <AskCoreAiCard turns={chatTurns} onStart={openChat} />
              </Reveal>

              {/* Employer match: a quick lesson */}
              <Reveal delay={0.1} className="relative flex min-h-[144px] flex-col overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#ECFDF5_0%,#F7FDFA_100%)] px-5 py-3.5 text-left ring-1 ring-emerald-100 dark:bg-[linear-gradient(180deg,rgba(16,185,129,0.12)_0%,rgba(15,23,42,1)_100%)] dark:ring-emerald-400/15">
                <h3 className="text-[15px] font-bold text-text-primary">{t('pre_dashboard.match_title')}</h3>
                <p className="mt-1 text-[13px] leading-normal text-slate-600 dark:text-slate-300">{t('pre_dashboard.match_desc', { you: '$1', employer: dollarsPerDollar, cap })}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-[12px] font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20">
                    {PLAN_CONFIG.vestingYears === 0 ? t('pre_dashboard.chip_vest_now') : t('pre_dashboard.chip_vest_years', { years: PLAN_CONFIG.vestingYears })}
                  </span>
                  <span className="flex shrink-0 items-center" aria-hidden>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[13px] font-bold text-slate-900 shadow-[0_8px_16px_-10px_rgba(11,21,51,0.4)] ring-1 ring-emerald-100 dark:bg-slate-800 dark:text-white dark:ring-white/10">$1</span>
                    <span className="z-10 -mx-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[12px] font-bold text-white">+</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-[0_8px_16px_-10px_rgba(37,99,235,0.7)]">{dollarsPerDollar}</span>
                  </span>
                </div>
              </Reveal>

              {/* Tax: a quick lesson */}
              <Reveal delay={0.14} className="relative flex min-h-[144px] flex-col overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#FFF7EB_0%,#FFFCF7_100%)] px-5 py-3.5 text-left ring-1 ring-amber-100 dark:bg-[linear-gradient(180deg,rgba(245,158,11,0.12)_0%,rgba(15,23,42,1)_100%)] dark:ring-amber-400/15">
                <h3 className="text-[15px] font-bold text-text-primary">{t('pre_dashboard.tax_title')}</h3>
                <p className="mt-1 text-[13px] leading-normal text-slate-600 dark:text-slate-300">{t('pre_dashboard.tax_desc')}</p>
                <div className="mt-auto pt-2">
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-[12px] font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20">{t('pre_dashboard.tax_chip')}</span>
                </div>
              </Reveal>

              {/* Talk to an Advisor: a slim strip, for when people want a person */}
              <Reveal delay={0.18} className="md:col-span-2 xl:col-span-1">
                <AdvisorCard onMeet={() => setAdvisorModalOpen(true)} />
              </Reveal>
            </div>
          </section>
        </div>
      </div>

      {advisorModalOpen && <AdvisorModal onClose={() => setAdvisorModalOpen(false)} />}
    </AnimatedPage>
  )
}

export default PreEnrollmentDashboard
