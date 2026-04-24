import { Outlet, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FlowProgress from '../../components/FlowProgress'

interface LoanData {
  amount?: number
  tenure?: number
  selectedLoanType?: string
  selectedLoanTypeId?: 'general' | 'home' | 'refinance'
  selectedLoanPurpose?: string
  monthlyPayment?: number
  totalInterest?: number
  totalPayback?: number
  payoffDate?: string
  loanType?: string
  reason?: string
  disbursementMethod?: string
  bankAccount?: string
  repaymentFrequency?: string
  repaymentStartDate?: string
  repaymentMethod?: string
  bankAccountNumber?: string
  routingNumber?: string
  accountType?: string
}

interface LoanFlowContextType {
  loanData: LoanData
  updateLoanData: (data: Partial<LoanData>) => void
}

const LoanFlowContext = createContext<LoanFlowContextType | undefined>(undefined)

export function useLoanFlow() {
  const context = useContext(LoanFlowContext)
  if (!context) {
    return {
      loanData: {} as LoanData,
      updateLoanData: (_data: Partial<LoanData>) => {},
    }
  }
  return context
}

const LOAN_STEP_DEFS = [
  { number: 1, path: '/transactions/loan', stepKey: 'eligibility' },
  { number: 2, path: '/transactions/loan/simulator', stepKey: 'simulator' },
  { number: 3, path: '/transactions/loan/configuration', stepKey: 'configuration' },
  { number: 4, path: '/transactions/loan/fees', stepKey: 'fees' },
  { number: 5, path: '/transactions/loan/documents', stepKey: 'documents' },
  { number: 6, path: '/transactions/loan/review', stepKey: 'review' },
] as const

function LoanFlowLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const [loanData, setLoanData] = useState<LoanData>({})

  const progressSteps = useMemo(
    () => LOAN_STEP_DEFS.map((s) => ({ number: s.number, path: s.path, label: t(`flows.steps.${s.stepKey}`) })),
    [t],
  )

  const updateLoanData = (data: Partial<LoanData>) => {
    setLoanData((prev) => ({ ...prev, ...data }))
  }

  const currentStepIndex = progressSteps.findIndex((step) => step.path === location.pathname)
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1

  return (
    <LoanFlowContext.Provider value={{ loanData, updateLoanData }}>
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
    </LoanFlowContext.Provider>
  )
}

export default LoanFlowLayout
