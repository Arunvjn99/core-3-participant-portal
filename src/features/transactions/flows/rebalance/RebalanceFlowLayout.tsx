import { Outlet, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FlowProgress from '../../components/FlowProgress'

interface Fund {
  name: string
  ticker: string
  currentAllocation: number
  targetAllocation: number
  currentValue: number
}

interface RebalanceData {
  funds?: Fund[]
}

interface RebalanceFlowContextType {
  rebalanceData: RebalanceData
  updateRebalanceData: (data: Partial<RebalanceData>) => void
}

const RebalanceFlowContext = createContext<RebalanceFlowContextType | undefined>(undefined)

export function useRebalanceFlow() {
  const context = useContext(RebalanceFlowContext)
  if (!context) {
    return { rebalanceData: {} as RebalanceData, updateRebalanceData: (_data: Partial<RebalanceData>) => {} }
  }
  return context
}

const REBALANCE_STEP_DEFS = [
  { number: 1, path: '/transactions/rebalance', stepKey: 'current' },
  { number: 2, path: '/transactions/rebalance/adjust', stepKey: 'target' },
  { number: 3, path: '/transactions/rebalance/trades', stepKey: 'trades' },
  { number: 4, path: '/transactions/rebalance/review', stepKey: 'review' },
] as const

function RebalanceFlowLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const [rebalanceData, setRebalanceData] = useState<RebalanceData>({})

  const progressSteps = useMemo(
    () => REBALANCE_STEP_DEFS.map((s) => ({ number: s.number, path: s.path, label: t(`flows.steps.${s.stepKey}`) })),
    [t],
  )

  const updateRebalanceData = (data: Partial<RebalanceData>) => {
    setRebalanceData((prev) => ({ ...prev, ...data }))
  }

  const currentStepIndex = progressSteps.findIndex((step) => step.path === location.pathname)
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1

  return (
    <RebalanceFlowContext.Provider value={{ rebalanceData, updateRebalanceData }}>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="dark:border-gray-800" style={{ background: 'transparent', borderBottom: '1px solid var(--tx-border-light, #F1F5F9)' }}>
          <div className="mx-auto max-w-[1200px] px-4 sm:px-12">
            <FlowProgress steps={progressSteps} currentStep={currentStep} />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-4">
          <Outlet />
        </div>
      </div>
    </RebalanceFlowContext.Provider>
  )
}

export default RebalanceFlowLayout
