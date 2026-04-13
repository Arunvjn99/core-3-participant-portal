import { useCallback, useMemo } from 'react'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useUser } from '@/core/hooks/useUser'

export interface EnrollmentFormData {
  plan: 'traditional' | 'roth' | null
  contributionPercent: number
  contributionSources: { preTax: number; roth: number; afterTax: number }
  autoIncrease: boolean
  autoIncreaseAmount: number
  autoIncreaseMax: number
  riskLevel: 'conservative' | 'balanced' | 'growth' | 'aggressive'
  useRecommendedPortfolio: boolean
  agreedToTerms: boolean
  salary: number
  companyPlans: ('traditional' | 'roth')[]
  supportsAfterTax: boolean
}

export interface PersonalizationView {
  retirementAge: number
  currentAge: number
  retirementLocation: string
  currentSavings: number
  investmentComfort: string
  wizardCompleted: boolean
}

export function useEnrollment() {
  const store = useEnrollmentDraftStore()
  const { enrollmentStatus } = useUser()

  const personalization = useMemo<PersonalizationView>(() => {
    const d = store.draftData
    return {
      retirementAge: d?.personalization?.retirementAge ?? 65,
      currentAge: d?.personalization?.currentAge ?? 35,
      retirementLocation: d?.personalization?.selectedLocation ?? '',
      currentSavings: d?.personalization?.savingsAmount ?? 0,
      investmentComfort: 'balanced',
      wizardCompleted: true,
    }
  }, [store.draftData])

  const data = useMemo<EnrollmentFormData>(() => {
    const d = store.draftData
    return {
      plan: (d?.plan?.type ?? null) as 'traditional' | 'roth' | null,
      contributionPercent: d?.contribution?.percent ?? d?.contribution?.rate ?? 6,
      contributionSources: {
        preTax: d?.source?.preTax ?? 100,
        roth: d?.source?.roth ?? 0,
        afterTax: d?.source?.afterTax ?? 0,
      },
      autoIncrease: d?.autoIncrease?.enabled ?? false,
      autoIncreaseAmount: d?.autoIncrease?.amount ?? 1,
      autoIncreaseMax: d?.autoIncrease?.max ?? 15,
      riskLevel: (d?.investment?.riskLevel ?? 'balanced') as EnrollmentFormData['riskLevel'],
      useRecommendedPortfolio: d?.investment?.useRecommended ?? true,
      agreedToTerms: d?.review?.agreed ?? false,
      salary: d?.savings?.salary ?? d?.personalization?.salary ?? 85000,
      companyPlans: ['traditional', 'roth'] as ('traditional' | 'roth')[],
      supportsAfterTax: true,
    }
  }, [store.draftData])

  const updateData = useCallback((updates: Partial<EnrollmentFormData>) => {
    const { mergeDraftSection, draftData } = useEnrollmentDraftStore.getState()

    if (updates.agreedToTerms !== undefined) {
      mergeDraftSection('review', { agreed: updates.agreedToTerms })
      return
    }

    if (updates.plan !== undefined) {
      const t = updates.plan
      mergeDraftSection('plan', {
        type: t ?? undefined,
        planId: t ?? undefined,
        planName:
          t === 'traditional' ? 'Traditional 401(k)' : t === 'roth' ? 'Roth 401(k)' : undefined,
      })
    }
    if (updates.contributionPercent !== undefined) {
      const current = draftData.contribution ?? {}
      mergeDraftSection('contribution', {
        ...current,
        percent: updates.contributionPercent,
        rate: updates.contributionPercent,
        type: 'percentage' as const,
      })
    }
    if (updates.contributionSources !== undefined) {
      const cs = updates.contributionSources
      mergeDraftSection('source', {
        preTax: cs.preTax,
        roth: cs.roth,
        afterTax: cs.afterTax,
      })
    }
    if (
      updates.autoIncrease !== undefined ||
      updates.autoIncreaseAmount !== undefined ||
      updates.autoIncreaseMax !== undefined
    ) {
      const current = draftData.autoIncrease ?? { enabled: false }
      mergeDraftSection('autoIncrease', {
        ...current,
        enabled: updates.autoIncrease ?? current.enabled,
        amount: updates.autoIncreaseAmount ?? current.amount ?? 1,
        max: updates.autoIncreaseMax ?? current.max ?? 15,
      })
    }
    if (updates.riskLevel !== undefined || updates.useRecommendedPortfolio !== undefined) {
      const current = draftData.investment ?? {}
      mergeDraftSection('investment', {
        ...current,
        riskLevel: updates.riskLevel ?? current.riskLevel ?? 'balanced',
        useRecommended: updates.useRecommendedPortfolio ?? current.useRecommended ?? true,
      })
    }
    if (updates.salary !== undefined) {
      mergeDraftSection('savings', { salary: updates.salary })
      mergeDraftSection('personalization', {
        ...(draftData.personalization ?? {}),
        salary: updates.salary,
      })
    }
  }, [])

  return {
    data,
    updateData,
    personalization,
    updatePersonalization: () => {
      /* personalization saved via modal → mergeDraftSection */
    },
    currentStep: store.currentStep,
    setCurrentStep: store.setCurrentStep,
    draftData: store.draftData,
    highestCompletedStep: store.highestCompletedStep,
    advanceStep: store.advanceStep,
    mergeDraftSection: store.mergeDraftSection,
    goToStep: store.goToStep,
    resetEnrollment: store.resetEnrollment,
    isEnrolled: enrollmentStatus === 'complete',
    isInProgress: enrollmentStatus === 'in_progress',
    canAccessStep: (step: number) => step <= store.highestCompletedStep + 1,
  }
}
