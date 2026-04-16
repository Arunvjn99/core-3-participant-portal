import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

interface AttentionItem {
  id: string;
  title: string;
  description: string;
  amount?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Second line: Amount + middle dot + description (full sentence, wraps naturally). */
function buildDetailLine(item: AttentionItem): string {
  const parts: string[] = [];
  if (item.amount) parts.push(`Amount: ${item.amount}`);
  parts.push(item.description);
  return parts.join(" · ");
}

interface AttentionRequiredTimelineProps {
  onResolve?: () => void;
}

function AttentionRequiredTimeline({ onResolve }: AttentionRequiredTimelineProps) {
  const [items] = useState<AttentionItem[]>([
    {
      id: "loan-docs",
      title: "Loan Request - Action Required",
      description: "Upload required documents to continue processing your loan request.",
      amount: "$5,000",
      actionLabel: "Resolve",
      onAction: onResolve,
    },
    {
      id: "withdrawal-verify",
      title: "Withdrawal — verify bank details",
      description: "Confirm the bank account on file before we release funds.",
      amount: "$2,500",
      actionLabel: "Review",
      onAction: onResolve,
    },
  ]);

  if (items.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center dark:border-gray-600 dark:bg-gray-900/50">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-gray-600" />
        <p className="text-[13px] font-medium text-slate-400 dark:text-gray-500">No action required</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06, duration: 0.25 }}
          className="flex min-h-0 flex-row items-start gap-3 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/25"
        >
          <div
            className="flex shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
            style={{ width: 36, height: 36 }}
          >
            <AlertCircle className="h-5 w-5" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-1.5">
              <span
                className="mt-[5px] mr-1.5 shrink-0 rounded-full bg-[#F59E0B]"
                style={{ width: 7, height: 7 }}
                aria-hidden
              />
              <h3 className="min-w-0 flex-1 text-[13px] font-semibold leading-snug tracking-tight text-slate-900 line-clamp-2 break-words dark:text-white">
                {item.title}
              </h3>
            </div>

            <p className="mt-1.5 break-words text-[12px] font-normal leading-relaxed text-[#92400E] dark:text-amber-200/95">
              {buildDetailLine(item)}
            </p>

            {item.actionLabel && item.onAction ? (
              <div className="mt-2 flex justify-end border-t border-amber-200/70 pt-2 dark:border-amber-800/50">
                <button
                  type="button"
                  onClick={item.onAction}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-amber-200/60 dark:text-amber-200 dark:hover:bg-amber-900/40"
                >
                  {item.actionLabel}
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default AttentionRequiredTimeline;
