import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  number: number;
  label: string;
  path: string;
}

interface FlowProgressProps {
  steps: Step[];
  currentStep: number;
}

function FlowProgress({ steps, currentStep }: FlowProgressProps) {
  return (
    <div className="w-full py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Mobile: compact horizontal stepper */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-slate-900 dark:text-white" style={{ fontSize: 12, fontWeight: 700 }}>
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-slate-500 dark:text-gray-400" style={{ fontSize: 12, fontWeight: 500 }}>
              {steps[currentStep - 1]?.label}
            </span>
          </div>
          {/* Progress bar */}
          <div className="overflow-hidden bg-slate-200 dark:bg-gray-700" style={{ height: 6, borderRadius: 3 }}>
            <motion.div
              className="brand-progress h-full"
              style={{ borderRadius: 3 }}
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {/* Step dots */}
          <div className="flex items-center justify-between mt-2 px-0.5">
            {steps.map((step) => {
              const isComplete = step.number < currentStep;
              const isCurrent = step.number === currentStep;
              return (
                <div
                  key={step.number}
                  className={`rounded-full transition-all duration-200 ${
                    isComplete || isCurrent ? "brand-bg" : "bg-slate-200 dark:bg-gray-600"
                  }`}
                  style={{
                    width: 8,
                    height: 8,
                    boxShadow: isCurrent ? "0 0 0 3px var(--brand-primary-ring)" : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Desktop: full stepper */}
        <div className="hidden sm:block relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 bg-slate-200 dark:bg-gray-700" style={{ height: 2 }}>
            <motion.div
              className="brand-progress h-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const isComplete = step.number < currentStep;
              const isCurrent = step.number === currentStep;

              return (
                <div key={step.number} className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`flex items-center justify-center mb-2 transition-all duration-200 ${
                      !isComplete && !isCurrent
                        ? "bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-600 text-slate-400 dark:text-gray-500"
                        : "text-white"
                    }`}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      background: isComplete || isCurrent ? 'var(--brand-primary)' : undefined,
                      boxShadow: isCurrent
                        ? '0 0 0 4px var(--brand-primary-ring), 0 4px 12px color-mix(in srgb, var(--brand-primary) 30%, transparent)'
                        : isComplete
                          ? '0 4px 12px color-mix(in srgb, var(--brand-primary) 30%, transparent)'
                          : undefined,
                    }}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{step.number}</span>
                    )}
                  </motion.div>
                  <p
                    className={`text-center ${
                      isCurrent
                        ? "text-slate-900 dark:text-white"
                        : isComplete
                          ? "text-slate-600 dark:text-gray-400"
                          : "text-slate-400 dark:text-gray-500"
                    }`}
                    style={{
                      fontSize: 12,
                      maxWidth: 120,
                      fontWeight: isCurrent ? 700 : isComplete ? 600 : 500,
                    }}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export default FlowProgress
