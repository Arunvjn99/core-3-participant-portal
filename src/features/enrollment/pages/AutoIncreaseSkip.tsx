import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { AutoIncreaseSkipPanel } from '@/features/enrollment/components/AutoIncreaseSkipPanel'
import { compareAutoIncrease } from '@/features/enrollment/enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'

export default function AutoIncreaseSkip() {
  const navigate = useNavigate()
  const { data, updateData, personalization } = useEnrollment()

  const { difference: missedSavingsAmount } = compareAutoIncrease(
    {
      startingBalance: personalization.currentSavings,
      salary: data.salary,
      ratePercent: data.contributionPercent,
      sources: data.contributionSources,
      years: 10,
      growthRate: getGrowthRate(data.riskLevel),
    },
    { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax },
  )

  const handleReconsider = () => {
    updateData({ autoIncrease: true })
    navigate('/enrollment/auto-increase-setup')
  }

  const handleContinueWithout = () => {
    updateData({ autoIncrease: false })
    useEnrollmentDraftStore.getState().advanceStep(
      {
        enabled: false,
        amount: 0,
        max: 15,
      },
      'autoIncrease'
    )
    navigate('/enrollment/investment')
  }

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-lg rounded-[24px] bg-surface-card p-6 text-left shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 sm:p-8 dark:ring-white/10">
        <AutoIncreaseSkipPanel
          missedSavingsAmount={missedSavingsAmount}
          onReconsider={handleReconsider}
          onContinueWithout={handleContinueWithout}
        />
      </div>
    </AnimatedPage>
  )
}
