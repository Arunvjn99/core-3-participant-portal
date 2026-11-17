import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface RetirementGoalState {
  location: string
  retirementAge: number
  monthlySpending: number
  outsideSavings: number
  /** When the participant last saved their retirement goal; null until they have. One-click enrollees start here. */
  checkedAt: number | null
  save: (v: { location: string; retirementAge: number; monthlySpending: number; outsideSavings: number }) => void
}

export const useRetirementGoal = create<RetirementGoalState>()(
  persist(
    (set) => ({
      location: 'Washington',
      retirementAge: 67,
      monthlySpending: 5_400,
      outsideSavings: 56_000,
      checkedAt: null,
      save: (v) => set({ ...v, checkedAt: Date.now() }),
    }),
    { name: 'retirement_goal', storage: createJSONStorage(() => localStorage) },
  ),
)
