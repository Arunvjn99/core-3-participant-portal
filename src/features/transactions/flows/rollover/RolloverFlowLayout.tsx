import { Outlet, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FlowProgress from '../../components/FlowProgress'

interface RolloverData {
  previousEmployer?: string
  planAdministrator?: string
  accountNumber?: string
  estimatedAmount?: number
  rolloverType?: string
  isCompatible?: boolean
  allocation?: { fundName: string; percentage: number }[]
}

interface RolloverFlowContextType {
  rolloverData: RolloverData
  updateRolloverData: (data: Partial<RolloverData>) => void
}

const RolloverFlowContext = createContext<RolloverFlowContextType | undefined>(undefined)

export function useRolloverFlow() {
  const context = useContext(RolloverFlowContext)
  if (!context) {
    return { rolloverData: {} as RolloverData, updateRolloverData: (_data: Partial<RolloverData>) => {} }
  }
  return context
}

const ROLLOVER_STEP_DEFS = [
  { number: 1, path: '/transactions/rollover', stepKey: 'plan_details' },
  { number: 2, path: '/transactions/rollover/validation', stepKey: 'validation' },
  { number: 3, path: '/transactions/rollover/allocation', stepKey: 'allocation' },
  { number: 4, path: '/transactions/rollover/documents', stepKey: 'documents' },
  { number: 5, path: '/transactions/rollover/review', stepKey: 'review' },
] as const

function RolloverFlowLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const [rolloverData, setRolloverData] = useState<RolloverData>({})

  const progressSteps = useMemo(
    () => ROLLOVER_STEP_DEFS.map((s) => ({ number: s.number, path: s.path, label: t(`flows.steps.${s.stepKey}`) })),
    [t],
  )

  const updateRolloverData = (data: Partial<RolloverData>) => {
    setRolloverData((prev) => ({ ...prev, ...data }))
  }

  const currentStepIndex = progressSteps.findIndex((step) => step.path === location.pathname)
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1

  return (
    <RolloverFlowContext.Provider value={{ rolloverData, updateRolloverData }}>
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
    </RolloverFlowContext.Provider>
  )
}

export default RolloverFlowLayout
