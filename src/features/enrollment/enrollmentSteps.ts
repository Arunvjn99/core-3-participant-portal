export interface EnrollmentStep {
  step: number
  key: string
  path: string
}

export const ENROLLMENT_STEPS: EnrollmentStep[] = [
  { step: 1, key: 'plan', path: 'plan' },
  { step: 2, key: 'contribution', path: 'contribution' },
  { step: 3, key: 'source', path: 'contribution-source' },
  { step: 4, key: 'autoIncrease', path: 'auto-increase' },
  { step: 5, key: 'investment', path: 'investment' },
  { step: 6, key: 'readiness', path: 'readiness' },
  { step: 7, key: 'review', path: 'review' },
  { step: 8, key: 'success', path: 'success' },
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
