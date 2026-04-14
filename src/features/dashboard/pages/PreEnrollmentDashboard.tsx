import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { useAIStore } from '@/core/store/aiStore'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { EnrollmentPersonalizationModal } from '../components/EnrollmentPersonalizationModal'
import AdvisorModal from '@/features/advisors/AdvisorModal'

export function PreEnrollmentDashboard() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false)
  const { openChat } = useAIStore()
  const { user } = useAuth()
  const { profile } = useUser()
  const learningRef = useRef<HTMLElement | null>(null)

  const firstName = profile?.full_name?.trim()
    ? profile.full_name.split(/\s+/)[0]
    : profile?.email
      ? profile.email.split('@')[0]
      : user?.email
        ? user.email.split('@')[0]
        : 'there'

  return (
    <AnimatedPage className="min-h-full">
      <EnrollmentPersonalizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => navigate('/enrollment/plan')}
        userName={firstName}
      />

      <div className="relative min-h-screen overflow-hidden bg-white font-sans transition-colors dark:bg-gray-950">
        <div className="absolute inset-0 -z-20 bg-white dark:bg-gray-950" />

        <div
          className="absolute bottom-[-10%] left-1/2 -z-10 h-[50%] w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,#DCE8FF_0%,#EAF2FF_50%,transparent_100%)] opacity-50 blur-[120px] dark:bg-[radial-gradient(ellipse_at_center,#1e3a5f_0%,#0f1f3a_50%,transparent_100%)]"
        />

        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[length:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_20%,transparent_100%)] opacity-20 dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.15)_1px,transparent_1px)]"
        />

        <main className="mx-auto flex max-w-6xl flex-col gap-32 px-6 pb-20 pt-24">
          {/* Hero */}
          <section className="grid items-center gap-20 lg:grid-cols-[1.1fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-8"
            >
              <h1 className="text-6xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-900 dark:text-white md:text-7xl">
                Let&apos;s build your <br />
                <span className="brand-text">future</span>, together.
              </h1>

              <p className="max-w-lg text-xl font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                You&apos;re one step away from activating your 401(k). We&apos;ve simplified everything so you can
                focus on what matters.
              </p>

              <div className="flex flex-wrap items-center gap-5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="btn-brand flex items-center gap-2.5 rounded-2xl px-10 py-4 text-base font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start my enrollment →
                </button>
                <button
                  type="button"
                  onClick={() => learningRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-2xl border border-slate-200 px-10 py-4 font-bold text-slate-600 transition-all hover:scale-[1.02] hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
                >
                  Learn about the plan
                </button>
              </div>

              <div className="flex items-center gap-3 text-sm font-semibold text-slate-400 dark:text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                It only takes 5 minutes
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center gap-8 lg:items-end"
            >
              <div className="relative flex aspect-[4/3] w-full max-w-md items-center justify-center overflow-hidden rounded-3xl">
                <div className="relative flex h-full w-full items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-10 top-20 flex h-64 w-48 flex-col gap-3 rounded-2xl border-2 border-slate-900 bg-white p-4 dark:border-slate-600 dark:bg-slate-800"
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700" />
                    <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-700" />
                    <div className="h-2 w-2/3 rounded bg-slate-100 dark:bg-slate-700" />
                    <div className="mt-auto flex h-24 w-full items-end gap-1 rounded-xl border border-slate-100 p-2 dark:border-slate-600">
                      <div className="h-1/2 w-full rounded-sm bg-slate-100 dark:bg-slate-700" />
                      <div className="h-3/4 w-full rounded-sm bg-slate-100 dark:bg-slate-700" />
                      <div className="h-full w-full rounded-sm bg-slate-900 dark:bg-slate-200" />
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute bottom-10 right-10 flex h-72 w-56 flex-col gap-4 rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-2xl shadow-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="brand-bg h-10 w-10 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <div className="h-2 w-20 rounded bg-slate-900 dark:bg-slate-200" />
                        <div className="h-1.5 w-12 rounded bg-slate-200 dark:bg-slate-500" />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-700" />
                      <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-700" />
                      <div className="h-2 w-3/4 rounded bg-slate-100 dark:bg-slate-700" />
                    </div>
                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Growth</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">+24%</div>
                      </div>
                      <TrendingUp className="brand-text h-8 w-8" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Learning */}
          <section ref={learningRef} className="relative z-10">
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-[#2F6BFF] to-[#6FA8FF] p-8 text-white shadow-2xl shadow-blue-200/50 md:p-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_50%)]" />

              <div className="relative z-10 flex max-w-3xl flex-col items-start gap-8">
                <div className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/20 px-4 py-1.5 backdrop-blur-md">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white">Step 1</span>
                </div>

                <div className="flex flex-col gap-3">
                  <h2 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-4xl">
                    Learn how your <br />
                    retirement plan works
                  </h2>
                  <p className="max-w-md text-base font-medium leading-relaxed text-blue-50/80">
                    Understand contributions, employer match, and how your savings grow over time.
                  </p>
                </div>

                <div className="flex flex-col gap-6 pt-4 sm:flex-row">
                  {[
                    'What is a 401(k) and how it works',
                    'How much you should contribute',
                    'How employer matching impacts your savings',
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

              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
              <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue-400/20 blur-[60px]" />
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
                  <h3 className="mb-2 text-2xl font-bold text-white">Talk to an Advisor</h3>
                  <p className="mb-6 text-sm leading-relaxed text-white/60">
                    Get personalized guidance from a certified retirement planner. Book a free 30-minute session.
                  </p>
                  <div className="group flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white">
                    <span>Browse Advisors</span>
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
                  <h3 className="text-2xl font-bold tracking-tight text-white">Ask Core AI</h3>
                  <p className="text-base font-medium leading-relaxed text-slate-400">
                    Get instant answers and personalized retirement guidance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openChat}
                  className="flex w-fit items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white"
                >
                  Start chatting <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </section>
        </main>

        <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-10 border-t border-slate-200 px-6 py-20 dark:border-slate-800 md:flex-row md:items-center">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <div className="flex items-center gap-2.5 opacity-40 grayscale">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100">
                <div className="h-3.5 w-3.5 rotate-45 rounded-sm bg-white dark:bg-slate-900" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Participant Portal</span>
            </div>
            <p className="text-[13px] font-medium text-slate-400 dark:text-slate-600">
              © 2026 Congruent Solutions Inc. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-10 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
            <a href="#" className="transition-colors hover:text-slate-900 dark:hover:text-slate-300">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-slate-600 dark:hover:text-slate-400">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-slate-600 dark:hover:text-slate-400">
              Help Center
            </a>
          </div>
        </footer>
      </div>

      {advisorModalOpen && (
        <AdvisorModal onClose={() => setAdvisorModalOpen(false)} />
      )}
    </AnimatedPage>
  )
}

export default PreEnrollmentDashboard
