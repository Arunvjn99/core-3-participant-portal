import { Outlet, useLocation } from "react-router-dom";
import FlowProgress from "../../components/FlowProgress";
import { useState, createContext, useContext } from "react";

interface LoanData {
  amount?: number;
  tenure?: number;
  loanType?: string;
  reason?: string;
  disbursementMethod?: string;
  bankAccount?: string;
  repaymentFrequency?: string;
  repaymentStartDate?: string;
  repaymentMethod?: string;
  bankAccountNumber?: string;
  routingNumber?: string;
  accountType?: string;
}

interface LoanFlowContextType {
  loanData: LoanData;
  updateLoanData: (data: Partial<LoanData>) => void;
}

const LoanFlowContext = createContext<LoanFlowContextType | undefined>(undefined);

export function useLoanFlow() {
  const context = useContext(LoanFlowContext);
  if (!context) {
    // Return safe defaults during hot reload or when rendered outside provider
    return {
      loanData: {} as LoanData,
      updateLoanData: (_data: Partial<LoanData>) => {} };
  }
  return context;
}

const steps = [
  { number: 1, label: "Eligibility", path: "/transactions/loan" },
  { number: 2, label: "Simulator", path: "/transactions/loan/simulator" },
  { number: 3, label: "Configuration", path: "/transactions/loan/configuration" },
  { number: 4, label: "Fees", path: "/transactions/loan/fees" },
  { number: 5, label: "Documents", path: "/transactions/loan/documents" },
  { number: 6, label: "Review", path: "/transactions/loan/review" },
];

function LoanFlowLayout() {
  const location = useLocation();
  const [loanData, setLoanData] = useState<LoanData>({});

  const updateLoanData = (data: Partial<LoanData>) => {
    setLoanData((prev) => ({ ...prev, ...data }));
  };

  const currentStepIndex = steps.findIndex((step) => step.path === location.pathname);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;


  return (
    <LoanFlowContext.Provider value={{ loanData, updateLoanData }}>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950">

        {/* Progress */}
        <div
          style={{
            background: "transparent",
            borderBottom: "1px solid var(--tx-border-light, #F1F5F9)" }}
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-12">
            <FlowProgress steps={steps} currentStep={currentStep} />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <Outlet />
        </div>
      </div>
    </LoanFlowContext.Provider>
  );
}

export default LoanFlowLayout
