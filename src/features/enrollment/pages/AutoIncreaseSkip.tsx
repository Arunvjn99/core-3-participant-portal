import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { AutoIncreaseSkipPanel } from '@/features/enrollment/components/AutoIncreaseSkipPanel'

export default function AutoIncreaseSkip() {
  const navigate = useNavigate()
  const { updateData } = useEnrollment()

  const fixedProjection = 124621
  const autoProjection = 185943
  const difference = autoProjection - fixedProjection

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
      <div className="mx-auto max-w-lg rounded-[28px] border border-slate-200/90 bg-white p-6 text-left shadow-lg sm:p-8 dark:border-gray-700 dark:bg-gray-900">
        <AutoIncreaseSkipPanel
          projectedWithout={fixedProjection}
          projectedWith={autoProjection}
          missedSavingsAmount={difference}
          onReconsider={handleReconsider}
          onContinueWithout={handleContinueWithout}
        />
      </div>
    </AnimatedPage>
  )
}
