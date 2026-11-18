import { motion } from "framer-motion";
import {
  FileEdit,
  Clock,
  HandCoins,
  DollarSign,
  Trash2,
  ChevronRight,
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
    description: "General Purpose Loan · $3,500",
    savedDate: "March 7, 2026",
    progress: 40,
    resumePath: "/transactions/loan/configuration",
  },
  {
    id: "draft-2",
    type: "Withdrawal",
    icon: <DollarSign className="w-[13px] h-[13px]" />,
    description: "Hardship Withdrawal · Medical",
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
          className="group flex items-center gap-3.5 border-t border-slate-200/80 py-3.5 first:border-t-0 first:pt-0 last:pb-0 dark:border-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20" aria-hidden>
            {draft.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-[14px] font-semibold leading-snug text-text-primary">{draft.description}</p>
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30">
                Draft
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-slate-600 dark:text-slate-300">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              <span>{draft.savedDate}</span>
              <span>· {draft.progress}% complete</span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuenow={draft.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${draft.description}: ${draft.progress}% complete`}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-[400ms] ease-in-out motion-reduce:transition-none" style={{ width: `${draft.progress}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate(draft.resumePath)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-white/5 dark:text-blue-300 dark:ring-white/15 dark:hover:bg-white/10"
              title="Resume"
              aria-label={`Resume: ${draft.description}`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-white/5 dark:text-slate-300 dark:ring-white/15 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              title="Delete"
              aria-label={`Delete: ${draft.description}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
export default DraftTransactions
