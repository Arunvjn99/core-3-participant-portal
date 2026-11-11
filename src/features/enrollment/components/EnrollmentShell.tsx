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
  const done = Math.min(activeStep, total) / total

  return (
    <nav aria-label={stepOf} className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Wide screens */}
      <div className="mx-auto hidden max-w-5xl px-4 py-3 sm:px-6 md:block">
        <ol className="flex items-center">
          {STEPPER_STEPS.map((step, i) => {
            const n = i + 1
            const isDone = n < activeStep
            const isCurrent = n === activeStep
            // Numbers and checks only; the step name lives in the tooltip and screen-reader label
            const chip = isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : <span aria-hidden>{n}</span>
            const chipClass = `flex shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              isCurrent
                ? 'h-8 w-8 bg-primary text-white shadow-[0_0_0_4px_rgba(37,99,235,0.15),0_6px_16px_-8px_rgba(37,99,235,0.7)] dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] dark:shadow-[0_0_0_4px_rgba(96,165,250,0.18)]'
                : isDone
                  ? 'h-7 w-7 bg-primary text-white hover:opacity-90 dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]'
                  : 'h-7 w-7 text-gray-400 ring-1 ring-inset ring-gray-300 dark:text-gray-500 dark:ring-gray-600'
            }`
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
                {i < total - 1 && (
                  <span
                    className={`mx-1.5 h-0.5 min-w-3 flex-1 rounded-full ${isDone ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                    aria-hidden
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Phones */}
      <div className="flex items-center gap-3 px-4 py-2.5 md:hidden">
        <span className="relative h-11 w-11 shrink-0" aria-hidden>
          <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" className="stroke-gray-200 dark:stroke-gray-700" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className="stroke-primary transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - done)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-900 dark:text-white">
            {activeStep}/{total}
          </span>
        </span>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{stepOf}</p>
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
    <div className={`flex flex-col dark:bg-gray-950 ${isQuick ? 'h-dvh overflow-hidden bg-[#f5f6f8]' : 'min-h-screen bg-[var(--surface-shell)]'}`}>
      {/* The one-click page has its own header with steps, Start over and Save & exit */}
      {!isQuick && (
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 sm:px-6">
          <div className="flex items-center gap-3">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('enrollment.shell.back')}</span>
              </button>
            )}
            <span className="text-sm text-gray-400 dark:text-gray-500">{t('enrollment.shell.title')}</span>
            {activeStep <= STEPPER_STEPS.length && (
              <>
                <span className="text-sm text-gray-300 dark:text-gray-600">/</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {STEPPER_STEPS[activeStep - 1] ? t(`enrollment.steps.${STEPPER_STEPS[activeStep - 1].key}.label`) : ''}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PRE_ENROLLMENT_DASHBOARD)}
            className="brand-text text-sm font-medium transition-colors hover:opacity-80"
          >
            {t('enrollment.shell.save_exit')}
          </button>
        </div>
      )}

      {showStepper && (
        <EnrollmentStepper activeStep={activeStep} onGoTo={(path) => navigate(`/enrollment/${path}`)} />
      )}

      {/* One-click keeps the footer pinned in view: the page scrolls above it */}
      <div className={`flex min-h-0 flex-1 flex-col ${isQuick ? 'overflow-y-auto overscroll-contain' : ''}`} data-quick-scroll={isQuick || undefined}>
        <AnimatedPage>
          <EnrollmentStepNavProvider>
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
              <Outlet />
            </main>
          </EnrollmentStepNavProvider>
        </AnimatedPage>
      </div>

      <div className="shrink-0">
        <AppFooter />
      </div>
    </div>
  )
}

export default EnrollmentShell
