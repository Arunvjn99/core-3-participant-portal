import { motion } from "framer-motion";
import {
  FileEdit,
  Clock,
  HandCoins,
  DollarSign,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Draft {
  id: string;
  type: "Loan" | "Withdrawal" | "Transfer" | "Rollover";
  icon: React.ReactNode;
  description: string;
  savedDate: string;
  progress: number;
  resumePath: string;
}

const mockDrafts: Draft[] = [
  {
    id: "draft-1",
    type: "Loan",
    icon: <HandCoins className="w-[13px] h-[13px]" />,
    description: "General Purpose Loan — $3,500",
    savedDate: "March 7, 2026",
    progress: 40,
    resumePath: "/transactions/loan/configuration",
  },
  {
    id: "draft-2",
    type: "Withdrawal",
    icon: <DollarSign className="w-[13px] h-[13px]" />,
    description: "Hardship Withdrawal — Medical",
    savedDate: "March 4, 2026",
    progress: 20,
    resumePath: "/transactions/withdrawal/type",
  },
];

function DraftTransactions() {
  const navigate = useNavigate();

  if (mockDrafts.length === 0) {
    return (
      <div className="text-center py-6">
        <FileEdit className="w-8 h-8 mx-auto mb-2 text-slate-200 dark:text-gray-600" />
        <p className="text-slate-400 dark:text-gray-500" style={{ fontSize: 13, fontWeight: 500 }}>
          No draft transactions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mockDrafts.map((draft, idx) => (
        <motion.div
          key={draft.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08, duration: 0.3 }}
          className="flex items-center gap-3.5 group transition-all duration-200 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-600"
          style={{ padding: "14px 16px", borderRadius: 12 }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 30, height: 30, borderRadius: 8, background: "var(--c-blue-tint)", color: "var(--brand-primary)" }}
          >
            {draft.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p
                className="truncate text-slate-900 dark:text-white"
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                {draft.description}
              </p>
              <span
                className="flex-shrink-0"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: "var(--c-blue-tint)",
                  color: "var(--brand-primary)",
                }}
              >
                Draft
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-300 dark:text-gray-600" />
              <span className="text-slate-400 dark:text-gray-500" style={{ fontSize: 11, fontWeight: 500 }}>
                {draft.savedDate}
              </span>
              <span className="text-slate-400 dark:text-gray-500" style={{ fontSize: 11, fontWeight: 500 }}>
                · {draft.progress}% complete
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="mt-2.5 overflow-hidden bg-slate-200 dark:bg-gray-700"
              style={{ height: 6, borderRadius: 3 }}
            >
              <div
                className="h-full transition-all duration-[400ms] ease-in-out"
                style={{
                  width: `${draft.progress}%`,
                  borderRadius: 3,
                  background: "linear-gradient(90deg, var(--brand-primary), var(--brand-primary-hover))",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => navigate(draft.resumePath)}
              className="flex items-center justify-center transition-all duration-200 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
              title="Resume"
              style={{ width: 32, height: 32, borderRadius: 8, color: "var(--brand-primary)" }}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              className="flex items-center justify-center transition-all duration-200 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-700"
              title="Delete"
              style={{ width: 32, height: 32, borderRadius: 8, color: "var(--c-text-muted)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
export default DraftTransactions
