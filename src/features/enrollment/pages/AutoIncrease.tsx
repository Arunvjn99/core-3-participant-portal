import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { ArrowRight, TrendingUp, Minus, AlertTriangle, X } from 'lucide-react'

export default function AutoIncrease() {
  const navigate = useNavigate()
  const { data, updateData } = useEnrollment()
  const [showSkipModal, setShowSkipModal] = useState(false)

  const fixedProjection = 124621
  const autoProjection = 185943
  const difference = autoProjection - fixedProjection

  const handleSelect = (autoIncrease: boolean) => {
    updateData({ autoIncrease })
    if (autoIncrease) {
      navigate('/enrollment/auto-increase-setup')
    } else {
      setShowSkipModal(true)
    }
  }

  const handleConfirmSkip = () => {
    updateData({ autoIncrease: false })
    useEnrollmentDraftStore.getState().advanceStep({ enabled: false, amount: 0, max: 15 }, 'autoIncrease')
    setShowSkipModal(false)
    navigate('/enrollment/investment')
  }

  const handleEnableFromModal = () => {
    setShowSkipModal(false)
    updateData({ autoIncrease: true })
    navigate('/enrollment/auto-increase-setup')
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-gray-900 dark:text-white">Increase your savings automatically</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>
            Small increases today can grow your retirement savings over time.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Fixed */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Minus className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-gray-900 dark:text-white">Keep Contributions Fixed</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.85rem' }}>
              Your contribution stays at {data.contributionPercent}% throughout.
            </p>
            <div className="mt-4 flex-1">
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.75rem' }}>
                Projected in 10 years
              </p>
              <p className="text-gray-900 dark:text-white" style={{ fontSize: '2rem', fontWeight: 700 }}>
                ${fixedProjection.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelect(false)}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Skip Auto Increase
            </button>
          </div>

          {/* Auto Increase - Recommended */}
          <div className="relative flex flex-col rounded-2xl border-2 border-green-500 bg-white p-5 shadow-sm dark:bg-gray-900">
            <span
              className="absolute -top-3 left-4 rounded-full bg-green-600 px-3 py-0.5 text-white"
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              Recommended
            </span>
            <div className="mb-3 mt-1 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-gray-900 dark:text-white">Enable Auto Increase</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.85rem' }}>
              Increase by 1% each year up to 15%.
            </p>
            <div className="mt-4 flex-1">
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.75rem' }}>
                Projected in 10 years
              </p>
              <p className="text-green-700 dark:text-green-400" style={{ fontSize: '2rem', fontWeight: 700 }}>
                ${autoProjection.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelect(true)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-white transition-all hover:bg-green-700 active:scale-[0.98]"
            >
              Enable Auto Increase <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Impact Banner */}
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center dark:border-green-900/40 dark:bg-green-950/30">
          <p className="text-green-800 dark:text-green-400" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            Automatic increases could add <span style={{ fontWeight: 700 }}>+${difference.toLocaleString()}</span> over 10 years.
          </p>
        </div>
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSkipModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setShowSkipModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-1 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-gray-900 dark:text-white" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Skip automatic increases?
              </h2>
            </div>
            <p className="mb-5 mt-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.85rem' }}>
              Automatic increases help grow your retirement savings gradually without requiring large changes today.
            </p>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              {/* Without Auto Increase — shown first so the "With" option on the right looks better */}
              <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-75 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="mb-2 flex items-center gap-1.5">
                  <Minus className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Without Auto Increase
                  </span>
                </div>
                <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Est. savings in 10 years
                </p>
                <p className="mt-0.5 text-gray-500 dark:text-gray-400" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  ${fixedProjection.toLocaleString()}
                </p>
              </div>

              {/* With Auto Increase — recommended, on the right */}
              <div className="relative flex flex-col rounded-xl border-2 border-green-500 bg-white p-4 dark:bg-gray-800">
                <span
                  className="absolute -top-2.5 left-3 rounded-full bg-green-600 px-2.5 py-0.5 text-white"
                  style={{ fontSize: '0.68rem', fontWeight: 600 }}
                >
                  Recommended
                </span>
                <div className="mb-2 mt-1 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-gray-900 dark:text-white" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    With Auto Increase
                  </span>
                </div>
                <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Est. savings in 10 years
                </p>
                <p className="mt-0.5 text-green-700 dark:text-green-400" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  ${autoProjection.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-green-100 bg-green-50 p-3 text-center dark:border-green-900/40 dark:bg-green-950/30">
              <p className="text-green-800 dark:text-green-400" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                Auto increase could add approximately <span style={{ fontWeight: 700 }}>${difference.toLocaleString()}</span> to your savings.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={handleEnableFromModal}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-white transition-all hover:bg-green-700 active:scale-[0.98]"
                style={{ fontSize: '0.9rem', fontWeight: 500 }}
              >
                Enable Auto Increase <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                style={{ fontSize: '0.9rem', fontWeight: 500 }}
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedPage>
  )
}
