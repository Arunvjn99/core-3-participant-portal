import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface StepperStep {
  label: string
  sublabel?: string
}

export interface StepperProps {
  steps: StepperStep[]
  currentStep: number
  highestCompleted: number
  /** Invoked with zero-based step index when a completed step is clicked */
  onStepClick?: (stepIndex: number) => void
}

export function Stepper({ steps, currentStep, highestCompleted, onStepClick }: StepperProps) {
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((step, idx) => {
        const stepNum = idx + 1
        const isCompleted = stepNum <= highestCompleted
        const isActive = stepNum === currentStep
        const isClickable = Boolean(onStepClick && isCompleted)

        return (
          <li key={`${step.label}-${idx}`}>
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(idx)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                isActive && 'bg-primary-subtle',
                isClickable && 'hover:bg-surface-page cursor-pointer',
                !isClickable && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                  isCompleted && 'border-primary bg-primary text-text-inverse',
                  isActive && !isCompleted && 'border-primary bg-surface-card text-primary',
                  !isCompleted && !isActive && 'border-border-default bg-surface-card text-text-muted'
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </span>

              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    'truncate text-sm font-medium',
                    isActive ? 'text-primary' : isCompleted ? 'text-text-primary' : 'text-text-muted'
                  )}
                >
                  {step.label}
                </span>
                {step.sublabel && (
                  <span className="truncate text-xs text-text-muted">{step.sublabel}</span>
                )}
              </span>
            </button>

            {idx < steps.length - 1 && (
              <div className="my-0.5 ml-6 h-3 w-0.5 bg-border-default" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default Stepper
