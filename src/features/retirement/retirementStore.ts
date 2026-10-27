import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface RetirementGoalState {
  location: string
  retirementAge: number
  monthlySpending: number
  outsideSavings: number
  save: (v: { location: string; retirementAge: number; monthlySpending: number; outsideSavings: number }) => void
}

export const useRetirementGoal = create<RetirementGoalState>()(
  persist(
    (set) => ({
      location: 'Washington',
      retirementAge: 67,
      monthlySpending: 5_400,
      outsideSavings: 56_000,
      save: (v) => set(v),
    }),
    { name: 'retirement_goal', storage: createJSONStorage(() => localStorage) },
  ),
)
