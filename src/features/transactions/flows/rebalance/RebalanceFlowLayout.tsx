import { Outlet, useLocation } from "react-router-dom";
import FlowProgress from "../../components/FlowProgress";
import { useState, createContext, useContext } from "react";

interface Fund {
  name: string;
  ticker: string;
  currentAllocation: number;
  targetAllocation: number;
  currentValue: number;
}

interface RebalanceData {
  funds?: Fund[];
}

interface RebalanceFlowContextType {
  rebalanceData: RebalanceData;
  updateRebalanceData: (data: Partial<RebalanceData>) => void;
}

const RebalanceFlowContext = createContext<RebalanceFlowContextType | undefined>(
  undefined
);

export function useRebalanceFlow() {
  const context = useContext(RebalanceFlowContext);
  if (!context) {
    return { rebalanceData: {} as RebalanceData, updateRebalanceData: (_data: Partial<RebalanceData>) => {} };
  }
  return context;
}

const steps = [
  { number: 1, label: "Current", path: "/transactions/rebalance" },
  { number: 2, label: "Target", path: "/transactions/rebalance/adjust" },
  { number: 3, label: "Trades", path: "/transactions/rebalance/trades" },
  { number: 4, label: "Review", path: "/transactions/rebalance/review" },
];

function RebalanceFlowLayout() {
  const location = useLocation();
  const [rebalanceData, setRebalanceData] = useState<RebalanceData>({});

  const updateRebalanceData = (data: Partial<RebalanceData>) => {
    setRebalanceData((prev) => ({ ...prev, ...data }));
  };

  const currentStepIndex = steps.findIndex(
    (step) => step.path === location.pathname
  );
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

  return (
    <RebalanceFlowContext.Provider value={{ rebalanceData, updateRebalanceData }}>
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
    </RebalanceFlowContext.Provider>
  );
}

export default RebalanceFlowLayout
