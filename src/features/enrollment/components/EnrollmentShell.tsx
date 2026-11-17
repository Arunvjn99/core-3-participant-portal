import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check } from 'lucide-react'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { ENROLLMENT_STEPS, getStepByPath } from '../enrollmentSteps'
import AppFooter from '@/features/dashboard/components/AppFooter'
import { EnrollmentStepNavProvider } from './EnrollmentStepNavContext'
import { ROUTES } from '@/lib/constants'

/** Steps shown in the progress UI (excludes success / confirmation-only step). */
const STEPPER_STEPS = ENROLLMENT_STEPS.filter((s) => s.step <= 7)

/**
 * Progress through the enrollment steps. Wide screens: a row of step chips joined by a progress line, where finished
 * steps can be clicked to go back. Phones: a progress ring with the current step and the next one.
 */
function EnrollmentStepper({ activeStep, onGoTo }: { activeStep: number; onGoTo: (path: string) => void }) {
  const { t } = useTranslation()
  const total = STEPPER_STEPS.length
  const label = (i: number) => (STEPPER_STEPS[i] ? t(`enrollment.steps.${STEPPER_STEPS[i].key}.label`) : '')
  const stepOf = t('flows.step_of', { current: activeStep, total })
  // Ring for phones: circumference of r=18
  const ring = 2 * Math.PI * 18
  // Green share of the ring = finished steps, matching the green checks on wider screens
  const done = Math.max(0, Math.min(activeStep - 1, total)) / total

  return (
    <nav aria-label={stepOf} className="border-b border-slate-200/80 bg-surface-card dark:border-white/10">
      {/* Wide screens */}
      <div className="mx-auto hidden max-w-[1040px] items-center gap-4 px-4 py-3.5 sm:px-6 md:flex">
        <ol className="flex flex-1 items-center">
          {STEPPER_STEPS.map((step, i) => {
            const n = i + 1
            const isDone = n < activeStep
            const isCurrent = n === activeStep
            // Numbers and checks only; the step name lives in the tooltip and screen-reader label
            const chip = isDone ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <span aria-hidden>{n}</span>
            const chipClass = `flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-300 motion-reduce:transition-none ${
              isCurrent
                ? 'h-9 w-9 bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_18px_-8px_rgba(11,21,51,0.55)] ring-4 ring-blue-500/15 dark:ring-blue-400/25'
                : isDone
                  ? 'h-8 w-8 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25 dark:hover:bg-emerald-500/25'
                  : 'h-8 w-8 bg-white text-slate-400 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-500 dark:ring-white/10'
            }`
            // Line after this step: pale green between finished steps, pale green into blue leading to the current one
            const nextIsCurrent = n + 1 === activeStep
            const line = isDone
              ? nextIsCurrent
                ? 'bg-gradient-to-r from-emerald-200 to-[var(--color-primary)] dark:from-emerald-400/30'
                : 'bg-emerald-200 dark:bg-emerald-400/30'
              : 'bg-slate-200 dark:bg-white/10'
            return (
              <li key={step.key} className={`flex items-center ${i < total - 1 ? 'flex-1' : ''}`} aria-current={isCurrent ? 'step' : undefined}>
                {isDone ? (
                  <button type="button" onClick={() => onGoTo(step.path)} className={chipClass} title={label(i)} aria-label={`${label(i)}: ${t('enrollment.shell.step_done')}`}>
                    {chip}
                  </button>
                ) : (
                  <span className={chipClass} title={label(i)} aria-label={label(i)}>
                    {chip}
                  </span>
                )}
                {i < total - 1 && <span className={`mx-2 h-1 min-w-3 flex-1 rounded-full transition-colors duration-300 ${line}`} aria-hidden />}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Phones */}
      <div className="flex items-center gap-3 px-4 py-2.5 md:hidden">
        <span className="relative h-11 w-11 shrink-0" aria-hidden>
          <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" className="stroke-slate-200 dark:stroke-white/10" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className="stroke-emerald-400 transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - done)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#0B1533] dark:text-white">
            {activeStep}/{total}
          </span>
        </span>
        <p className="text-sm font-semibold text-[#0B1533] dark:text-white">{stepOf}</p>
      </div>
    </nav>
  )
}

export function EnrollmentShell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const pathSegment = location.pathname.split('/').filter(Boolean).pop() ?? 'plan'
  const fromUrl = getStepByPath(pathSegment)?.step
  const activeStepFromPath =
    [...ENROLLMENT_STEPS]
      .sort((a, b) => b.path.length - a.path.length)
      .find((s) => location.pathname.endsWith(`/${s.path}`))?.step ?? fromUrl ?? 1
  const activeStep = activeStepFromPath

  const showStepper =
    !location.pathname.includes('/enrollment/success') && !location.pathname.includes('/enrollment/quick')

  // The one-click agent uses a soft light-grey page so its white cards and blue accents stand out gently
  const isQuick = location.pathname.includes('/enrollment/quick')

  return (
    <div className={`flex flex-col ${isQuick ? 'h-dvh overflow-hidden bg-[#f5f6f8] dark:bg-gray-950' : 'min-h-screen bg-surface-page'}`}>
      {/* The one-click page has its own header with steps, Start over and Save & exit */}
      {!isQuick && (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-surface-card px-4 dark:border-white/10 sm:px-6">
          <div className="flex items-center gap-3">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-[#0B1533] dark:text-slate-300 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('enrollment.shell.back')}</span>
              </button>
            )}
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('enrollment.shell.title')}</span>
            {activeStep <= STEPPER_STEPS.length && (
              <>
                <span className="text-sm text-slate-300 dark:text-slate-600">/</span>
                <span className="text-sm font-bold text-[#0B1533] dark:text-white">
                  {STEPPER_STEPS[activeStep - 1] ? t(`enrollment.steps.${STEPPER_STEPS[activeStep - 1].key}.label`) : ''}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PRE_ENROLLMENT_DASHBOARD)}
            className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_-10px_rgba(11,21,51,0.3)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:ring-white/15 dark:hover:bg-slate-800"
          >
            {t('enrollment.shell.save_exit')}
          </button>
        </div>
      )}

      {showStepper && (
        <EnrollmentStepper activeStep={activeStep} onGoTo={(path) => navigate(`/enrollment/${path}`)} />
      )}

      {/* The footer sits at the end of the page, below the fold: it scrolls into view rather than staying on screen */}
      <div className={`flex min-h-0 flex-1 flex-col ${isQuick ? 'overflow-y-auto overscroll-contain' : ''}`} data-quick-scroll={isQuick || undefined}>
        <AnimatedPage className={isQuick ? 'flex flex-1 shrink-0 flex-col' : 'flex min-h-[calc(100dvh-3.5rem)] shrink-0 flex-col'}>
          <EnrollmentStepNavProvider>
            <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-6 sm:px-6 lg:py-7">
              <Outlet />
            </main>
          </EnrollmentStepNavProvider>
        </AnimatedPage>
        {/* One-click: the page grows to fill a tall window, so the footer keeps its own height at the bottom; on a long page it follows with a small gap */}
        <div className={isQuick ? 'mt-4 shrink-0' : 'shrink-0'}>
          <AppFooter />
        </div>
      </div>
    </div>
  )
}

export default EnrollmentShell
