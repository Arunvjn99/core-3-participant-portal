import { useCallback, useEffect, useState } from 'react'
import { checkEligibility, getPlanRules, ServiceError, type EligibilityResult } from './enrollmentService'
import type { PlanConfig } from './planConfig'

export const PREP_STEPS = ['eligibility', 'rules', 'match', 'funds', 'projection'] as const
export type PrepStep = (typeof PREP_STEPS)[number]
export type StepStatus = 'pending' | 'running' | 'done' | 'error'

export interface PreparationState {
  status: 'idle' | 'running' | 'ready' | 'ineligible' | 'error'
  steps: Record<PrepStep, StepStatus>
  eligibility?: EligibilityResult
  rules?: PlanConfig
  error?: ServiceError['code']
}

const fresh = (): PreparationState => ({
  status: 'idle',
  steps: { eligibility: 'pending', rules: 'pending', match: 'pending', funds: 'pending', projection: 'pending' },
})

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * The agent's preparation before it proposes a plan: check eligibility, load the plan's rules, then work out the
 * match, funds and projection. Runs when `enabled` turns true; `retry` re-runs it after an error.
 */
export function usePreparation(age: number, enabled: boolean, quick: boolean) {
  const [state, setState] = useState<PreparationState>(fresh)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const set = (patch: (s: PreparationState) => PreparationState) => {
      if (!cancelled) setState(patch)
    }
    const step = (k: PrepStep, v: StepStatus) => set((s) => ({ ...s, steps: { ...s.steps, [k]: v } }))

    void (async () => {
      set(() => ({ ...fresh(), status: 'running' }))
      try {
        step('eligibility', 'running')
        const eligibility = await checkEligibility(age)
        set((s) => ({ ...s, eligibility }))
        if (!eligibility.eligible) {
          step('eligibility', 'error')
          set((s) => ({ ...s, status: 'ineligible' }))
          return
        }
        step('eligibility', 'done')

        step('rules', 'running')
        const rules = await getPlanRules(run)
        set((s) => ({ ...s, rules }))
        step('rules', 'done')

        // The remaining work is calculated locally from the rules; the pauses let each check be read
        for (const k of ['match', 'funds', 'projection'] as const) {
          step(k, 'running')
          await pause(quick ? 0 : 380)
          step(k, 'done')
        }
        set((s) => ({ ...s, status: 'ready' }))
      } catch (e) {
        const code = e instanceof ServiceError ? e.code : 'rules_unavailable'
        set((s) => {
          const running = (Object.keys(s.steps) as PrepStep[]).find((k) => s.steps[k] === 'running')
          return { ...s, status: 'error', error: code, steps: running ? { ...s.steps, [running]: 'error' } : s.steps }
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, run, age, quick])

  const retry = useCallback(() => setRun((r) => r + 1), [])
  return { prep: state, retry }
}
