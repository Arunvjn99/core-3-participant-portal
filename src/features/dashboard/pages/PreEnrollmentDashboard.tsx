import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ADVISOR } from '@/features/advisors/advisorProfile'
import { AdvisorAvatar } from '@/features/advisors/AdvisorAvatar'
import { AppIcon, ICON_COLOR, IconTile } from '@/design-system/icons'
import { ArrowUp, ChevronRight, GraduationCap, Headset, Lightbulb, Star, Zap } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { useAIStore } from '@/core/store/aiStore'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { EnrollmentPersonalizationModal } from '../components/EnrollmentPersonalizationModal'
import { HeroRideScene } from '../components/HeroRideScene'
import AdvisorModal from '@/features/advisors/AdvisorModal'
import { PLAN_CONFIG } from '@/features/enrollment/agent/planConfig'
import { formatFirstNameForDisplay, getAuthenticatedFirstName } from '@/lib/userDisplayName'
import { useDemoPersona } from '@/features/demo/demoStore'
import { PersonaNotice } from '@/features/demo/PersonaNotice'
import { personaDates } from '@/features/demo/personas'

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

/** Enrich (enrich.org), the financial-learning partner behind the lead card */
const ENRICH_URL = 'https://enrich.org/'

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
    /** On screen with motion allowed, whether or not the pointer is resting on it */
    live: inView && !reduce,
    held,
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

const EXCHANGE_DELAY: Record<ExchangePhase, number> = { arriving: 200, typing: 18, thinking: 380, answering: 32, reading: 1800 }

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

  if (!sent) return null
  return (
    // Earlier exchanges stay above this one and slide up as it grows, like a real chat
    <motion.div layout={reduce ? false : 'position'} transition={{ duration: 0.25, ease }} className="flex flex-col gap-1.5">
      <motion.p
        initial={bubbleIn}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease }}
        className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-3 py-1.5 text-[12px] font-medium leading-snug text-white dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
      >
        {turn.q}
      </motion.p>
      <motion.div
        initial={bubbleIn}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease, delay: reduce ? 0 : 0.12 }}
        className="flex w-[94%] items-start gap-2 self-start rounded-2xl rounded-bl-md bg-slate-100 px-2.5 py-1.5 text-left dark:bg-slate-800"
      >
        <AppIcon name="coreAi" size="inline" className={`mt-px ${ICON_COLOR.active}`} />
        <motion.div
          initial={false}
          animate={{ height: phase === 'thinking' ? 16 : 'auto' }}
          transition={reduce ? { duration: 0 } : { duration: 0.25, ease }}
          className="relative min-w-0 flex-1 overflow-hidden"
        >
          <p className="text-[12px] leading-snug text-slate-700 dark:text-slate-200">
            {words.map((word, i) => (
              <span key={i} className={`transition-opacity duration-200 motion-reduce:transition-none ${i < shown ? 'opacity-100' : 'opacity-0'}`}>
                {word}{i < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
          {phase === 'thinking' && (
            <span className="absolute left-0 top-0 flex h-4 items-center gap-1">
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
    </motion.div>
  )
}

/** Finished exchanges kept above the current one: enough to fill a tall chat window; older ones scroll off the top. */
const HISTORY = 3

function AskCoreAiCard({ turns, onStart }: { turns: ChatTurn[]; onStart: () => void }) {
  const { t } = useTranslation()
  const { ref, live, held, hold } = useCardMotion<HTMLDivElement>()
  // Opens on a conversation already under way, so the window is full from the first look, and the next question starts right away
  const [state, tick] = useReducer((e: Exchange) => nextExchange(e, turns), { turn: HISTORY, phase: 'arriving', count: 0 })
  // Resting the pointer on the card pauses only between answers, never mid-reply, so it can't freeze on the thinking dots
  const running = live && !(held && state.phase === 'reading')

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
        <h3 className="flex items-center gap-2 text-[16px] font-bold text-text-primary">
          <AppIcon name="coreAi" className={ICON_COLOR.active} />
          {t('core_ai.title')}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{t('pre_dashboard.ask_note')}</p>
      </div>

      {/* The chat window stays still; only the conversation inside it changes */}
      <div className="pointer-events-none mt-3 flex min-h-[220px] flex-1 flex-col gap-2.5 rounded-2xl bg-surface-card p-2.5 xl:min-h-0 shadow-[0_12px_28px_-18px_rgba(30,64,175,0.35)] ring-1 ring-blue-100 dark:ring-white/10" aria-hidden>
        {/* Anchored to the bottom like a real chat: new messages push older ones up and out under a soft fade */}
        <div className="relative min-h-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0,black_28px)]">
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5">
            {Array.from({ length: HISTORY }, (_, i) => state.turn - HISTORY + i)
              .filter((n) => n >= 0)
              .map((n) => (
                <ChatMessages key={n} turn={turns[n % turns.length]} state={{ turn: n, phase: 'reading', count: 0 }} running={false} />
              ))}
            <ChatMessages key={state.turn} turn={turn} state={state} running={running} />
          </div>
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
            <AppIcon icon={ArrowUp} size="inline" />
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={`mt-4 inline-flex self-start h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] ${stretchedAction}`}
      >
        {t('core_ai.start_chatting')}
        <AppIcon icon={ChevronRight} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </button>
    </div>
  )
}

// ─── Talk to an Advisor ──────────────────────────────────────────────────────
// The advisor shown before enrollment is the same person the enrolled dashboard shows as "Your Advisor" (ADVISOR)

/** A whole card for the advisor: who she is, three quick tips in her words, and one way to book. */
function AdvisorCard({ cap, onBook }: { cap: number; onBook: () => void }) {
  const { t } = useTranslation()
  const { ref, reduce, running, hold } = useCardMotion<HTMLDivElement>()
  const firstName = ADVISOR.name.split(' ')[0]
  const tips = [t('pre_dashboard.advisor_tip1', { cap }), t('pre_dashboard.advisor_tip2'), t('pre_dashboard.advisor_tip3')]

  return (
    <div ref={ref} {...hold} className="flex h-full flex-col">
      {/* Section title: says what the card is for before showing who */}
      {/* A plain section icon (no tile): tiles are kept for the icons that lead a card */}
      <div className="mb-4 flex items-center gap-2">
        <AppIcon icon={Headset} className={ICON_COLOR.active} />
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{t('pre_dashboard.advisor_heading')}</h3>
      </div>
    <div className="grid flex-1 gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-0 md:divide-x md:divide-slate-200/80 md:dark:divide-white/10">
      {/* Left: the person, and the one action */}
      <div className="flex flex-col items-start md:pr-6">
        <div className="flex items-center gap-3">
          <span className="relative shrink-0">
            <AdvisorAvatar />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white dark:bg-slate-900" aria-hidden>
              {running && !reduce && <motion.span className="absolute h-3.5 w-3.5 rounded-full bg-emerald-400" animate={{ scale: [1, 1.8], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }} />}
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight text-slate-900 dark:text-white">{ADVISOR.name}</p>
            <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300">{t('postDashboard.advisor_title_role')}</p>
            <p className="mt-1 flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400">
              <AppIcon icon={Star} size="inline" className="text-amber-500 dark:text-amber-300" />
              {t('pre_dashboard.advisor_meta', { years: ADVISOR.years, rating: ADVISOR.rating })}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 md:mt-auto md:pt-5">
          <button
            type="button"
            onClick={onBook}
            // Secondary: same white pill as Customize My Plan, so the card doesn't compete with the enrollment buttons
            className={`inline-flex h-10 items-center gap-1 rounded-full bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_-10px_rgba(11,21,51,0.3)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:ring-white/15 dark:hover:bg-slate-800 ${stretchedAction}`}
          >
            {t('pre_dashboard.advisor_book')}
            <AppIcon icon={ChevronRight} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </button>
          <span className="text-[12px] text-slate-500 dark:text-slate-400">{t('pre_dashboard.plan_advisor_line')}</span>
        </div>
      </div>

      {/* Right: her quick tips, straight on the card */}
      <div className="border-t border-slate-200/80 pt-4 dark:border-white/10 md:border-t-0 md:pl-6 md:pt-0">
        <p className="text-[13px] font-bold text-slate-900 dark:text-white">{t('pre_dashboard.advisor_tips_title', { name: firstName })}</p>
        <ul className="mt-3 space-y-2.5">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
              <AppIcon icon={Lightbulb} size="inline" className="mt-px text-amber-500 dark:text-amber-300" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
export function PreEnrollmentDashboard() {
  const { t, i18n } = useTranslation()
  /** Prototype demo: the participant picked, if any */
  const persona = useDemoPersona()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  // `?customize=1` (from the one-click review) opens the Customize My Plan flow straight away
  const [isModalOpen, setIsModalOpen] = useState(() => searchParams.get('customize') === '1')
  const closeCustomize = () => {
    setIsModalOpen(false)
    if (searchParams.has('customize')) setSearchParams({}, { replace: true })
  }
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false)
  /** Bumped to replay the banner story; it plays on its own and loops */
  const [heroRun, setHeroRun] = useState(0)
  const [heroEnded, setHeroEnded] = useState(false)
  const handleHeroEnded = useCallback(() => setHeroEnded(true), [])
  // Rest on the final scene for a moment, then play it again
  useEffect(() => {
    if (!heroEnded || reduce) return
    const id = window.setTimeout(() => {
      setHeroEnded(false)
      setHeroRun((run) => run + 1)
    }, 3000)
    return () => window.clearTimeout(id)
  }, [heroEnded, reduce])
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
    { q: t('pre_dashboard.chat_q4'), a: t('pre_dashboard.chat_a4', { cap }) },
    { q: t('pre_dashboard.chat_q5'), a: t('pre_dashboard.chat_a5') },
  ]

  return (
    <AnimatedPage className="min-h-full">
      <EnrollmentPersonalizationModal
        isOpen={isModalOpen}
        onClose={closeCustomize}
        onComplete={() => navigate('/enrollment/plan')}
        userName={authLoading ? 'there' : heroPillName}
      />

      <div className="bg-surface-page font-sans text-text-primary">
        <div className="w-full flex flex-col gap-10 pb-12 pt-2 lg:gap-8 lg:pb-12 lg:pt-3 xl:gap-6 xl:pb-0 xl:pt-3">
          {/* Banner: one message and one action, beside the story of bills paid and the road ahead */}
          <motion.section
            ref={heroRef}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            aria-labelledby="pre-dashboard-title"
            className="relative isolate flex min-h-[340px] overflow-hidden max-sm:flex-col rounded-[24px] lg:min-h-[280px] xl:min-h-[236px] bg-[radial-gradient(90%_120%_at_0%_0%,#D9F3FF_0%,rgba(217,243,255,0)_60%),radial-gradient(80%_120%_at_100%_100%,#EFFAF2_0%,rgba(239,250,242,0)_50%),linear-gradient(#FFFFFF,#FFFFFF)] ring-1 ring-slate-200/70 lg:items-center dark:bg-[radial-gradient(90%_120%_at_0%_0%,#12305C_0%,rgba(18,48,92,0)_60%),radial-gradient(80%_120%_at_100%_100%,rgba(18,63,70,0.45)_0%,rgba(18,63,70,0)_50%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10"
          >
            {/* The story: under the headline and above the buttons on phones, behind the copy on larger screens */}
            <div className="pointer-events-none absolute inset-x-3 bottom-3 -z-10 h-[170px] max-sm:relative max-sm:inset-auto max-sm:order-2 max-sm:mx-3 max-sm:mt-4 sm:h-[220px] lg:inset-y-3 lg:left-auto lg:right-4 lg:h-auto lg:w-[calc(100%-570px)] xl:pl-[120px]">
              <HeroRideScene key={heroRun} running={heroRunning} onEnded={handleHeroEnded} />
            </div>

            <div className="relative w-full min-w-0 max-sm:contents sm:p-10 sm:pb-[240px] lg:max-w-[560px] lg:py-6 xl:py-5">
              <div className="max-sm:order-1 max-sm:px-5 max-sm:pt-5">
              <p className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                {heroGreetingName ? t(heroGreetingKeys.withName, { name: heroGreetingName }) : t(heroGreetingKeys.generic)}
              </p>
              <h1 id="pre-dashboard-title" className="mt-2 max-w-[560px] text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">
                {t('pre_dashboard.title')}
                {' '}
                <span className="text-primary dark:text-blue-300">{t('pre_dashboard.title_accent')}</span>
              </h1>
              {/* Demo participants who aren't eligible yet, or who opted out, see where they stand */}
              <PersonaNotice persona={persona} className="mt-4 max-w-[560px]" />
              </div>

              <div className="mt-6 flex flex-col gap-3 max-sm:order-3 max-sm:mt-4 max-sm:px-5 max-sm:pb-5 sm:flex-row sm:items-center">
                {/* Primary: one-click enrollment */}
                <button
                  type="button"
                  onClick={() => navigate('/enrollment/quick')}
                  className={`group inline-flex items-center justify-between gap-3 rounded-full bg-primary text-left text-white dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] sm:gap-5 sm:whitespace-nowrap shadow-[0_6px_14px_-8px_rgba(37,99,235,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${bannerFocus} min-h-14 py-2 pl-5 pr-2 sm:pl-6`}
                >
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <AppIcon icon={Zap} />
                    <span>
                      <span className="block text-sm font-semibold leading-tight">
                        {persona?.status === 'not_eligible' ? t('demo.cta_advance') : persona?.status === 'opted_out' ? t('demo.cta_reenroll') : t('hero.one_click')}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-normal leading-tight text-white/90">
                        {persona?.status === 'not_eligible' ? t('demo.cta_advance_time', { date: personaDates(persona, i18n.language).eligible }) : t('hero.one_click_time')}
                      </span>
                    </span>
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary transition-transform group-hover:translate-x-0.5" aria-hidden>
                    <AppIcon icon={ChevronRight} />
                  </span>
                </button>
                {/* Secondary: guided enrollment */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className={`min-h-14 rounded-full bg-white px-5 py-2 text-left text-slate-900 sm:whitespace-nowrap sm:px-6 shadow-[0_2px_6px_-3px_rgba(11,21,51,0.12)] ring-1 ring-slate-200 transition-transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${bannerFocus} dark:bg-slate-900 dark:text-white dark:ring-1 dark:ring-white/15`}
                >
                  <span className="block text-sm font-semibold leading-tight">{t('hero.start_enrollment')}</span>
                  <span className="mt-0.5 block text-[12px] leading-tight text-slate-500 dark:text-slate-400">{t('hero.time_note')}</span>
                </button>
              </div>
            </div>

          </motion.section>

          {/* Why enroll now, ranked: the one-click setup leads, Ask Core AI sits beside it, two quick lessons follow, then an advisor */}
          <section aria-labelledby="pre-dashboard-why">
            <div className="mb-5 xl:mb-4">
              <h2 id="pre-dashboard-why" className="text-[22px] font-bold leading-tight text-text-primary">{t('pre_dashboard.why_title')}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-text-secondary md:whitespace-nowrap">{t('pre_dashboard.why_sub')}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
              {/* Enrich financial learning: the lead card, opens Enrich in a new tab */}
              <Reveal className="group relative isolate flex min-h-[180px] overflow-hidden rounded-[20px] bg-[radial-gradient(90%_130%_at_0%_0%,#CBE7FF_0%,rgba(203,231,255,0)_62%),radial-gradient(70%_130%_at_100%_100%,#C9D0FF_0%,rgba(201,208,255,0)_68%),linear-gradient(#EEF2FF,#EEF2FF)] p-6 text-left shadow-[0_18px_40px_-28px_rgba(37,99,235,0.55)] ring-1 ring-blue-200/80 xl:min-h-[164px] xl:py-5 transition-shadow hover:shadow-[0_24px_48px_-26px_rgba(37,99,235,0.6)] md:col-span-2 xl:col-span-3 dark:bg-[radial-gradient(90%_130%_at_0%_0%,#173F7A_0%,rgba(23,63,122,0)_62%),radial-gradient(70%_130%_at_100%_100%,#3340B0_0%,rgba(51,64,176,0)_68%),linear-gradient(#0F1A48,#0F1A48)] dark:shadow-none dark:ring-blue-400/25">
                {/* The coin art's periwinkle, glowing behind it so the image and card share one light */}
                <span className="pointer-events-none absolute -right-10 top-1/2 -z-10 h-64 w-80 -translate-y-1/2 rounded-full bg-[#8C9BFF] opacity-35 blur-[70px] transition-opacity group-hover:opacity-50 dark:bg-[#5B6BFF] dark:opacity-45" aria-hidden />
                {/* Left: what it is and the way in */}
                <div className="relative z-10 flex flex-1 flex-col items-start justify-center sm:max-w-[70%]">
                  <span className="flex items-center gap-3">
                    <IconTile icon={GraduationCap} />
                    <h3 className="text-[20px] font-bold leading-tight text-[#0B1533] dark:text-white">
                      <a
                        href={ENRICH_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('pre_dashboard.enrich_link_label')}
                        className="after:absolute after:inset-0 after:z-20 after:rounded-[20px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-blue-500"
                      >
                        {t('pre_dashboard.enrich_title')}
                      </a>
                    </h3>
                  </span>
                  {/* Lines up with the title, not the badge, so the text reads as one block */}
                  <p className="mt-0.5 pl-[56px] text-[14px] leading-snug text-slate-700 dark:text-slate-200">{t('pre_dashboard.enrich_desc')}</p>
                  {/* Same button as Start chatting on the Ask Core AI card */}
                  <span className="ml-[56px] mt-5 inline-flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]" aria-hidden>
                    {t('pre_dashboard.enrich_cta')}
                    <AppIcon icon={ChevronRight} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </span>
                </div>

                {/* Right: the coin on the steps, its backdrop removed so it sits straight on the card; the left and the bright top-right corner fade into the card */}
                <img
                  src="/media/enrich-coin-dollar.png"
                  alt=""
                  width={300}
                  height={180}
                  className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[300px] max-w-none object-cover object-[center_8%] transition-transform duration-700 [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_0%,black_30%),radial-gradient(60%_55%_at_100%_0%,transparent_0%,transparent_30%,black_95%)] [-webkit-mask-composite:source-in] group-hover:scale-[1.05] motion-reduce:transition-none sm:block"
                  aria-hidden
                />
              </Reveal>

              {/* Ask Core AI: the second feature, a tall column so the chat is always in view */}
              <Reveal delay={0.06} className="md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1 xl:col-start-4 xl:row-span-2">
                <AskCoreAiCard turns={chatTurns} onStart={openChat} />
              </Reveal>

              {/* Talk to an advisor: a whole card for one person, her quick tips, and one way to book */}
              <Reveal delay={0.08} className="group relative isolate overflow-hidden rounded-[20px] bg-[radial-gradient(55%_110%_at_100%_0%,#FFF6E6_0%,rgba(255,246,230,0)_70%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFD_100%)] p-5 text-left ring-1 ring-slate-200/70 md:col-span-2 xl:col-span-3 dark:bg-[radial-gradient(55%_110%_at_100%_0%,rgba(245,158,11,0.08)_0%,rgba(245,158,11,0)_70%),linear-gradient(180deg,#0E1738_0%,#0B1436_100%)] dark:ring-white/10">
                <AdvisorCard cap={cap} onBook={() => setAdvisorModalOpen(true)} />
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
