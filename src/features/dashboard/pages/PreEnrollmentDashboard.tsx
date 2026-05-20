import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion, AnimatePresence, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Sparkles } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { useAIStore } from '@/core/store/aiStore'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { EnrollmentPersonalizationModal } from '../components/EnrollmentPersonalizationModal'
import AdvisorModal from '@/features/advisors/AdvisorModal'
import { formatFirstNameForDisplay, getAuthenticatedFirstName } from '@/lib/userDisplayName'

const HERO_MEETING_VIDEO =
  'https://pmmvggrzowobvbebjzdo.supabase.co/storage/v1/object/public/company-logos/Heromeeting.webm'

type DayPeriod = 'morning' | 'afternoon' | 'evening'

function getLocalDayPeriod(): DayPeriod {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  return 'evening'
}

const HERO_TIME_GREETING_KEYS: Record<
  DayPeriod,
  { generic: string; withName: string }
> = {
  morning: { generic: 'hero.greeting_morning', withName: 'hero.greeting_morning_with_name' },
  afternoon: { generic: 'hero.greeting_afternoon', withName: 'hero.greeting_afternoon_with_name' },
  evening: { generic: 'hero.greeting_evening', withName: 'hero.greeting_evening_with_name' },
}

// ─── Typing hook ────────────────────────────────────────────────────────────
function useTypingEffect(text: string, speed = 45, pause = 2200) {
  const [displayed, setDisplayed] = useState('')
  const [phase, setPhase] = useState<'typing' | 'hold' | 'erasing'>('typing')
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (phase === 'typing') {
      if (displayed.length < text.length) {
        timeout = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed)
      } else {
        timeout = setTimeout(() => setPhase('hold'), pause)
      }
    } else if (phase === 'hold') {
      timeout = setTimeout(() => setPhase('erasing'), 600)
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), speed * 0.6)
      } else {
        timeout = setTimeout(() => setPhase('typing'), 500)
      }
    }
    return () => clearTimeout(timeout)
  }, [displayed, phase, text, speed, pause])
  return { displayed, isTyping: phase === 'typing' }
}

// ─── LearningCard ────────────────────────────────────────────────────────────
function LearningCard({
  t,
  prefersReducedMotion,
  onLearnMore,
}: {
  t: (key: string) => string
  prefersReducedMotion: boolean
  onLearnMore: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const inView = useInView(cardRef, { once: true, margin: '-60px' })

  const items = [t('learning.item1'), t('learning.item2'), t('learning.item3')]

  return (
    <div
      ref={cardRef}
      className="relative min-h-[420px] overflow-hidden rounded-[20px] text-white"
      style={{ background: 'linear-gradient(135deg, #5B8CEF 0%, #3B6FE0 100%)' }}
    >
      {/* Layered shine + noise */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_15%,rgba(255,255,255,0.25),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_80%,rgba(59,111,224,0.4),transparent_55%)]" />

      <div className="relative z-10 flex h-full min-h-[420px] items-stretch gap-4 px-10 py-10">
        {/* ── Left: text column ── */}
        <div className="flex flex-1 flex-col justify-between gap-6">
          {/* Top: badge + heading + subtitle */}
          <div className="flex flex-col gap-4">
            {/* Step badge */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1 backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
                {t('learning.step1')}
              </span>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-2"
            >
              <h2 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight">
                {t('learning.title_line1')}
                <br />
                {t('learning.title_line2')}
              </h2>
              <p className="max-w-sm text-[13.5px] leading-relaxed text-white/75">
                {t('learning.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Middle: checklist items — staggered */}
          <div className="flex flex-col gap-2.5">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.42, delay: 0.22 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2.5"
              >
                <motion.div
                  initial={prefersReducedMotion ? false : { scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.28 + i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
                <span className="text-[13px] font-medium text-white/90">{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Bottom: CTA */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onLearnMore}
              className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25 hover:border-white/50 active:scale-[0.97]"
            >
              {t('hero.learn_plan')}
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        </div>

        {/* ── Right: floating illustration ── */}
        <motion.div
          className="hidden shrink-0 items-end justify-end self-end lg:flex"
          style={{ width: 320, height: 380 }}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src="/learning-journey-illustration.png"
            alt={t('learning.illustration_alt')}
            width={320}
            height={380}
            className="h-full w-full object-contain object-bottom drop-shadow-2xl"
            loading="lazy"
            decoding="async"
            animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Decorative glow orbs */}
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-[60px]" />
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-blue-300/20 blur-[50px]" />
    </div>
  )
}

// ─── BentoCards ─────────────────────────────────────────────────────────────
const ADVISOR_CHIPS = [
  { name: 'Sarah Jenkins', initials: 'SJ', from: '#60a5fa', to: '#3b82f6' },
  { name: 'Alex Carter',   initials: 'AC', from: '#34d399', to: '#059669' },
  { name: 'Maya Patel',    initials: 'MP', from: '#fbbf24', to: '#d97706' },
  { name: 'James Liu',     initials: 'JL', from: '#f472b6', to: '#db2777' },
]

function BentoCards({
  openChat,
  onAdvisorOpen,
  t,
  prefersReducedMotion,
}: {
  openChat: () => void
  onAdvisorOpen: () => void
  t: (key: string) => string
  prefersReducedMotion: boolean
}) {
  const { displayed: typedQuery, isTyping } = useTypingEffect('What is my loan eligibility?', 48, 2400)

  const [aiReplyPhase, setAiReplyPhase] = useState<'skeleton' | 'answer'>('skeleton')
  useEffect(() => {
    const t1 = setTimeout(() => setAiReplyPhase('answer'), 1800)
    const interval = setInterval(() => {
      setAiReplyPhase('skeleton')
      setTimeout(() => setAiReplyPhase('answer'), 1800)
    }, 6800)
    return () => { clearTimeout(t1); clearInterval(interval) }
  }, [])

  const [activeChip, setActiveChip] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setActiveChip(i => (i + 1) % ADVISOR_CHIPS.length), 1800)
    return () => clearInterval(interval)
  }, [])

  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px' })

  const cardVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: (delay: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
    }),
  }

  return (
    <section ref={sectionRef} className="relative z-10 grid gap-5 lg:grid-cols-[1.4fr_1fr]">

      {/* ── Ask Core AI — primary ── */}
      <motion.div
        custom={0}
        variants={prefersReducedMotion ? {} : cardVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        whileHover={prefersReducedMotion ? {} : { y: -4, boxShadow: '0 20px 40px -12px rgba(59,111,224,0.18)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[var(--border-light)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]"
        onClick={openChat}
      >
        {/* Mockup area */}
        <div className="relative flex-1 overflow-hidden bg-[var(--surface-elevated)] px-7 pb-6 pt-7">
          <div
            className="absolute inset-0 opacity-40 dark:opacity-20"
            style={{ backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(59,111,224,0.07),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_70%,rgba(59,130,246,0.1),transparent_60%)]" />

          <div className="relative z-10 flex flex-col gap-3">
            {/* Floating AI header */}
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [0, -3, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 shadow-[var(--shadow-card)]"
            >
              <motion.div
                animate={prefersReducedMotion ? {} : { rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--chart-purple) 100%)' }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">Core AI</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs text-[var(--text-muted)]">{t('core_ai.online')}</span>
              </div>
            </motion.div>

            {/* Chat bubbles */}
            <div className="flex flex-col gap-2.5 px-1">
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="self-end rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium text-white shadow-sm"
                style={{ background: 'var(--color-primary)', minWidth: 180 }}
              >
                <span>{typedQuery}</span>
                <motion.span
                  animate={{ opacity: isTyping ? [1, 0, 1] : 0 }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="ml-0.5 inline-block h-3.5 w-0.5 rounded-full bg-white align-middle"
                />
              </motion.div>

              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="self-start w-fit max-w-[75%] rounded-2xl rounded-bl-sm border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 shadow-[var(--shadow-sm)]"
              >
                <AnimatePresence mode="wait">
                  {aiReplyPhase === 'skeleton' ? (
                    <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-2">
                      {[36, 24].map((w, i) => (
                        <div key={i} className="relative h-2 overflow-hidden rounded-full bg-[var(--border-light)]" style={{ width: `${w * 4}px` }}>
                          <motion.div
                            className="absolute inset-y-0 w-1/2 rounded-full"
                            style={{ background: 'linear-gradient(90deg, transparent, var(--border-strong), transparent)' }}
                            animate={{ x: ['-100%', '250%'] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                          />
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.p key="ans" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.4 }} className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      You may be eligible for up to <strong className="text-[var(--text-primary)]">$15,000</strong> based on your balance.
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Input pill */}
            <div className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2.5 shadow-[var(--shadow-sm)]">
              <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--surface-dark)] px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)]">
                Ask AI
              </span>
              <span className="h-3.5 w-px shrink-0 bg-[var(--border-default)]" />
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: 'linear-gradient(135deg, var(--border-green) 0%, var(--border-blue) 100%)', color: 'var(--status-success-text)' }}
              >
                ✦ Core
              </span>
              <span
                className="min-w-0 flex-1 truncate pr-2 text-[11px] text-[var(--text-muted)]"
                style={{ maskImage: 'linear-gradient(90deg,#000 60%,transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg,#000 60%,transparent 100%)' }}
              >
                {typedQuery}
              </span>
            </div>
          </div>
        </div>

        {/* Text + CTA */}
        <div className="flex flex-col gap-3 border-t border-[var(--border-light)] bg-[var(--surface-card)] p-7">
          <div>
            <h3 className="text-[1.15rem] font-bold leading-tight text-[var(--text-primary)]">{t('core_ai.title')}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">{t('core_ai.description')}</p>
          </div>
          <button
            type="button"
            onClick={openChat}
            className="flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-btn)] transition-all hover:opacity-90 hover:shadow-[var(--shadow-float)] active:scale-[0.97]"
            style={{ background: 'var(--color-primary)' }}
          >
            {t('core_ai.start_chatting')} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>

      {/* ── Talk to an Advisor — secondary, intentionally dark ── */}
      <motion.div
        custom={0.12}
        variants={prefersReducedMotion ? {} : cardVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        whileHover={prefersReducedMotion ? {} : { y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-white/[0.07] shadow-[var(--shadow-card)] dark:border-white/[0.12]"
        style={{ background: 'linear-gradient(160deg,#1e2d4a 0%,#0f172a 100%)' }}
        onClick={onAdvisorOpen}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-16 top-1/4 h-52 w-52 rounded-full blur-[80px]" style={{ background: 'rgba(59,130,246,0.28)' }} />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-40 w-40 rounded-full blur-[70px]" style={{ background: 'rgba(139,92,246,0.20)' }} />

        {/* Illustration — absolute, bottom-right, behind content */}
        <motion.img
          src="https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/1066378_103414-OM6JSZ-221%201.svg"
          alt=""
          aria-hidden
          width={300}
          height={300}
          className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] select-none object-contain object-bottom"
          style={{ filter: 'brightness(0) invert(1)', opacity: 0 }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 0.18, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Bottom-edge fade so illustration blends into card */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f172a] to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-16 bg-gradient-to-l from-[#0f172a]/40 to-transparent" />

        {/* Single-column content */}
        <div className="relative z-10 flex flex-col justify-between p-7" style={{ minHeight: 'inherit' }}>
          {/* Chips */}
          <div className="flex flex-col items-start gap-2.5">
            {ADVISOR_CHIPS.map(({ name, initials, from, to }, i) => {
              const isActive = i === activeChip
              return (
                <motion.div
                  key={name}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                  animate={{
                    opacity: prefersReducedMotion ? 1 : isActive ? 1 : 0.35 + (ADVISOR_CHIPS.length - 1 - i) * 0.15,
                    x: 0,
                    scale: isActive ? 1.04 : 1,
                  }}
                  transition={{
                    opacity: { delay: prefersReducedMotion ? 0 : 0.2 + i * 0.1, duration: 0.45 },
                    x: { delay: prefersReducedMotion ? 0 : 0.2 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                    scale: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                  }}
                  className="inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 backdrop-blur-sm"
                  style={{
                    marginLeft: [0, 18, 32, 10][i],
                    borderColor: isActive ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.09)',
                    background: isActive ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.06)',
                    transition: 'border-color 0.35s, background 0.35s',
                  }}
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg,${from} 0%,${to} 100%)` }}
                  >
                    {initials}
                  </div>
                  <span className="whitespace-nowrap text-[12px] font-medium text-white/90">{name}</span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        key="dot"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>

          {/* Text + CTA */}
          <div className="mt-6">
            <h3 className="text-[1.15rem] font-bold leading-tight text-white">{t('advisor.title')}</h3>
            <p className="mt-1 mb-5 text-[12.5px] leading-relaxed text-white/55">
              {t('advisor.subtitle')}
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAdvisorOpen() }}
              className="group inline-flex items-center gap-1 text-[13px] font-semibold text-white/70 transition-colors hover:text-white"
            >
              {t('advisor.meet_expert')}
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────────────────────
export function PreEnrollmentDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false)
  const { openChat } = useAIStore()
  const { user, loading: authLoading } = useAuth()
  const { profile } = useUser()
  const learningRef = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = useReducedMotion()

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
  const heroGreetingName =
    !authLoading && heroPillName !== 'there' ? heroPillName : null
  const dayPeriod = getLocalDayPeriod()
  const heroGreetingKeys = HERO_TIME_GREETING_KEYS[dayPeriod]

  return (
    <AnimatedPage className="min-h-full">
      <EnrollmentPersonalizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => navigate('/enrollment/plan')}
        userName={authLoading ? 'there' : heroPillName}
      />

      <div className="relative min-h-screen overflow-hidden bg-white font-sans transition-colors dark:bg-gray-950">
        <div className="absolute inset-0 -z-20 bg-white dark:bg-gray-950" />

        <div
          className="absolute bottom-[-10%] left-1/2 -z-10 h-[50%] w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,var(--accent-blue-tint)_0%,var(--accent-blue-tint)_50%,transparent_100%)] opacity-50 blur-[120px] dark:bg-[radial-gradient(ellipse_at_center,var(--gradient-dark-start)_0%,var(--gradient-dark-end)_50%,transparent_100%)]"
        />

        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--chart-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--chart-grid)_1px,transparent_1px)] bg-[length:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_20%,transparent_100%)] opacity-20 dark:bg-[linear-gradient(to_right,var(--chart-grid-muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--chart-grid-muted)_1px,transparent_1px)]"
        />

        <div className="mx-auto flex max-w-6xl flex-col gap-32 px-6 pb-20 pt-8">
          {/* Hero */}
          <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              <div className="inline-flex w-fit max-w-full items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-slate-600 dark:bg-slate-900">
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-blue)] dark:bg-blue-400"
                  aria-hidden
                />
                <span className="text-sm font-semibold text-[var(--accent-blue)] dark:text-blue-400">
                  {heroGreetingName
                    ? t(heroGreetingKeys.withName, { name: heroGreetingName })
                    : t(heroGreetingKeys.generic)}
                </span>
              </div>

              <h1 className="max-w-xl text-4xl font-bold leading-[1.15] tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[2.5rem] lg:text-[2.75rem]">
                {t('hero.title_line1')} <br />
                <span className="brand-text">{t('hero.title_line2')}</span>{t('hero.title_line3')}
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[1.0625rem]">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="btn-brand inline-flex !min-h-0 flex-col items-center justify-center gap-0 rounded-full !bg-[var(--color-primary)] px-[28px] py-3 shadow-lg transition-all hover:scale-[1.02] hover:!bg-[var(--color-primary-hover)] active:scale-[0.98]"
                >
                  <span className="text-center text-[15px] font-semibold leading-tight text-white">
                    {t('hero.start_enrollment')}
                  </span>
                  <span className="mt-[2px] text-center text-[11px] font-normal leading-tight tracking-[0.01em] text-white">
                    {t('hero.time_note')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => learningRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex shrink-0 items-center justify-center self-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-all hover:scale-[1.02] hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50 sm:px-6 sm:py-3.5 sm:text-[0.9375rem]"
                >
                  {t('hero.learn_plan')}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex w-full flex-col items-start gap-8"
            >
              <div className="relative flex aspect-[4/3] w-full max-w-[min(100%,720px)] items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-gray-950 lg:-translate-x-3 xl:-translate-x-6 2xl:max-w-[min(100%,800px)]">
                <video
                  width={800}
                  height={600}
                  className="h-full w-full max-h-full scale-[1.35] -translate-x-[8%] object-contain object-center transition-transform duration-300"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label={t('hero.video_aria')}
                >
                  <source src={HERO_MEETING_VIDEO} type="video/webm" />
                </video>
              </div>
            </motion.div>
          </section>

          {/* Learning Hub */}
          <section ref={learningRef} className="relative z-10">
            <LearningCard
              t={t}
              prefersReducedMotion={!!prefersReducedMotion}
              onLearnMore={() => navigate('/enrollment/plan')}
            />
          </section>

          {/* Core AI (primary) + Advisor (secondary) */}
          <BentoCards openChat={openChat} onAdvisorOpen={() => setAdvisorModalOpen(true)} t={t} prefersReducedMotion={!!prefersReducedMotion} />

        </div>
      </div>

      {advisorModalOpen && (
        <AdvisorModal onClose={() => setAdvisorModalOpen(false)} />
      )}
    </AnimatedPage>
  )
}

export default PreEnrollmentDashboard
