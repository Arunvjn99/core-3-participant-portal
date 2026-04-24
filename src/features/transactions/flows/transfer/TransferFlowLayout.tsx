import { Outlet, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FlowProgress from '../../components/FlowProgress'

interface Fund {
  name: string
  currentAllocation: number
  newAllocation: number
}

interface TransferData {
  transferType?: string
  funds?: Fund[]
}

interface TransferFlowContextType {
  transferData: TransferData
  updateTransferData: (data: Partial<TransferData>) => void
}

const TransferFlowContext = createContext<TransferFlowContextType | undefined>(undefined)

export function useTransferFlow() {
  const context = useContext(TransferFlowContext)
  if (!context) {
    return { transferData: {} as TransferData, updateTransferData: (_data: Partial<TransferData>) => {} }
  }
  return context
}

const TRANSFER_STEP_DEFS = [
  { number: 1, path: '/transactions/transfer', stepKey: 'type' },
  { number: 2, path: '/transactions/transfer/source', stepKey: 'source' },
  { number: 3, path: '/transactions/transfer/destination', stepKey: 'destination' },
  { number: 4, path: '/transactions/transfer/amount', stepKey: 'amount' },
  { number: 5, path: '/transactions/transfer/impact', stepKey: 'impact' },
  { number: 6, path: '/transactions/transfer/review', stepKey: 'review' },
] as const

function TransferFlowLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const [transferData, setTransferData] = useState<TransferData>({})

  const progressSteps = useMemo(
    () => TRANSFER_STEP_DEFS.map((s) => ({ number: s.number, path: s.path, label: t(`flows.steps.${s.stepKey}`) })),
    [t],
  )

  const updateTransferData = (data: Partial<TransferData>) => {
    setTransferData((prev) => ({ ...prev, ...data }))
  }

  const currentStepIndex = progressSteps.findIndex((step) => step.path === location.pathname)
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1

  return (
    <TransferFlowContext.Provider value={{ transferData, updateTransferData }}>
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
    </TransferFlowContext.Provider>
  )
}

export default TransferFlowLayout
