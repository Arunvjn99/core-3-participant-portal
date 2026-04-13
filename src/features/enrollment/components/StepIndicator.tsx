import { Check } from 'lucide-react'
import { cn } from '../../../lib/cn'

export interface Step {
  label: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep

        return (
          <div key={step.label} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors',
                  isCompleted && 'bg-primary border-primary text-text-inverse',
                  isActive && 'bg-surface-card border-primary text-primary',
                  !isCompleted && !isActive && 'bg-surface-card border-border-default text-text-muted'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-primary' : isCompleted ? 'text-text-secondary' : 'text-text-muted'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-16 mx-2 mb-5 transition-colors',
                  index < currentStep ? 'bg-primary' : 'bg-border-default'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default StepIndicator
