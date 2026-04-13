import { useState } from "react";
import {
  Eye,
  Download,
  ArrowLeftRight,
  HandCoins,
  DollarSign,
  RefreshCcw,
  Repeat,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";

interface Transaction {
  id: string;
  type: "Loan" | "Withdrawal" | "Transfer" | "Rebalance" | "Rollover";
  amount: string;
  status: "Completed" | "Processing" | "Cancelled";
  date: string;
  description: string;
  transactionId: string;
  processedBy: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "4",
    type: "Transfer",
    amount: "$1,500",
    status: "Completed",
    date: "March 5, 2026",
    description: "Reallocation from Conservative to Growth Fund",
    transactionId: "TRX-2026-0305-001",
    processedBy: "System",
  },
  {
    id: "5",
    type: "Loan",
    amount: "$2,000",
    status: "Completed",
    date: "February 28, 2026",
    description: "General Purpose Loan - 12 month term",
    transactionId: "LN-2026-0228-045",
    processedBy: "Plan Administrator",
  },
  {
    id: "6",
    type: "Withdrawal",
    amount: "$1,000",
    status: "Completed",
    date: "February 15, 2026",
    description: "Hardship withdrawal for medical expenses",
    transactionId: "WD-2026-0215-023",
    processedBy: "Compliance Team",
  },
  {
    id: "7",
    type: "Rebalance",
    amount: "—",
    status: "Completed",
    date: "January 20, 2026",
    description: "Quarterly portfolio rebalance to target allocation",
    transactionId: "RB-2026-0120-012",
    processedBy: "System",
  },
  {
    id: "8",
    type: "Transfer",
    amount: "$800",
    status: "Completed",
    date: "January 10, 2026",
    description: "Moved funds to International Equity Fund",
    transactionId: "TRX-2026-0110-088",
    processedBy: "System",
  },
  {
    id: "9",
    type: "Withdrawal",
    amount: "$500",
    status: "Processing",
    date: "January 5, 2026",
    description: "In-service distribution request",
    transactionId: "WD-2026-0105-067",
    processedBy: "Pending Review",
  },
  {
    id: "10",
    type: "Rollover",
    amount: "$18,500",
    status: "Completed",
    date: "December 12, 2025",
    description: "Rollover from Acme Corp 401(k) via Fidelity",
    transactionId: "RO-2025-1212-003",
    processedBy: "Plan Administrator",
  },
];

type FilterType = "All" | "Loans" | "Withdrawals" | "Transfers" | "Rebalance" | "Rollovers";

const typeIcons: Record<Transaction["type"], React.ReactNode> = {
  Loan: <HandCoins className="w-[13px] h-[13px]" />,
  Withdrawal: <DollarSign className="w-[13px] h-[13px]" />,
  Transfer: <ArrowLeftRight className="w-[13px] h-[13px]" />,
  Rebalance: <RefreshCcw className="w-[13px] h-[13px]" />,
  Rollover: <Repeat className="w-[13px] h-[13px]" />,
};

const typeColors: Record<Transaction["type"], { bg: string; color: string }> = {
  Loan: { bg: "#EFF6FF", color: "#2563EB" },
  Withdrawal: { bg: "#FEF2F2", color: "#DC2626" },
  Transfer: { bg: "#EFF6FF", color: "#2563EB" },
  Rebalance: { bg: "#F0FDF4", color: "#10B981" },
  Rollover: { bg: "#EFF6FF", color: "#2563EB" },
};

function RecentTransactionsCompact({ maxItems }: { maxItems?: number } = {}) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("All");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const filters: FilterType[] = ["All", "Loans", "Withdrawals", "Transfers", "Rebalance", "Rollovers"];

  const filteredTransactions = mockTransactions.filter((transaction) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Loans") return transaction.type === "Loan";
    if (selectedFilter === "Withdrawals") return transaction.type === "Withdrawal";
    if (selectedFilter === "Transfers") return transaction.type === "Transfer";
    if (selectedFilter === "Rebalance") return transaction.type === "Rebalance";
    if (selectedFilter === "Rollovers") return transaction.type === "Rollover";
    return true;
  });

  const displayedTransactions = maxItems ? filteredTransactions.slice(0, maxItems) : filteredTransactions;

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "Completed": return { bg: "#ECFDF5", color: "#059669", dot: "#10B981" };
      case "Processing": return { bg: "#EFF6FF", color: "#2563EB", dot: "#3B82F6" };
      case "Cancelled": return { bg: "#F8FAFC", color: "#64748B", dot: "#94A3B8" };
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        {/* Desktop filters */}
        <div
          className="hidden sm:flex items-center gap-1 p-1 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700"
          style={{ borderRadius: 12 }}
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`transition-all duration-200 ${
                selectedFilter === filter
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-gray-600"
                  : "bg-transparent text-slate-500 dark:text-gray-400 border border-transparent"
              }`}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: selectedFilter === filter ? 700 : 500,
                boxShadow: selectedFilter === filter ? "0 1px 3px rgba(0,0,0,0.06)" : undefined,
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Mobile filter dropdown */}
        <div className="sm:hidden relative w-full">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="w-full flex items-center justify-between bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300"
            style={{ padding: "9px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
          >
            <span>Filter: {selectedFilter}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform text-slate-400 dark:text-gray-500 ${mobileFilterOpen ? "rotate-180" : ""}`}
            />
          </button>
          {mobileFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 z-20 overflow-hidden bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700"
              style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
            >
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setSelectedFilter(filter); setMobileFilterOpen(false); }}
                  className={`w-full text-left transition-colors ${
                    selectedFilter === filter
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                      : "bg-transparent text-slate-600 dark:text-gray-300"
                  }`}
                  style={{ padding: "10px 16px", fontSize: 13, fontWeight: selectedFilter === filter ? 700 : 500 }}
                >
                  {filter}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <span className="hidden sm:block text-slate-400 dark:text-gray-500" style={{ fontSize: 12, fontWeight: 500 }}>
          Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {displayedTransactions.map((transaction, idx) => {
          const badge = getStatusBadge(transaction.status);
          const tc = typeColors[transaction.type];
          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800"
              style={{ padding: "14px 16px", borderRadius: 14 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex items-center justify-center"
                    style={{ width: 30, height: 30, borderRadius: 8, background: tc.bg, color: tc.color }}
                  >
                    {typeIcons[transaction.type]}
                  </span>
                  <div>
                    <p className="text-slate-900 dark:text-white" style={{ fontSize: 13, fontWeight: 700 }}>
                      {transaction.type}
                    </p>
                    <p className="font-mono text-slate-400 dark:text-gray-500" style={{ fontSize: 10, fontWeight: 500 }}>
                      {transaction.transactionId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-900 dark:text-white" style={{ fontSize: 14, fontWeight: 800 }}>
                    {transaction.amount}
                  </p>
                  <span
                    className="inline-flex items-center gap-1"
                    style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: badge.bg, color: badge.color,
                    }}
                  >
                    <span
                      className={`rounded-full ${transaction.status === "Processing" ? "animate-pulse" : ""}`}
                      style={{ width: 5, height: 5, background: badge.dot }}
                    />
                    {transaction.status}
                  </span>
                </div>
              </div>

              <p
                className="line-clamp-2 text-slate-600 dark:text-gray-300"
                style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}
              >
                {transaction.description}
              </p>

              <div
                className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-gray-800"
              >
                <span className="text-slate-400 dark:text-gray-500" style={{ fontSize: 11, fontWeight: 500 }}>
                  {transaction.date}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="flex items-center justify-center transition-all duration-200 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-400"
                    title="View Details"
                    style={{ width: 28, height: 28, borderRadius: 7 }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="flex items-center justify-center transition-all duration-200 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-400"
                    title="Download Receipt"
                    style={{ width: 28, height: 28, borderRadius: 7 }}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400 dark:text-gray-500" style={{ fontSize: 13, fontWeight: 500 }}>
              No transactions found
            </p>
          </div>
        )}

        <div className="text-center pt-1">
          <span className="text-slate-400 dark:text-gray-500" style={{ fontSize: 11, fontWeight: 500 }}>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div
        className="hidden sm:block overflow-x-auto border border-slate-100 dark:border-gray-800"
        style={{ borderRadius: 14 }}
      >
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-800 border-b border-slate-100 dark:border-gray-700">
              {["Type", "Description", "Amount", "Status", "Date"].map((header) => (
                <th
                  key={header}
                  className="text-left uppercase text-slate-500 dark:text-gray-400"
                  style={{ padding: "12px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.5px" }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedTransactions.map((transaction, idx) => {
              const badge = getStatusBadge(transaction.status);
              const tc = typeColors[transaction.type];
              return (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group transition-colors duration-200 border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50"
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center justify-center"
                        style={{ width: 30, height: 30, borderRadius: 8, background: tc.bg, color: tc.color, fontSize: 13, fontWeight: 700 }}
                      >
                        {typeIcons[transaction.type]}
                      </span>
                      <span className="text-slate-900 dark:text-white" style={{ fontSize: 13, fontWeight: 600 }}>
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", maxWidth: 220 }}>
                    <span className="truncate block text-slate-600 dark:text-gray-300" style={{ fontSize: 13, fontWeight: 500 }}>
                      {transaction.description}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="text-slate-900 dark:text-white" style={{ fontSize: 13, fontWeight: 700 }}>
                      {transaction.amount}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                        background: badge.bg, color: badge.color,
                      }}
                    >
                      <span
                        className={`rounded-full ${transaction.status === "Processing" ? "animate-pulse" : ""}`}
                        style={{ width: 6, height: 6, background: badge.dot }}
                      />
                      {transaction.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="text-slate-500 dark:text-gray-400" style={{ fontSize: 12, fontWeight: 500 }}>
                      {transaction.date}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 dark:text-gray-500" style={{ fontSize: 13, fontWeight: 500 }}>
              No transactions found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default RecentTransactionsCompact
