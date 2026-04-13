import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { ArrowRight, TrendingUp, Minus, AlertTriangle } from 'lucide-react'

export default function AutoIncreaseSkip() {
  const navigate = useNavigate()
  const { updateData } = useEnrollment()

  const withAutoProjection = 185943
  const withoutAutoProjection = 124621
  const difference = withAutoProjection - withoutAutoProjection

  const handleEnable = () => {
    updateData({ autoIncrease: true })
    navigate('/enrollment/auto-increase-setup')
  }

  const handleSkip = () => {
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
      <div className="space-y-6">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <h1 className="text-gray-900 dark:text-white">Skip automatic increases?</h1>
          </div>
          <p className="mt-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>
            Automatic increases help grow your retirement savings gradually over time without requiring large changes today.
          </p>
          <p className="mt-2 text-gray-400 dark:text-gray-500" style={{ fontSize: '0.82rem' }}>
            Automatic increases usually align with salary raises, so your take-home pay typically remains comfortable.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* With Auto Increase */}
          <div className="relative flex flex-col rounded-2xl border-2 border-green-500 bg-white p-5 shadow-sm dark:bg-gray-900">
            <span className="absolute -top-3 left-4 rounded-full bg-green-600 px-3 py-0.5 text-white" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Recommended
            </span>
            <div className="mb-3 mt-1 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-gray-900 dark:text-white">With Auto Increase</h3>
            </div>
            <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Estimated savings in 10 years
            </p>
            <p className="mt-1 text-green-700 dark:text-green-400" style={{ fontSize: '2rem', fontWeight: 700 }}>
              ${withAutoProjection.toLocaleString()}
            </p>
          </div>

          {/* Without Auto Increase */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-5 opacity-75 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Minus className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400">Without Auto Increase</h3>
            </div>
            <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Estimated savings in 10 years
            </p>
            <p className="mt-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '2rem', fontWeight: 700 }}>
              ${withoutAutoProjection.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center dark:border-green-900/40 dark:bg-green-950/30">
          <p className="text-green-800 dark:text-green-400" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            Automatic increases could add approximately <span style={{ fontWeight: 700 }}>${difference.toLocaleString()}</span> to your savings.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleEnable}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.98]"
          >
            Enable Auto Increase <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3.5 text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </AnimatedPage>
  )
}
