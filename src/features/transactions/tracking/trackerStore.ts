import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PayoutMethod, TrackedType } from './stages'
import type { TrackedTransaction } from './timeline'

const HOUR = 3_600_000

interface TrackerState {
  items: TrackedTransaction[]
  seeded: boolean
  track: (input: {
    type: TrackedType
    amount?: number
    description: string
    method?: PayoutMethod
  }) => string
  /** Populate sample in-flight requests once, so the tracker is not empty in demo mode. */
  seedDemo: () => void
}

function demoItems(now: number): TrackedTransaction[] {
  return [
    { id: 'demo-loan', type: 'loan', amount: 5000, description: 'General purpose loan', method: 'check', submittedAt: now - 4 * 24 * HOUR },
    { id: 'demo-withdrawal', type: 'withdrawal', amount: 2500, description: 'Hardship withdrawal', method: 'eft', submittedAt: now - 5 * HOUR },
    { id: 'demo-rollover', type: 'rollover', amount: 18500, description: 'Rollover from previous employer', submittedAt: now - 3 * 24 * HOUR },
  ]
}

export const useTransactionTracker = create<TrackerState>()(
  persist(
    (set, get) => ({
      items: [],
      seeded: false,
      track: (input) => {
        const id = `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
        set((s) => ({ items: [{ id, submittedAt: Date.now(), ...input }, ...s.items] }))
        return id
      },
      seedDemo: () => {
        if (get().seeded) return
        set((s) => ({ items: [...s.items, ...demoItems(Date.now())], seeded: true }))
      },
    }),
    { name: 'transaction_tracker', storage: createJSONStorage(() => localStorage) },
  ),
)
