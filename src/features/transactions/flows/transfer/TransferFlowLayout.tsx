import { Outlet, useLocation } from "react-router-dom";
import FlowProgress from "../../components/FlowProgress";
import { useState, createContext, useContext } from "react";

interface Fund {
  name: string;
  currentAllocation: number;
  newAllocation: number;
}

interface TransferData {
  transferType?: string;
  funds?: Fund[];
}

interface TransferFlowContextType {
  transferData: TransferData;
  updateTransferData: (data: Partial<TransferData>) => void;
}

const TransferFlowContext = createContext<TransferFlowContextType | undefined>(
  undefined
);

export function useTransferFlow() {
  const context = useContext(TransferFlowContext);
  if (!context) {
    return { transferData: {} as TransferData, updateTransferData: (_data: Partial<TransferData>) => {} };
  }
  return context;
}

const steps = [
  { number: 1, label: "Type", path: "/transactions/transfer" },
  { number: 2, label: "Source", path: "/transactions/transfer/source" },
  { number: 3, label: "Destination", path: "/transactions/transfer/destination" },
  { number: 4, label: "Amount", path: "/transactions/transfer/amount" },
  { number: 5, label: "Impact", path: "/transactions/transfer/impact" },
  { number: 6, label: "Review", path: "/transactions/transfer/review" },
];

function TransferFlowLayout() {
  const location = useLocation();
  const [transferData, setTransferData] = useState<TransferData>({});

  const updateTransferData = (data: Partial<TransferData>) => {
    setTransferData((prev) => ({ ...prev, ...data }));
  };

  const currentStepIndex = steps.findIndex(
    (step) => step.path === location.pathname
  );
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

  return (
    <TransferFlowContext.Provider value={{ transferData, updateTransferData }}>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
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
    </TransferFlowContext.Provider>
  );
}

export default TransferFlowLayout
