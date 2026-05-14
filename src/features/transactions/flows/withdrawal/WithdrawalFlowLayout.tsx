import { Outlet, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FlowProgress from '../../components/FlowProgress'

interface WithdrawalData {
  type?: string
  amount?: number
  sources?: { name: string; amount: number }[]
  paymentMethod?: string
  address?: string
  grossNetElection?: string
  federalWithholding?: number
  stateWithholding?: number
}

interface WithdrawalFlowContextType {
  withdrawalData: WithdrawalData
  updateWithdrawalData: (data: Partial<WithdrawalData>) => void
}

const WithdrawalFlowContext = createContext<WithdrawalFlowContextType | undefined>(undefined)

export function useWithdrawalFlow() {
  const context = useContext(WithdrawalFlowContext)
  if (!context) {
    return { withdrawalData: {} as WithdrawalData, updateWithdrawalData: (_data: Partial<WithdrawalData>) => {} }
  }
  return context
}

const WITHDRAWAL_STEP_DEFS = [
  { number: 1, path: '/transactions/withdrawal', stepKey: 'eligibility' },
  { number: 2, path: '/transactions/withdrawal/type', stepKey: 'type' },
  { number: 3, path: '/transactions/withdrawal/source', stepKey: 'source' },
  { number: 4, path: '/transactions/withdrawal/fees', stepKey: 'fees' },
  { number: 5, path: '/transactions/withdrawal/payment', stepKey: 'payment' },
  { number: 6, path: '/transactions/withdrawal/review', stepKey: 'review' },
] as const

function WithdrawalFlowLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({})

  const progressSteps = useMemo(
    () => WITHDRAWAL_STEP_DEFS.map((s) => ({ number: s.number, path: s.path, label: t(`flows.steps.${s.stepKey}`) })),
    [t],
  )

  const updateWithdrawalData = (data: Partial<WithdrawalData>) => {
    setWithdrawalData((prev) => ({ ...prev, ...data }))
  }

  const currentStepIndex = progressSteps.findIndex((step) => step.path === location.pathname)
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1

  return (
    <WithdrawalFlowContext.Provider value={{ withdrawalData, updateWithdrawalData }}>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="dark:border-gray-800" style={{ background: 'transparent', borderBottom: '1px solid var(--border-light)' }}>
          <div className="mx-auto max-w-[1200px] px-4 sm:px-12">
            <FlowProgress steps={progressSteps} currentStep={currentStep} />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-4">
          <Outlet />
        </div>
      </div>
    </WithdrawalFlowContext.Provider>
  )
}

export default WithdrawalFlowLayout
