import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { AutoIncreaseSkipPanel } from '@/features/enrollment/components/AutoIncreaseSkipPanel'

export default function AutoIncreaseSkip() {
  const navigate = useNavigate()
  const { data, updateData } = useEnrollment()

  const difference = 185943 - 124621

  const planDisplayName =
    data.plan === 'roth' ? 'Roth 401(k)' : data.plan === 'traditional' ? 'Traditional 401(k)' : '401(k)'

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
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <AutoIncreaseSkipPanel
          planDisplayName={planDisplayName}
          contributionPercent={data.contributionPercent}
          missedSavingsAmount={difference}
          onReconsider={handleReconsider}
          onContinueWithout={handleContinueWithout}
        />
      </div>
    </AnimatedPage>
  )
}
