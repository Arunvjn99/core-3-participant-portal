import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { ENROLLMENT_STEPS, getStepByPath } from '../enrollmentSteps'
import AppFooter from '@/features/dashboard/components/AppFooter'

/** Steps shown in the progress UI (excludes success / confirmation-only step). */
const STEPPER_STEPS = ENROLLMENT_STEPS.filter((s) => s.step <= 7)

export function EnrollmentShell() {
  const navigate = useNavigate()
  const location = useLocation()

  const pathSegment = location.pathname.split('/').filter(Boolean).pop() ?? 'plan'
  const fromUrl = getStepByPath(pathSegment)?.step
  const activeStepFromPath =
    [...ENROLLMENT_STEPS]
      .sort((a, b) => b.path.length - a.path.length)
      .find((s) => location.pathname.endsWith(`/${s.path}`))?.step ?? fromUrl ?? 1
  const activeStep = activeStepFromPath

  const showStepper = !location.pathname.includes('/enrollment/success')

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa] dark:bg-gray-950">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 dark:text-gray-500">Enrollment</span>
          {activeStep <= STEPPER_STEPS.length && (
            <>
              <span className="text-sm text-gray-300 dark:text-gray-600">/</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {STEPPER_STEPS[activeStep - 1]?.label}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Save &amp; Exit
        </button>
      </div>

      {showStepper && (
        <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="hidden px-4 py-3 md:block sm:px-6">
            <div className="mx-auto max-w-5xl">
              <p className="mb-2.5 text-xs text-gray-400 dark:text-gray-500">
                Step {activeStep} of {STEPPER_STEPS.length}
              </p>
              <div className="flex items-start gap-1">
                {STEPPER_STEPS.map((step, i) => {
                  const stepNum = i + 1
                  const isCompleted = stepNum < activeStep
                  const isCurrent = stepNum === activeStep
                  return (
                    <div key={step.label} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex w-full items-center gap-0.5">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                            isCompleted
                              ? 'bg-blue-600 text-white'
                              : isCurrent
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                                : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            stepNum
                          )}
                        </div>
                        {i < STEPPER_STEPS.length - 1 && (
                          <div
                            className={`mx-1 h-0.5 flex-1 rounded-full transition-colors ${
                              isCompleted ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-center text-xs leading-tight transition-colors ${
                          isCurrent
                            ? 'font-semibold text-blue-600 dark:text-blue-400'
                            : isCompleted
                              ? 'text-gray-600 dark:text-gray-400'
                              : 'text-gray-400 dark:text-gray-600'
                        }`}
                        style={{ fontSize: '0.68rem' }}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 md:hidden">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {activeStep}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                    {STEPPER_STEPS[activeStep - 1]?.label ?? ''}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.7rem' }}>
                    Step {activeStep} of {STEPPER_STEPS.length}
                  </p>
                </div>
              </div>
              {activeStep < STEPPER_STEPS.length && (
                <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.72rem' }}>
                  Next: {STEPPER_STEPS[activeStep]?.label}
                </p>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(activeStep / STEPPER_STEPS.length) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-1">
              {STEPPER_STEPS.map((_, i) => {
                const sn = i + 1
                return (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      sn < activeStep
                        ? 'flex-1 bg-blue-600'
                        : sn === activeStep
                          ? 'flex-[2] bg-blue-600'
                          : 'flex-1 bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <AnimatedPage>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </AnimatedPage>
      </div>

      <AppFooter />
    </div>
  )
}

export default EnrollmentShell
