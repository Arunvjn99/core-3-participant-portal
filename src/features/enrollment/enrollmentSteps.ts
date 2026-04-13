export interface EnrollmentStep {
  step: number
  key: string
  path: string
  label: string
  sublabel: string
}

export const ENROLLMENT_STEPS: EnrollmentStep[] = [
  { step: 1, key: 'plan',         path: 'plan',          label: 'Plan',           sublabel: 'Choose your plan' },
  { step: 2, key: 'contribution', path: 'contribution',  label: 'Contribution',   sublabel: 'Set your amount' },
  { step: 3, key: 'source',       path: 'contribution-source', label: 'Source',   sublabel: 'Pre or post-tax' },
  { step: 4, key: 'autoIncrease', path: 'auto-increase', label: 'Auto Increase',  sublabel: 'Grow over time' },
  { step: 5, key: 'investment',   path: 'investment',    label: 'Investment',     sublabel: 'Fund allocation' },
  { step: 6, key: 'readiness',    path: 'readiness',     label: 'Readiness',      sublabel: 'Retirement score' },
  { step: 7, key: 'review',       path: 'review',        label: 'Review',         sublabel: 'Confirm choices' },
  { step: 8, key: 'success',      path: 'success',       label: 'Done',           sublabel: 'Enrolled!' },
]

export const TOTAL_STEPS = ENROLLMENT_STEPS.length

export function getStepByPath(path: string): EnrollmentStep | undefined {
  if (path === 'auto-increase-setup' || path === 'auto-increase-skip') {
    return ENROLLMENT_STEPS.find((s) => s.step === 4)
  }
  return ENROLLMENT_STEPS.find((s) => s.path === path)
}

export function getStepByKey(key: string): EnrollmentStep | undefined {
  return ENROLLMENT_STEPS.find((s) => s.key === key)
}
