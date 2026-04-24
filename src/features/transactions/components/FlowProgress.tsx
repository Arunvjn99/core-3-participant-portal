import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface Step {
  number: number
  label: string
  path: string
}

interface FlowProgressProps {
  steps: Step[]
  currentStep: number
}

function FlowProgress({ steps, currentStep }: FlowProgressProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full py-4 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="sm:hidden">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-slate-900 dark:text-white" style={{ fontSize: 12, fontWeight: 700 }}>
              {t('flows.step_of', { current: currentStep, total: steps.length })}
            </span>
            <span className="text-slate-500 dark:text-gray-400" style={{ fontSize: 12, fontWeight: 500 }}>
              {steps[currentStep - 1]?.label}
            </span>
          </div>
          <div className="overflow-hidden rounded-[3px] bg-slate-200 dark:bg-gray-700" style={{ height: 6 }}>
            <motion.div
              className="brand-progress h-full"
              style={{ borderRadius: 3 }}
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between px-0.5">
            {steps.map((step) => {
              const isComplete = step.number < currentStep
              const isCurrent = step.number === currentStep
              return (
                <div
                  key={step.number}
                  className={`rounded-full transition-all duration-200 ${
                    isComplete || isCurrent ? 'brand-bg' : 'bg-slate-200 dark:bg-gray-600'
                  }`}
                  style={{
                    width: 8,
                    height: 8,
                    boxShadow: isCurrent ? '0 0 0 3px var(--brand-primary-ring)' : undefined,
                  }}
                />
              )
            })}
          </div>
        </div>

        <div className="relative hidden sm:block">
          <div className="absolute left-0 right-0 top-5 bg-slate-200 dark:bg-gray-700" style={{ height: 2 }}>
            <motion.div
              className="brand-progress h-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <div className="relative flex justify-between">
            {steps.map((step) => {
              const isComplete = step.number < currentStep
              const isCurrent = step.number === currentStep

              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={`relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isComplete
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isCurrent
                          ? 'brand-border brand-bg text-white'
                          : 'border-slate-200 bg-white text-slate-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-500'
                    }`}
                    style={{ width: 40, height: 40 }}
                  >
                    {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : <span style={{ fontSize: 13, fontWeight: 700 }}>{step.number}</span>}
                  </div>
                  <span
                    className={`mt-2 max-w-[5.5rem] text-center text-[11px] font-semibold leading-tight sm:max-w-[7rem] sm:text-xs ${
                      isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlowProgress
