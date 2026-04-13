import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useState } from "react";


interface AttentionItem {
  id: string;
  title: string;
  description: string;
  amount?: string;
  currentStep: "Submitted" | "Processing" | "Approved" | "Funds Sent";
  actionLabel?: string;
  onAction?: () => void;
}

const statusSteps = ["Submitted", "Processing", "Approved", "Funds Sent"];

function InlineTimeline(_props: { currentStep?: string }) {
  return (
    <div className="flex items-center gap-0 w-full min-w-[200px]">
      {statusSteps.map((_step) => {
        return null;
      })}
    </div>
  );
}

interface AttentionRequiredTimelineProps {
  onResolve?: () => void;
}

function AttentionRequiredTimeline({ onResolve }: AttentionRequiredTimelineProps) {
  const [items, _setItems] = useState<AttentionItem[]>([
    {
      id: "1",
      title: "Loan Request - Action Required",
      description: "Upload required documents to continue processing your loan request.",
      amount: "$5,000",
      currentStep: "Processing",
      actionLabel: "Resolve Issue",
      onAction: onResolve,
    },
    {
      id: "2",
      title: "Loan Request - Action Required",
      description: "Upload required documents to continue processing your loan request.",
      amount: "$5,000",
      currentStep: "Processing",
      actionLabel: "Resolve Issue",
      onAction: onResolve,
    },
  ]);

  if (items.length === 0) {
    return (
      <div
        className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700"
        style={{ borderRadius: 16, padding: "24px 28px" }}
      >
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-200 dark:text-gray-600" />
          <p className="text-slate-400 dark:text-gray-500" style={{ fontSize: 13, fontWeight: 500 }}>
            No action required
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700"
      style={{ borderRadius: 16, padding: "14px 18px" }}
    >
      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            style={{
              background: "linear-gradient(135deg, #FFFBEB, #FFF7ED)",
              border: "1px solid #FED7AA",
              borderRadius: 12,
              padding: "10px 16px",
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
              {/* Left: Icon + Info */}
              <div className="flex items-center gap-2.5 lg:flex-1 min-w-0">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 26, height: 26, borderRadius: 7, background: "#FFEDD5", color: "#B45309" }}
                >
                  <AlertCircle className="w-[13px] h-[13px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full" style={{ width: 5, height: 5, background: "#F59E0B" }} />
                    <p
                      className="text-slate-900 dark:text-white"
                      style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.2 }}
                    >
                      {item.title}
                    </p>
                    {item.amount && (
                      <span
                        className="text-slate-500 dark:text-gray-400"
                        style={{ fontSize: 11, fontWeight: 500 }}
                      >
                        Amount: {item.amount}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-slate-600 dark:text-gray-300"
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      lineHeight: 1.1,
                      marginTop: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Right: Timeline */}
              <div className="lg:flex-shrink-0 lg:w-[260px]">
                <InlineTimeline currentStep={item.currentStep} />
              </div>
            </div>

            {/* Action Button */}
            {item.onAction && null}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
export default AttentionRequiredTimeline
