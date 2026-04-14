import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTransferFlow } from "./TransferFlowLayout";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, DollarSign, Percent, Info } from "lucide-react";

function TransferAmount() {
  const navigate = useNavigate();
  const { updateTransferData } = useTransferFlow();

  const [method, setMethod] = useState<"dollar" | "percent">("dollar");
  const [amount, setAmount] = useState("");
  const [percentage, setPercentage] = useState("");

  const maxBalance = 12000;
  const parsedAmount =
    method === "dollar"
      ? parseFloat(amount.replace(/,/g, "")) || 0
      : (parseFloat(percentage) / 100) * maxBalance || 0;
  const effectivePercent =
    method === "percent"
      ? parseFloat(percentage) || 0
      : ((parsedAmount / maxBalance) * 100) || 0;

  const isValid =
    parsedAmount > 0 &&
    parsedAmount <= maxBalance &&
    effectivePercent <= 100;

  const handleContinue = () => {
    // Update transfer data with allocation info
    const funds = [
      {
        name: "Large Cap Equity Fund",
        currentAllocation: 40,
        newAllocation: Math.max(0, 40 - Math.round(effectivePercent * 0.4)),
      },
      {
        name: "International Growth Fund",
        currentAllocation: 25,
        newAllocation:
          25 + Math.round(effectivePercent * 0.6),
      },
      {
        name: "Stable Value Bond Fund",
        currentAllocation: 20,
        newAllocation: 20,
      },
      {
        name: "Target Date 2050 Fund",
        currentAllocation: 15,
        newAllocation: 15,
      },
    ];
    updateTransferData({ funds });
    navigate("/transactions/transfer/impact");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Transfer Amount
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Specify how much you'd like to transfer by dollar amount or
          percentage.
        </p>
      </motion.div>

      {/* Method Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
      >
        <div className="flex items-center gap-1 p-1 w-fit" style={{ background: "transparent", borderRadius: 12, border: "1px solid var(--tx-border-light, #F1F5F9)" }}>
          {([["dollar", "Dollar Amount", <DollarSign key="d" className="w-3.5 h-3.5" />], ["percent", "Percentage", <Percent key="p" className="w-3.5 h-3.5" />]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setMethod(id as "dollar" | "percent")}
              className="flex items-center gap-1.5 transition-all duration-200"
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: method === id ? 700 : 500,
                background: method === id ? "#fff" : "transparent",
                color: method === id ? "#2563EB" : "#64748B",
                boxShadow: method === id ? "0 1px 3px rgba(0,0,0,0.06)" : undefined,
                border: method === id ? "1px solid #E2E8F0" : "1px solid transparent",
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Amount Input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      >
        <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "24px 28px" }}>
          {method === "dollar" ? (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Transfer Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-medium">
                  $
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
                  }
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-4 text-3xl font-semibold rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  {effectivePercent.toFixed(1)}% of source balance
                </span>
                <button
                  onClick={() => setAmount(maxBalance.toString())}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Transfer All (${maxBalance.toLocaleString()})
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Transfer Percentage
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={percentage}
                  onChange={(e) =>
                    setPercentage(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="0"
                  className="w-full pr-10 pl-4 py-4 text-3xl font-semibold rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-medium">
                  %
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  ≈ ${parsedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setPercentage(pct.toString())}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Balance Bar */}
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--tx-border-light, #F1F5F9)" }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>Source Balance</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "inherit" }}>
                ${maxBalance.toLocaleString()}
              </span>
            </div>
            <div className="overflow-hidden" style={{ height: 8, borderRadius: 4, background: "var(--tx-track, #E2E8F0)" }}>
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${Math.min(100, effectivePercent)}%`,
                  borderRadius: 4,
                  background: effectivePercent <= 100 ? "#2563EB" : "#EF4444",
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {parsedAmount > maxBalance && (
        <div
          className="flex items-center gap-2"
          style={{ background: "rgba(220,38,38,0.1)", border: "1px solid var(--c-border-red)", borderRadius: 14, padding: "14px 16px" }}
        >
          <Info className="flex-shrink-0" style={{ width: 16, height: 16, color: "#EF4444" }} />
          <p style={{ fontSize: 12, fontWeight: 500, color: "#B91C1C" }}>
            Transfer amount exceeds available balance of $
            {maxBalance.toLocaleString()}.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/transfer/destination")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview Impact
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default TransferAmount
