import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
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
import type { TFunction } from 'i18next'

function getTimeGreeting(t: TFunction): string {
  const hour = new Date().getHours()
  if (hour < 12) return t('greeting.morning')
  if (hour < 17) return t('greeting.afternoon')
  return t('greeting.evening')
}

export function PreEnrollmentDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false)
  const { openChat } = useAIStore()
  const { user } = useAuth()
  const { profile } = useUser()
  const learningRef = useRef<HTMLElement | null>(null)

  const firstNameRaw = getAuthenticatedFirstName(profile, user)
  const displayFirstName = formatFirstNameForDisplay(firstNameRaw)

  return (
    <AnimatedPage className="min-h-full">
      <EnrollmentPersonalizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => navigate('/enrollment/plan')}
        userName={displayFirstName}
      />

      <div className="relative min-h-screen overflow-hidden bg-white font-sans transition-colors dark:bg-gray-950">
        <div className="absolute inset-0 -z-20 bg-white dark:bg-gray-950" />

        <div
          className="absolute bottom-[-10%] left-1/2 -z-10 h-[50%] w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,#DCE8FF_0%,#EAF2FF_50%,transparent_100%)] opacity-50 blur-[120px] dark:bg-[radial-gradient(ellipse_at_center,#1e3a5f_0%,#0f1f3a_50%,transparent_100%)]"
        />

        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[length:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_20%,transparent_100%)] opacity-20 dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.15)_1px,transparent_1px)]"
        />

        <main className="mx-auto flex max-w-6xl flex-col gap-32 px-6 pb-20 pt-8">
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
                  className="h-2 w-2 shrink-0 rounded-full bg-[#2b59c3] dark:bg-blue-400"
                  aria-hidden
                />
                <span className="text-sm font-semibold text-[#2b59c3] dark:text-blue-400">
                  {displayFirstName !== 'there'
                    ? `${getTimeGreeting(t)}, ${displayFirstName}!`
                    : `${getTimeGreeting(t)}!`}
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
                  className="btn-brand flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-8 sm:py-3.5 sm:text-[0.9375rem]"
                >
                  {t('hero.start_enrollment')}
                </button>
                <button
                  type="button"
                  onClick={() => learningRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-xl border border-slate-200 px-7 py-3 text-sm font-semibold text-slate-600 transition-all hover:scale-[1.02] hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50 sm:px-8 sm:py-3.5 sm:text-[0.9375rem]"
                >
                  {t('hero.learn_plan')}
                </button>
              </div>

              <div className="flex items-center gap-3 text-sm font-semibold text-slate-400 dark:text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {t('hero.time_note')}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center gap-8 lg:items-end"
            >
              <div className="relative w-full max-w-[500px]">
                <img
                  src="/hero-enrollment-illustration.png"
                  alt="Illustration of retirement plan onboarding with character and floating UI cards"
                  width={500}
                  height={700}
                  className="mx-auto block h-auto w-full max-h-[min(700px,85vh)] object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </motion.div>
          </section>

          {/* Learning */}
          <section ref={learningRef} className="relative z-10">
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-[#2F6BFF] to-[#6FA8FF] text-white shadow-2xl shadow-blue-200/50 dark:shadow-blue-900/30">
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

                <div className="flex justify-center lg:justify-end lg:self-end">
                  <img
                    src="/learning-card-illustration.png"
                    alt="Student with school supplies learning about your plan"
                    width={380}
                    height={420}
                    className="h-auto w-full max-w-[min(100%,380px)] object-contain object-bottom"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
              <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue-400/20 blur-[60px]" />
            </div>
          </section>

          {/* Bento */}
          <section className="relative z-10 grid gap-8 md:grid-cols-2">
            {/* Contact Advisor Card */}
            <motion.div
              whileHover={{ y: -8 }}
              className="relative cursor-pointer overflow-hidden rounded-[32px] shadow-2xl transition-all"
              style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
              onClick={() => setAdvisorModalOpen(true)}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              />
              <div className="relative flex min-h-[280px] flex-col justify-between p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 mb-6">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-white">{t('advisor.title')}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-white/60">
                    {t('advisor.subtitle')}
                  </p>
                  <div className="group flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white">
                    <span>{t('advisor.browse')}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="flex flex-col overflow-hidden rounded-[32px] border border-white/5 bg-[#0a0a0a] shadow-2xl transition-all"
            >
              <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-white/5 bg-[#0d0d0d]">
                <div
                  className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[length:24px_24px]"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_70%)]" />

                <div className="relative z-10 flex w-full flex-col items-center gap-8 px-16">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex h-14 w-full items-center gap-4 rounded-full border border-white/10 bg-white/5 px-5 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="h-2.5 w-40 rounded-full bg-white/20" />
                  </motion.div>

                  <div className="flex w-full max-w-[280px] flex-col gap-3">
                    {[1, 0.6, 0.3].map((opacity, i) => (
                      <div
                        key={i}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/5"
                        style={{
                          opacity,
                          transform: `scale(${1 - i * 0.05}) translateY(${i * 4}px)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-8">
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-white">{t('core_ai.title')}</h3>
                  <p className="text-base font-medium leading-relaxed text-slate-400">
                    {t('core_ai.description')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openChat}
                  className="flex w-fit items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white"
                >
                  {t('core_ai.start_chatting')} <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </section>
        </main>
      </div>

      {advisorModalOpen && (
        <AdvisorModal onClose={() => setAdvisorModalOpen(false)} />
      )}
    </AnimatedPage>
  )
}

export default PreEnrollmentDashboard
