import { useState, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ChevronRight, Sparkles, UserCheck } from 'lucide-react'
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

          {/* Learning */}
          <section ref={learningRef} className="relative z-10">
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-[var(--gradient-blue-start)] to-[var(--gradient-blue-end)] text-white shadow-2xl shadow-[var(--gradient-blue-start)]/35 dark:shadow-blue-900/40">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_50%)]" />

              <div className="relative z-10 grid items-center gap-8 p-8 md:gap-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(220px,380px)] lg:gap-12">
                <div className="flex max-w-3xl flex-col items-start gap-6 md:gap-8">
                  <div className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/20 px-4 py-1.5 backdrop-blur-md">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white">{t('learning.step1')}</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-bold leading-[1.15] tracking-tight sm:text-3xl md:text-[2rem]">
                      {t('learning.title_line1')} <br />
                      {t('learning.title_line2')}
                    </h2>
                    <p className="max-w-md text-sm leading-relaxed text-blue-50/90 sm:text-base">
                      {t('learning.subtitle')}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
                    {[
                      t('learning.item1'),
                      t('learning.item2'),
                      t('learning.item3'),
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white/90">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.div
                  className="flex justify-center lg:justify-end lg:self-end"
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.75,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <motion.img
                    src="/learning-journey-illustration.png"
                    alt={t('learning.illustration_alt')}
                    width={380}
                    height={380}
                    className="h-auto w-full max-w-[min(100%,380px)] object-contain object-bottom"
                    loading="lazy"
                    decoding="async"
                    animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 4.8,
                      repeat: prefersReducedMotion ? 0 : Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </motion.div>
              </div>

              <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
              <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[var(--accent-blue-tint)]/25 blur-[60px]" />
            </div>
          </section>

          {/* Bento */}
          <section className="relative z-10 grid gap-8 md:grid-cols-2">
            {/* Contact Advisor Card */}
            <motion.div
              whileHover={{ y: -8 }}
              className="relative cursor-pointer overflow-hidden rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 shadow-xl shadow-slate-200/60 transition-all hover:border-slate-300 hover:shadow-2xl dark:border-slate-700 dark:from-slate-900 dark:to-slate-950 dark:shadow-none dark:hover:border-slate-600"
              onClick={() => setAdvisorModalOpen(true)}
            >
              <div className="relative flex min-h-[280px] flex-col justify-between p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-blue)]/10 dark:bg-blue-500/15">
                  <UserCheck className="h-6 w-6 text-[var(--accent-blue)] dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">{t('advisor.title')}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t('advisor.subtitle')}
                  </p>
                  <div className="group flex items-center gap-2 text-sm font-medium text-[var(--accent-blue)] transition-colors hover:text-[var(--accent-blue-hover)] dark:text-blue-400 dark:hover:text-blue-300">
                    <span>{t('advisor.browse')}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="flex flex-col overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60 transition-all hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-slate-600"
            >
              <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-slate-100 bg-gradient-to-b from-slate-100 to-slate-50 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                <div className="absolute inset-0 bg-[radial-gradient(var(--chart-grid)_1px,transparent_1px)] bg-[length:24px_24px] opacity-60 dark:bg-[radial-gradient(var(--chart-grid-muted)_1px,transparent_1px)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-blue-tint),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,var(--accent-blue-tint),transparent_70%)]" />

                <div className="relative z-10 flex w-full flex-col items-center gap-8 px-16">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex h-14 w-full items-center gap-4 rounded-full border border-slate-200/90 bg-white/90 px-5 shadow-lg shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-purple-500 shadow-md">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="h-2.5 w-40 rounded-full bg-slate-200 dark:bg-white/20" />
                  </motion.div>

                  <div className="flex w-full max-w-[280px] flex-col gap-3">
                    {[1, 0.6, 0.3].map((opacity, i) => (
                      <div
                        key={i}
                        className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5"
                        style={{
                          opacity,
                          transform: `scale(${1 - i * 0.05}) translateY(${i * 4}px)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-slate-50/50 p-8 dark:bg-slate-950/50">
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('core_ai.title')}</h3>
                  <p className="text-base font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                    {t('core_ai.description')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openChat}
                  className="flex w-fit items-center gap-2 text-sm font-bold text-[var(--accent-blue)] transition-colors hover:text-[var(--accent-blue-hover)] dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('core_ai.start_chatting')} <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </section>
        </div>
      </div>

      {advisorModalOpen && (
        <AdvisorModal onClose={() => setAdvisorModalOpen(false)} />
      )}
    </AnimatedPage>
  )
}

export default PreEnrollmentDashboard
