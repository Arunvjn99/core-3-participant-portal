import { Outlet, useLocation } from "react-router-dom";
import FlowProgress from "../../components/FlowProgress";
import { useState, createContext, useContext } from "react";

interface RolloverData {
  previousEmployer?: string;
  planAdministrator?: string;
  accountNumber?: string;
  estimatedAmount?: number;
  rolloverType?: string;
  isCompatible?: boolean;
  allocation?: { fundName: string; percentage: number }[];
}

interface RolloverFlowContextType {
  rolloverData: RolloverData;
  updateRolloverData: (data: Partial<RolloverData>) => void;
}

const RolloverFlowContext = createContext<RolloverFlowContextType | undefined>(
  undefined
);

export function useRolloverFlow() {
  const context = useContext(RolloverFlowContext);
  if (!context) {
    return { rolloverData: {} as RolloverData, updateRolloverData: (_data: Partial<RolloverData>) => {} };
  }
  return context;
}

const steps = [
  { number: 1, label: "Plan Details", path: "/transactions/rollover" },
  { number: 2, label: "Validation", path: "/transactions/rollover/validation" },
  { number: 3, label: "Allocation", path: "/transactions/rollover/allocation" },
  { number: 4, label: "Documents", path: "/transactions/rollover/documents" },
  { number: 5, label: "Review", path: "/transactions/rollover/review" },
];

function RolloverFlowLayout() {
  const location = useLocation();
  const [rolloverData, setRolloverData] = useState<RolloverData>({});

  const updateRolloverData = (data: Partial<RolloverData>) => {
    setRolloverData((prev) => ({ ...prev, ...data }));
  };

  const currentStepIndex = steps.findIndex(
    (step) => step.path === location.pathname
  );
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;


  return (
    <RolloverFlowContext.Provider value={{ rolloverData, updateRolloverData }}>
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
    </RolloverFlowContext.Provider>
  );
}

export default RolloverFlowLayout
