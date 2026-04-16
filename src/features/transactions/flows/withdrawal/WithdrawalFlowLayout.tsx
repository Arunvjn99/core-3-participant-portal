import { Outlet, useLocation } from "react-router-dom";
import FlowProgress from "../../components/FlowProgress";
import { useState, createContext, useContext } from "react";

interface WithdrawalData {
  type?: string;
  amount?: number;
  sources?: { name: string; amount: number }[];
  paymentMethod?: string;
  address?: string;
  grossNetElection?: string;
  federalWithholding?: number;
  stateWithholding?: number;
}

interface WithdrawalFlowContextType {
  withdrawalData: WithdrawalData;
  updateWithdrawalData: (data: Partial<WithdrawalData>) => void;
}

const WithdrawalFlowContext = createContext<WithdrawalFlowContextType | undefined>(undefined);

export function useWithdrawalFlow() {
  const context = useContext(WithdrawalFlowContext);
  if (!context) {
    return { withdrawalData: {} as WithdrawalData, updateWithdrawalData: (_data: Partial<WithdrawalData>) => {} };
  }
  return context;
}

const steps = [
  { number: 1, label: "Eligibility", path: "/transactions/withdrawal" },
  { number: 2, label: "Type", path: "/transactions/withdrawal/type" },
  { number: 3, label: "Source", path: "/transactions/withdrawal/source" },
  { number: 4, label: "Fees", path: "/transactions/withdrawal/fees" },
  { number: 5, label: "Payment", path: "/transactions/withdrawal/payment" },
  { number: 6, label: "Review", path: "/transactions/withdrawal/review" },
];

function WithdrawalFlowLayout() {
  const location = useLocation();
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({});

  const updateWithdrawalData = (data: Partial<WithdrawalData>) => {
    setWithdrawalData((prev) => ({ ...prev, ...data }));
  };

  const currentStepIndex = steps.findIndex((step) => step.path === location.pathname);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;


  return (
    <WithdrawalFlowContext.Provider value={{ withdrawalData, updateWithdrawalData }}>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        {/* Progress */}
        <div className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-700">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-12">
            <FlowProgress steps={steps} currentStep={currentStep} />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <Outlet />
        </div>
      </div>
    </WithdrawalFlowContext.Provider>
  );
}

export default WithdrawalFlowLayout
