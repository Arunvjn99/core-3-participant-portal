import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── Draft data shapes ────────────────────────────────────────────────────────

/** Dashboard modal → enrollment bridge */
export interface PersonalizationDraftData {
  retirementAge?: number
  currentAge?: number
  birthYear?: number
  birthMonth?: string
  birthDay?: number
  selectedLocation?: string
  savingsAmount?: number
  salary?: number
  riskTolerance?: 'conservative' | 'balanced' | 'growth' | 'aggressive'
}

export interface PlanDraftData {
  planId?: string
  planName?: string
  type?: 'traditional' | 'roth'
}

export interface ContributionDraftData {
  /** legacy */
  rate?: number
  percent?: number
  type?: 'percentage' | 'fixed'
}

export interface SourceDraftData {
  source?: 'pretax' | 'roth' | 'split'
  splitRatio?: { pretax: number; roth: number }
  preTax?: number
  roth?: number
  afterTax?: number
}

export interface AutoIncreaseDraftData {
  enabled: boolean
  increasePercent?: number
  amount?: number
  max?: number
}

export interface InvestmentDraftData {
  strategyId?: string
  strategyName?: string
  riskLevel?: 'conservative' | 'balanced' | 'growth' | 'aggressive'
  useRecommended?: boolean
  customAllocation?: Record<string, number>
}

export interface ReadinessDraftData {
  score: number
  acknowledgedAt: number
}

export interface ReviewDraftData {
  confirmedAt: number
  agreed?: boolean
}

export interface SavingsDraftData {
  salary?: number
}

export interface EnrollmentDraftData {
  personalization?: PersonalizationDraftData
  plan?: PlanDraftData
  contribution?: ContributionDraftData
  source?: SourceDraftData
  autoIncrease?: AutoIncreaseDraftData
  investment?: InvestmentDraftData
  readiness?: ReadinessDraftData
  review?: ReviewDraftData
  savings?: SavingsDraftData
}

// ─── Store ──────────────────────────────────────────────────────────────────────

export type EnrollmentStatus = 'none' | 'in_progress' | 'complete'

export interface EnrollmentDraftStore {
  currentStep: number
  highestCompletedStep: number
  draftData: EnrollmentDraftData
  enrollmentStatus: EnrollmentStatus

  setCurrentStep: (step: number) => void
  setEnrollmentStatus: (status: EnrollmentStatus) => void
  advanceStep: (stepData: Record<string, unknown>, stepKey: string) => void
  mergeDraftSection: (stepKey: keyof EnrollmentDraftData, partial: Record<string, unknown>) => void
  goToStep: (step: number) => void
  resetEnrollment: () => void
}

const initialState = {
  currentStep: 1,
  highestCompletedStep: 0,
  draftData: {} as EnrollmentDraftData,
  enrollmentStatus: 'none' as EnrollmentStatus,
}

const DRAFT_KEYS = new Set<keyof EnrollmentDraftData>([
  'personalization',
  'plan',
  'contribution',
  'source',
  'autoIncrease',
  'investment',
  'readiness',
  'review',
  'savings',
])

export const useEnrollmentDraftStore = create<EnrollmentDraftStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      setEnrollmentStatus: (status) => set({ enrollmentStatus: status }),

      mergeDraftSection: (stepKey, partial) => {
        if (!DRAFT_KEYS.has(stepKey)) return
        set((state) => {
          const prev = (state.draftData[stepKey] as Record<string, unknown> | undefined) ?? {}
          return {
            draftData: {
              ...state.draftData,
              [stepKey]: { ...prev, ...partial },
            },
          }
        })
      },

      advanceStep: (stepData, stepKey) => {
        const key = stepKey as keyof EnrollmentDraftData
        if (!DRAFT_KEYS.has(key)) return
        set((state) => ({
          currentStep: state.currentStep + 1,
          highestCompletedStep: Math.max(state.highestCompletedStep, state.currentStep),
          draftData: {
            ...state.draftData,
            [key]: stepData as unknown as EnrollmentDraftData[typeof key],
          },
        }))
      },

      goToStep: (step) => {
        const { highestCompletedStep } = get()
        if (step <= highestCompletedStep + 1) {
          set({ currentStep: step })
        }
      },

      resetEnrollment: () => set(initialState),
    }),
    {
      name: 'enrollment_draft',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        highestCompletedStep: state.highestCompletedStep,
        draftData: state.draftData,
        enrollmentStatus: state.enrollmentStatus,
      }),
    }
  )
)
